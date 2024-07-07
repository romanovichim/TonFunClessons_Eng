# Lesson 9 Jettons - TON fungible tokens

## Foreword - why tokens and standards are needed

#### What is a token

A token is a unit of account for some digital asset in some network. It is important to note that a token does not usually mean a cryptocurrency, but a record distributed on a blockchain that is managed using smart contracts. The smart contract contains the values of balances on the accounts of token holders, and the smart contract also provides the ability to transfer tokens from one account to another.

#### What is a fungible and nonfungible token?

One of the possible classifications of tokens is the classification by fungibility.

**Fungible Tokens** are assets that are not unique and can be easily exchanged for another asset of the same type. Such tokens are made in such a way that each token is equivalent to the next token.

**Non-fungible tokens** are assets, each instance of which is unique (specific) and cannot be replaced by another similar asset. A non-fungible token is some kind of digital object certificate with the ability to transfer the certificate through some mechanism.

#### Why do we need a token standard and what is it

In order for tokens to be used in other applications (from wallets to decentralized exchanges), smart contract interface standards for tokens are being introduced.

> In this case, the interface is the signature (syntactic construction of the function declaration) of functions without the implementation of the function itself.

#### Where does the "approval" of the standard take place

Blockchains usually have separate pages on github or on a platform with the necessary mechanics, where you can make proposals on standards.

In TON, this is [github repository](https://github.com/ton-blockchain/TIPs).

> Important, these pages are not a forum or a place for free discussion of the blockchain, so be responsible for your posts if you want to suggest something in this repository.

#### What risks arise from the nature of the token

Since tokens are actually smart contracts, they, despite their effectiveness, have certain risks. For example, there may be a bug in the smart contract code, or the smart contract itself may be written in such a way that fraudsters can steal funds from token holders. Therefore, it is desirable to study the smart contracts of tokens.

## What is the Jetton standard in TON

The standard for a fungible token in TON is Jetton, the description of the standard is [here](https://github.com/ton-blockchain/TIPs/issues/74). The Jetton standard token should consist of two types of smart contracts:

-   master contract
-   contract wallet

Each Jetton has a main smart contract (let's call it a master contract) that is used to mint new Jettons, account for the total supply, and provide general information about the token.

Information about the number of tokens owned by each user is stored in smart contracts called the Jetton wallet.

There is a good example in the standard documentation:

If you release Jetton with a supply of 200 Jettons owned by 3 people, then you need to deploy 4 contracts: 1 Jetton-master and 3 jetton-wallets.

#### Contract functionality in Jetton

The master contract is required by the standard to implement two Get methods:

-   get_jetton_data() - returns:
    -   `total_supply` - (integer) - total number of issued Jetton tokens
    -   `mintable` - (-1/0) - flag indicating whether the number of tokens can increase
    -   `admin_address` - (MsgAddressInt) - address of the smart contract that manages Jetton (contract master)
    -   `jetton_content` - cell - data according to [token standard](https://github.com/ton-blockchain/TIPs/issues/64)
    -   `jetton_wallet_code` - cell - wallet code for this token
    -   get_wallet_address(slice owner_address) - Returns the Jetton wallet address for this owner address.

According to the standard, the wallet contract must implement:

-   internal message handlers:
-   token transfers
-   burning tokens
-   Get method `get_wallet_data()` which returns:
    `balance` - (uint256) number of Jetton tokens in the wallet.
    `owner` - (MsgAddress) wallet owner address;
    `jetton` - (MsgAddress) Jetton master address;
    `jetton_wallet_code` - (cell) cell with this wallet code;

> The question may arise why we need the wallet code, the wallet code will allow you to reproduce the address of the wallet smart contract, how it works will be discussed below.

> Important: the standard also describes many nuances regarding commissions, restrictions, and other things, but we will not dwell on this in too much detail so that the lesson does not turn into a book.

#### Scheme of work

Next, we will talk about the [example](https://github.com/ton-blockchain/token-contract) implementation of Jetton from the standard. Of course, this is not the only possible implementation of Jetton, but it will allow you not to parse everything at the abstraction level.

For the convenience of discussing the code, let's talk about how Jetton works functionally, i.e. how is the transfer of tokens, minting, etc.

The [example](https://github.com/ton-blockchain/token-contract/tree/main/ft) has the following files:

-   two examples of a master contract: jetton-minter.fc, jetton-minter-ICO.fc
-   contract wallet jetton-wallet.fc
-   other auxiliary files.

Next, using the jetton-minter.fc master contract and the jetton-wallet.fc wallet contract as an example, we will consider the functionality.

##### Chasing

Mining in jetton-minter.fc is as follows, the owner of the master contract sends a message with `op::mint()`, where the message body contains information on which wallet to send Jetton standard tokens to. Further, the message sends information to the smart contract wallet.

##### Burning coins

The wallet owner sends a message with `op::burn()` and the wallet smart contract reduces the number of tokens according to the message and sends a notification (`op::burn_notification()`) to the master contract that the supply of tokens has decreased.

##### Transfer of coins (Transfer - send/receive)

The transfer of tokens is divided into two parts:

-   `op::transfer()` outgoing transfer
-   `op::internal_transfer()` incoming transfer

An outgoing transfer starts with a message with `op::transfer()` from the owner of the smart contract wallet and sends tokens to another smart contract wallet (and of course, a decrease in your token balance).

An incoming transfer after a message with `op::internal_transfer()` changes the balance and sends a message with `op::transfer_notification()` - a notification message about the transfer.

And yes, when you send Jetton tokens to an address, you can request that the wallet associated with that address notify the address when the tokens arrive.

## Analyzing the code

Before analyzing the code, I will note that in general the "mechanics" are repeated, so the further into the analysis, the more top-level the analysis will be.

We will parse files from the [repository](https://github.com/ton-blockchain/token-contract/tree/main/ft) in the following order:

-   jetton-minter.fc
-   jetton-wallet.fc
-   jetton-minter-ICO.fc

And the rest of the files (jetton-utils.fc, op-codes.fc, params.fc) will be analyzed in parallel with the first three, since they are "service".

## jetton-minter.fc

The master contract starts with two helper functions, for loading and unloading data.

##### Loading and unloading data from c4

Now let's look at two helper functions that will load and unload data from register c4. The "master contract repository" will store:

-   total_supply - the total "stock" of the token
-   admin_address - address of the smart contract that manages Jetton
-   content - cell according to [standard](https://github.com/ton-blockchain/TIPs/issues/64)
-   jetton_wallet_code wallet code for this token

In order to "get" the data from c4, we need two functions from the FunC standard library.

Namely: `get_data` - takes a cell from the c4 register. `begin_parse` - converts a cell into a slice

    	(int, slice, cell, cell) load_data() inline {
    	  slice ds = get_data().begin_parse();
    	  return (
    		  ds~load_coins(), ;; total_supply
    		  ds~load_msg_addr(), ;; admin_address
    		  ds~load_ref(), ;; content
    		  ds~load_ref()  ;; jetton_wallet_code
    	  );
    	}

With the help of the `load_` functions already familiar to us, we unload the data from the slice and return it.
In order to save data, we need to do three things:

-   create a Builder for the future cell
-   write a value to it
-   from Builder create Cell (cell)
-   Write the resulting cell to the register

We will do this again with the help of [FunC standard library functions](https://docs.ton.org/develop/func/stdlib/).

`begin_cell()` - create a Builder for the future cell `end_cell()` - create a Cell (cell) `set_data()` - write the cell to register c4

    () save_data(int total_supply, slice admin_address, cell content, cell jetton_wallet_code) impure inline {
      set_data(begin_cell()
    			.store_coins(total_supply)
    			.store_slice(admin_address)
    			.store_ref(content)
    			.store_ref(jetton_wallet_code)
    		   .end_cell()
    		  );
    }

With the help of the `store_` functions already familiar to us, we will store data.

##### Auxiliary minting function

Further down the [code](https://github.com/ton-blockchain/token-contract/blob/main/ft/jetton-minter.fc) is an minting function for minting tokens.

    () mint_tokens(slice to_address, cell jetton_wallet_code, int amount, cell master_msg) impure {

    }

It measures parameters:

-   slice to_address - address to which tokens should be sent
-   cell jetton_wallet_code - wallet code for this token
-   int amount - number of tokens
-   cell master_msg - message from contract master

And here the next question arises, we have some address, but this is not the address of the wallet of the token, how then to get the address of the smart contract of the wallet with tokens (tokens)?

There is a little trick here. If we study [documentation](https://ton-blockchain.github.io/docs/#/howto/step-by-step?id=_3-compiling-a-new-smart-contract) how a smart contract is compiled.

We see the following:

The code and data for the new smart contract are concatenated into a StateInit structure (on the next line), the address of the new smart contract (equal to the hash of this StateInit structure) is computed and output, and then externally communicated to the appropriate destination address of the new smart contract. Externally, this message contains both the correct StateInit for the new smart contract and a non-trivial payload (signed privately with the private key).

For us, this means that we get the address of the smart contract of the token from the address to which we need to send the tokens. If we talk about pregnancy, we use the address, the wallet code, we will collect the StateInit of the wallet.

This is possible, since the [hashing](https://en.wikipedia.org/wiki/Hash_function) function are deterministic, which means that there will be a different hash for different inputs, at the same time, for the same input data, the hash function will always return a uniform hash.

For this, the jetton-utils.fc file has two functions `calculate_jetton_wallet_state_init` and `calculate_jetton_wallet_address`

     cell calculate_jetton_wallet_state_init(slice owner_address, slice jetton_master_address, cell jetton_wallet_code) inline {
      return begin_cell()
    		  .store_uint(0, 2)
    		  .store_dict(jetton_wallet_code)
    		  .store_dict(pack_jetton_wallet_data(0, owner_address, jetton_master_address, jetton_wallet_code))
    		  .store_uint(0, 1)
    		 .end_cell();
    }

    slice calculate_jetton_wallet_address(cell state_init) inline {
      return begin_cell().store_uint(4, 3)
    					 .store_int(workchain(), 8)
    					 .store_uint(cell_hash(state_init), 256)
    					 .end_cell()
    					 .begin_parse();
    }

The function `calculate_jetton_wallet_state_init` collects StateInit according to the [token standard](https://github.com/ton-blockchain/TIPs/issues/64) with zero balance.

The `calculate_jetton_wallet_address` function collects the address according to the [TL-B scheme](https://github.com/ton-blockchain/ton/blob/master/crypto/block/block.tlb#L99).

> the `cell_hash()` function is used to calculate the hash - it calculates the hash of the cell representation.

So the minting function now looks like this:

    () mint_tokens(slice to_address, cell jetton_wallet_code, int amount, cell master_msg) impure {
      cell state_init = calculate_jetton_wallet_state_init(to_address, my_address(), jetton_wallet_code);
      slice to_wallet_address = calculate_jetton_wallet_address(state_init);

    }

Next, you need to send a message to the smart contract:

      var msg = begin_cell()
    	.store_uint(0x18, 6)
    	.store_slice(to_wallet_address)
    	.store_coins(amount)
    	.store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
    	.store_ref(state_init)
    	.store_ref(master_msg);

It is well written about sending messages [here](https://ton-blockchain.github.io/docs/#/smart-contracts/messages), as well as in the third lesson. Using `store_ref` we send a message with information for the wallet contract.

It remains only to send a message, for this we use `send_raw_message` from the [standard library](https://docs.ton.org/develop/func/stdlib/#send_raw_message).

We have already collected the msg variable, it remains to figure out `mode`. Each mode is described in [documentation](https://docs.ton.org/develop/func/stdlib/#send_raw_message). Let's look at an example to make it clearer.

Let there be 100 coins on the balance of the smart contract, and we receive an internal message with 60 coins and send a message with 10, the total fee is 3.

`mode = 0` - balance (100+60-10 = 150 coins), send(10-3 = 7 coins)
`mode = 1` - balance (100+60-10-3 = 147 coins), send(10 coins)
`mode = 64` - balance (100-10 = 90 coins), send (60+10-3 = 67 coins)
`mode = 65` - balance (100-10-3=87 coins), send (60+10 = 70 coins)
`mode = 128` -balance (0 coins), send (100+60-3 = 157 coins)

In the contract code, we have mode 1 which is mode' = mode + 1, which means that the sender wants to pay the transfer fee separately

    send_raw_message(msg.end_cell(), 1); ;; pay transfer fees separately, revert on errors

The final code of the `mint_tokens() ` function:

    () mint_tokens(slice to_address, cell jetton_wallet_code, int amount, cell master_msg) impure {
      cell state_init = calculate_jetton_wallet_state_init(to_address, my_address(), jetton_wallet_code);
      slice to_wallet_address = calculate_jetton_wallet_address(state_init);
      var msg = begin_cell()
    	.store_uint(0x18, 6)
    	.store_slice(to_wallet_address)
    	.store_coins(amount)
    	.store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
    	.store_ref(state_init)
    	.store_ref(master_msg);
      send_raw_message(msg.end_cell(), 1); ;; pay transfer fees separately, revert on errors
    }

#### Analyzing recv_internal()

Let me remind you that smart contracts in the TON network have two reserved methods that can be accessed.

First, `recv_external()` this function is executed when a request to the contract comes from the outside world, that is, not from TON, for example, when we form a message ourselves and send it via lite-client (About installing [lite-client](https:/ /ton.org/docs/#/compile?id=lite-client)).
Second, `recv_internal()` this function is executed when inside TON itself, for example, when any contract refers to ours.

In our case, `recv_internal()` will take the following arguments:

    () recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {

    }

> `impure` is a keyword that indicates that the function changes the smart contract data. For example, we must specify the `impure` specifier if the function can modify the contract store, send messages, or throw an exception when some data is invalid and the function is intended to validate that data. Important: If impure is not specified and the result of a function call is not used, then the FunC compiler may remove that function call.

Now let's look at the code for this function. At the very beginning there is a check whether the message is empty.

    if (in_msg_body.slice_empty?()) { ;; ignore empty messages
        return ();
    }

Next, we begin to parse (read out) the message:

    slice cs = in_msg_full.begin_parse();

We take out the flags and check that the message was not returned (here we mean bounced).

    if (flags & 1) { ;; ignore all bounced messages
        return ();
    }

We get the address of the sender of the message on `recv_internal()`:

    slice sender_address = cs~load_msg_addr();

Now `op` and `query_id` are next in line, you can read about them either in guides on contracts, or in the fifth lesson. In short, `op` operation identification is next.

    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);

Next, we will use the helper function that we wrote earlier - `load_data()`.

    (int total_supply, slice admin_address, cell content, cell jetton_wallet_code) = load_data();

Now, using conditional operators, let's build logic around `op`. For convenience, the codes are stored in a separate file `op-codes.fc`. And also at the end there is an exception, i.e. if the contract does not perform some action in accordance with `op`, there will be an exception.

> Important: given that the token must comply with the standard, then for the operations that are described in the standard, you need to take the appropriate codes, for example, for `burn_notification()` this is 0x7bdd97de.

We get:

    () recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
    	if (in_msg_body.slice_empty?()) { ;; ignore empty messages
    		return ();
    	}
    	slice cs = in_msg_full.begin_parse();
    	int flags = cs~load_uint(4);

    	if (flags & 1) { ;; ignore all bounced messages
    		return ();
    	}
    	slice sender_address = cs~load_msg_addr();

    	int op = in_msg_body~load_uint(32);
    	int query_id = in_msg_body~load_uint(64);

    	(int total_supply, slice admin_address, cell content, cell jetton_wallet_code) = load_data();

    	if (op == op::mint()) {
    		;; token minting
    	}

    	if (op == op::burn_notification()) {
    		;;  processing a message from the wallet that the tokens have burned down
    	}

    	if (op == 3) { ;; change admin
    		;; change of "admin" or how else can you call the owner of the contract
    	}

    	if (op == 4) { ;; change content, delete this for immutable tokens
    		;; change of data in c4 register
    	}

    	throw(0xffff);
    }

##### op::mint()

The first thing we do with `op::mint()` is raise an exception if the address of the administrator (owner) of the contract is equal to the address of the sender:

    if (op == op::mint()) {
        throw_unless(73, equal_slices(sender_address, admin_address));

    }

Next, we get the address from the message body to which tokens should be sent, the number of TONs for "transporting" Jetton standard tokens, and the master contract message.

    if (op == op::mint()) {
        throw_unless(73, equal_slices(sender_address, admin_address));
    	slice to_address = in_msg_body~load_msg_addr();
        int amount = in_msg_body~load_coins();
        cell master_msg = in_msg_body~load_ref();
    }

We get the number of tokens from the master contract message, omitting `op` and `query_id`.

    if (op == op::mint()) {
        throw_unless(73, equal_slices(sender_address, admin_address));
        slice to_address = in_msg_body~load_msg_addr();
        int amount = in_msg_body~load_coins();
        cell master_msg = in_msg_body~load_ref();
        slice master_msg_cs = master_msg.begin_parse();
        master_msg_cs~skip_bits(32 + 64); ;; op + query_id
        int jetton_amount = master_msg_cs~load_coins();
    }

We call the `mint_tokens()` function that we wrote earlier, and also save the data to `c4` using the `save_data()` helper function. At the end, we will complete the function, the `return` operator will help us. We get:

    if (op == op::mint()) {
        throw_unless(73, equal_slices(sender_address, admin_address));
        slice to_address = in_msg_body~load_msg_addr();
        int amount = in_msg_body~load_coins();
        cell master_msg = in_msg_body~load_ref();
        slice master_msg_cs = master_msg.begin_parse();
        master_msg_cs~skip_bits(32 + 64); ;; op + query_id
        int jetton_amount = master_msg_cs~load_coins();
        mint_tokens(to_address, jetton_wallet_code, amount, master_msg);
        save_data(total_supply + jetton_amount, admin_address, content, jetton_wallet_code);
        return ();
    }

##### op::burn_notification()

The first thing we do with `op::burn_notification()` is get the number of tokens and the address from which the notification came from the message body.

    if (op == op::burn_notification()) {
        int jetton_amount = in_msg_body~load_coins();
        slice from_address = in_msg_body~load_msg_addr();

    }

Next, using the familiar trick to "recreate" the wallet address (the `calculate_user_jetton_wallet_address()` function), we will throw an exception if the sender address (`sender_address`) is not equal to the wallet address.

    if (op == op::burn_notification()) {
        int jetton_amount = in_msg_body~load_coins();
        slice from_address = in_msg_body~load_msg_addr();
        throw_unless(74,
            equal_slices(calculate_user_jetton_wallet_address(from_address, my_address(), jetton_wallet_code), sender_address)
        );

    }

Now let's store the data in c4, while reducing the total supply of tokens by the amount of burned tokens.

    if (op == op::burn_notification()) {
        int jetton_amount = in_msg_body~load_coins();
        slice from_address = in_msg_body~load_msg_addr();
        throw_unless(74,
            equal_slices(calculate_user_jetton_wallet_address(from_address, my_address(), jetton_wallet_code), sender_address)
        );
    	save_data(total_supply - jetton_amount, admin_address, content, jetton_wallet_code);
    }

After we get the address to which we need to return the answer.

    if (op == op::burn_notification()) {
        int jetton_amount = in_msg_body~load_coins();
        slice from_address = in_msg_body~load_msg_addr();
        throw_unless(74,
            equal_slices(calculate_user_jetton_wallet_address(from_address, my_address(), jetton_wallet_code), sender_address)
        );
    	save_data(total_supply - jetton_amount, admin_address, content, jetton_wallet_code);
    	slice response_address = in_msg_body~load_msg_addr();
    }

And if it's not "null" (not `addr_none`), we send a message about the excess (`op::excesses()`) and, of course, terminate the function using the `return` operator.

    if (op == op::burn_notification()) {
        int jetton_amount = in_msg_body~load_coins();
        slice from_address = in_msg_body~load_msg_addr();
        throw_unless(74,
            equal_slices(calculate_user_jetton_wallet_address(from_address, my_address(), jetton_wallet_code), sender_address)
        );
        save_data(total_supply - jetton_amount, admin_address, content, jetton_wallet_code);
        slice response_address = in_msg_body~load_msg_addr();
        if (response_address.preload_uint(2) != 0) {
          var msg = begin_cell()
            .store_uint(0x10, 6) ;; nobounce - int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool src:MsgAddress -> 011000
            .store_slice(response_address)
            .store_coins(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_uint(op::excesses(), 32)
            .store_uint(query_id, 64);
          send_raw_message(msg.end_cell(), 2 + 64);
        }
        return ();
    }

##### op 3 and op 4

In the master contract example, two optional features are also shown, namely changing the owner (admin) of the master contract (`op == 3`), as well as replacing all content in the `c4` register (`op == 4`).

> It is important to note that before interacting with any contracts, it is worth studying their code, as developers often leave loopholes that, for example, can completely change the entire logic of the contract.

In each such "control data contract" `op` it is mandatory to check that the sender address is the address of the contract admin. And then the data is simply saved.

    if (op == 3) { ;; change admin
        throw_unless(73, equal_slices(sender_address, admin_address));
        slice new_admin_address = in_msg_body~load_msg_addr();
        save_data(total_supply, new_admin_address, content, jetton_wallet_code);
        return ();
    }

    if (op == 4) { ;; change content, delete this for immutable tokens
        throw_unless(73, equal_slices(sender_address, admin_address));
        save_data(total_supply, admin_address, in_msg_body~load_ref(), jetton_wallet_code);
        return ();
    }

#### Get methods

So, according to the Jetton standard, the master contract must have two Get methods:

-   get_jetton_data() - which will return data about the Jetton standard token
-   get_wallet_address() - which returns by address, wallet smart contract address

##### get_jetton_data()

The function takes data from `c4` and returns:

-   total_supply - (integer) - total number of issued tokens
-   mintable - (-1/0) - flag indicating whether the number of tokens can increase
-   admin_address - (MsgAddressInt) - address of the smart contract that manages Jetton
-   jetton_content - cell - data according to [Token Data Standard](https://github.com/ton-blockchain/TIPs/issues/64)
-   jetton_wallet_code - cell - wallet code for this token

The code:

    (int, int, slice, cell, cell) get_jetton_data() method_id {
    	(int total_supply, slice admin_address, cell content, cell jetton_wallet_code) = load_data();
    	return (total_supply, -1, admin_address, content, jetton_wallet_code);
    }

##### get_wallet_address()

Using the auxiliary function, we "reproduce" the address of the smart contract of the wallet.

The code:

    slice get_wallet_address(slice owner_address) method_id {
    	(int total_supply, slice admin_address, cell content, cell jetton_wallet_code) = load_data();
    	return calculate_user_jetton_wallet_address(owner_address, my_address(), jetton_wallet_code);
    }

## jetton-wallet.fc

This file starts with two functions that we will define as a low-level TVM primitive using the `asm` keyword.

    int min_tons_for_storage() asm "10000000 PUSHINT"; ;; 0.01 TON
    int gas_consumption() asm "10000000 PUSHINT"; ;; 0.01 TON

We will need both functions in order to check gas limits and the minimum number of TONs.

> PUSHINT pushes an Integer onto the stack

##### Loading and unloading data from c4

Now let's look at two helper functions that will load and unload data from register c4. In our "storage" we will store:

-   int balance - token balance
-   slice owner_address - token owner address
-   slice jetton_master_address - address of the master contract for this token
-   cell jetton_wallet_code - wallet code for this token

In order to "get" data from c4, we need two functions from the FunC standard library.

Namely: `get_data` - takes a cell from the c4 register. `begin_parse` - converts a cell into a slice

    	(int, slice, slice, cell) load_data() inline {
    	  slice ds = get_data().begin_parse();
    	  return (ds~load_coins(), ds~load_msg_addr(), ds~load_msg_addr(), ds~load_ref());
    	}

With the help of the `load_` functions already familiar to us, we unload data from slice and return it.

To save the data, `set_data()` is used - it will write the cell to register c4.

    () save_data (int balance, slice owner_address, slice jetton_master_address, cell jetton_wallet_code) impure inline {
      set_data(pack_jetton_wallet_data(balance, owner_address, jetton_master_address, jetton_wallet_code));
    }

We will collect the data cell itself using the `pack_jetton_wallet_data()` auxiliary function from the jetton-utils.fc file.

`pack_jetton_wallet_data()` function code:

    cell pack_jetton_wallet_data(int balance, slice owner_address, slice jetton_master_address, cell jetton_wallet_code) inline {
       return  begin_cell()
    			.store_coins(balance)
    			.store_slice(owner_address)
    			.store_slice(jetton_master_address)
    			.store_ref(jetton_wallet_code)
    		   .end_cell();
    }

`begin_cell()` - create a Builder for the future cell `store_` - write the values `end_cell()` - create a Cell (cell)

##### Function to send tokens (outgoing transfer)

The function of sending tokens, checks the conditions in accordance with the [standard](https://github.com/ton-blockchain/TIPs/issues/74) and sends the corresponding message.

    () send_tokens (slice in_msg_body, slice sender_address, int msg_value, int fwd_fee) impure {
    }

Let's go through the function code. The function code starts by reading data from `in_msg_body`

      int query_id = in_msg_body~load_uint(64);
      int jetton_amount = in_msg_body~load_coins();
      slice to_owner_address = in_msg_body~load_msg_addr();

-   query_id - arbitrary query number
-   int jetton_amount - number of tokens
-   to_owner_address - address of the owner, needed to reproduce the address of the smart contract

Next comes the call to the `force_chain()` function from the params.fc file.

    force_chain(to_owner_address);

The `force_chain` function checks that the address is in workchain number 0 (the base workchain). You can read more about addresses and numbers [here](https://github.com/ton-blockchain/ton/blob/master/doc/LiteClient-HOWTO) at the very beginning. Let's analyze the code from params.fc:

    int workchain() asm "0 PUSHINT";

    () force_chain(slice addr) impure {
      (int wc, _) = parse_std_addr(addr);
      throw_unless(333, wc == workchain());
    }

We define the `workchain()` helper function as a low-level TVM primitive using the `asm` keyword. Integer == 0 we need for comparison.

    int workchain() asm "0 PUSHINT";

To extract the information we need from the address, `parse_std_addr()` is used. `parse_std_addr()` - returns the workchain and 256-bit integer address from `MsgAddressInt`.

    () force_chain(slice addr) impure {
      (int wc, _) = parse_std_addr(addr);
      throw_unless(333, wc == workchain());
    }

And to raise an exception if the workchains are not equal, we will use `throw_unless()`.

Going back to our `send_tokens()` function

Load data from c4:

    (int balance, slice owner_address, slice jetton_master_address, cell jetton_wallet_code) = load_data();

And immediately subtract from the balance, the number of tokens (jetton_amount), and immediately check (give exceptions) that the balance has not become less than zero, and the addresses do not match.

    balance -= jetton_amount;
    throw_unless(705, equal_slices(owner_address, sender_address));
    throw_unless(706, balance >= 0);

Now, using the trick already familiar to us on the master contract, the wallet address is "reproduced":

      cell state_init = calculate_jetton_wallet_state_init(to_owner_address, jetton_master_address, jetton_wallet_code);
      slice to_wallet_address = calculate_jetton_wallet_address(state_init);

Next, we get from the message body we get the address to which the response will need to be sent, a custom payload (perhaps someone wants to transfer some more information with the token), as well as the number of nanoTons that will be sent to the destination address.

      slice response_address = in_msg_body~load_msg_addr();
      cell custom_payload = in_msg_body~load_dict();
      int forward_ton_amount = in_msg_body~load_coins();

Now using the `slice_bits` function, which returns the number of data bits in slice. Let's check that only another payload remains in the body of the message, and unload it at the same time.

      throw_unless(708, slice_bits(in_msg_body) >= 1);
      slice either_forward_payload = in_msg_body

Next, a message is collected (let me remind you that `to_wallet_address` is the address of the wallet smart contract):

      var msg = begin_cell()
    	.store_uint(0x18, 6)
    	.store_slice(to_wallet_address)
    	.store_coins(0)
    	.store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
    	.store_ref(state_init);

The body of the message is collected separately according to the [standard](https://github.com/ton-blockchain/TIPs/issues/74). Namely:

> Sending tokens is related to transfer, so we collect the body exactly in accordance with transfer

`op` - take from the jetton-utils.fc file (according to the standard, this is internal_transfer(), which means 0x178d4519)
`query_id` - arbitrary query number.
`jetton amount` - the number of transferred tokens in units of this token.
`owner_address` is the address of the new token owner.
`response_address` - the address where to send a response with a confirmation of a successful transfer and the rest of the incoming message with a Tone.
`forward_ton_amount` - the amount of nanoTons to be sent to the destination address.
`forward_payload` - optional user data to be sent to the destination address.

Message body code and adding it to the message:

      var msg_body = begin_cell()
    	.store_uint(op::internal_transfer(), 32)
    	.store_uint(query_id, 64)
    	.store_coins(jetton_amount)
    	.store_slice(owner_address)
    	.store_slice(response_address)
    	.store_coins(forward_ton_amount)
    	.store_slice(either_forward_payload)
    	.end_cell();
    msg = msg.store_ref(msg_body);

> The attentive reader may ask where `custom_payload` is, but this field is optional.

And everything seems to be ready for sending, but two important conditions from the standard remain, namely:

-   not enough TON to process the operation, deploy the beneficiary's Wallet Token and send forward_ton_amount.
-   After processing the request, the recipient wallet token must send at least in_msg_value - forward_amount - 2 \* max_tx_gas_price to the response_destination address.

    int fwd*count = forward_ton_amount ? 2 : 1;
    throw_unless(709, msg_value >
    forward_ton_amount +
    ;; 3 messages: wal1->wal2, wal2->owner, wal2->response
    ;; but last one is optional (it is ok if it fails)
    fwd_count * fwd*fee +
    (2 * gas_consumption() + min_tons_for_storage()));
    ;; universal message send fee calculation may be activated here
    ;; by using this instead of fwd_fee
    ;; msg_fwd_fee(to_wallet, msg_body, state_init, 15)

> I won’t go into detail here, as the comments and description in the token standard give a detailed picture

It remains only to send a message and save the data in the `c4` register:

      send_raw_message(msg.end_cell(), 64); ;; revert on errors
      save_data(balance, owner_address, jetton_master_address, jetton_wallet_code);

Final code:

    () send_tokens (slice in_msg_body, slice sender_address, int msg_value, int fwd_fee) impure {
      int query_id = in_msg_body~load_uint(64);
      int jetton_amount = in_msg_body~load_coins();
      slice to_owner_address = in_msg_body~load_msg_addr();
      force_chain(to_owner_address);
      (int balance, slice owner_address, slice jetton_master_address, cell jetton_wallet_code) = load_data();
      balance -= jetton_amount;

      throw_unless(705, equal_slices(owner_address, sender_address));
      throw_unless(706, balance >= 0);

      cell state_init = calculate_jetton_wallet_state_init(to_owner_address, jetton_master_address, jetton_wallet_code);
      slice to_wallet_address = calculate_jetton_wallet_address(state_init);
      slice response_address = in_msg_body~load_msg_addr();
      cell custom_payload = in_msg_body~load_dict();
      int forward_ton_amount = in_msg_body~load_coins();
      throw_unless(708, slice_bits(in_msg_body) >= 1);
      slice either_forward_payload = in_msg_body;
      var msg = begin_cell()
    	.store_uint(0x18, 6)
    	.store_slice(to_wallet_address)
    	.store_coins(0)
    	.store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
    	.store_ref(state_init);
      var msg_body = begin_cell()
    	.store_uint(op::internal_transfer(), 32)
    	.store_uint(query_id, 64)
    	.store_coins(jetton_amount)
    	.store_slice(owner_address)
    	.store_slice(response_address)
    	.store_coins(forward_ton_amount)
    	.store_slice(either_forward_payload)
    	.end_cell();

      msg = msg.store_ref(msg_body);
      int fwd_count = forward_ton_amount ? 2 : 1;
      throw_unless(709, msg_value >
    					 forward_ton_amount +
    					 ;; 3 messages: wal1->wal2,  wal2->owner, wal2->response
    					 ;; but last one is optional (it is ok if it fails)
    					 fwd_count * fwd_fee +
    					 (2 * gas_consumption() + min_tons_for_storage()));
    					 ;; universal message send fee calculation may be activated here
    					 ;; by using this instead of fwd_fee
    					 ;; msg_fwd_fee(to_wallet, msg_body, state_init, 15)

      send_raw_message(msg.end_cell(), 64); ;; revert on errors
      save_data(balance, owner_address, jetton_master_address, jetton_wallet_code);
    }

##### Function to receive tokens (incoming transfer)

Let's move on to getting tokens:

    () receive_tokens (slice in_msg_body, slice sender_address, int my_ton_balance, int fwd_fee, int msg_value) impure {

    }

The `receive_tokens()` function starts by unloading data from c4, then we get `query_id`, `jetton_amount` from the message body:

      (int balance, slice owner_address, slice jetton_master_address, cell jetton_wallet_code) = load_data();
      int query_id = in_msg_body~load_uint(64);
      int jetton_amount = in_msg_body~load_coins();

Since the wallet has received tokens, you need to add them to the balance:

      balance += jetton_amount;

We continue to read data from `in_msg_body`, take two addresses: the address from which the tokens were received and the address to which the response should be returned.

      slice from_address = in_msg_body~load_msg_addr();
      slice response_address = in_msg_body~load_msg_addr();

Next, using the [binary OR operator](https://en.wikipedia.org/wiki/Binary_operation) we check two conditions at once at the addresses:

      throw_unless(707,
    	  equal_slices(jetton_master_address, sender_address)
    	  |
    	  equal_slices(calculate_user_jetton_wallet_address(from_address, jetton_master_address, jetton_wallet_code), sender_address)

Also, `forward_ton_amount` is taken from the body of the message - the amount of nanoTons that will be sent to the destination address.

    int forward_ton_amount = in_msg_body~load_coins();

And here we finally need the functions that we defined at the very beginning for the gas limit and the minimum number of TON, namely `min_tons_for_storage()` and `gas_consumption()`.

      int storage_fee = min_tons_for_storage() - min(ton_balance_before_msg, min_tons_for_storage());
      msg_value -= (storage_fee + gas_consumption());

Using these limits, we get a value for the message, which we will use later (send a message about the excess, if there is a lot).

Further, if we create a transfer notification message:

      if(forward_ton_amount) {
    	msg_value -= (forward_ton_amount + fwd_fee);
    	slice either_forward_payload = in_msg_body;

    	var msg_body = begin_cell()
    		.store_uint(op::transfer_notification(), 32)
    		.store_uint(query_id, 64)
    		.store_coins(jetton_amount)
    		.store_slice(from_address)
    		.store_slice(either_forward_payload)
    		.end_cell();

    	var msg = begin_cell()
    	  .store_uint(0x10, 6) ;; we should not bounce here cause receiver can have uninitialized contract
    	  .store_slice(owner_address)
    	  .store_coins(forward_ton_amount)
    	  .store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    	  .store_ref(msg_body);

    	send_raw_message(msg.end_cell(), 1);
      }

> It's important to note that we've decremented `msg_value` again, we'll need this later to know if we need to send a surplus message.

Now it's time for `msg_value`, from which we persistently deducted various payments (you can read more about them [here](https://ton-blockchain.github.io/docs/#/smart-contracts/fees))

We check that the address is not null and that there is something left of `msg_value` and send a message about the surplus, with this surplus, respectively.

      if ((response_address.preload_uint(2) != 0) & (msg_value > 0)) {
    	var msg = begin_cell()
    	  .store_uint(0x10, 6) ;; nobounce - int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool src:MsgAddress -> 010000
    	  .store_slice(response_address)
    	  .store_coins(msg_value)
    	  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    	  .store_uint(op::excesses(), 32)
    	  .store_uint(query_id, 64);
    	send_raw_message(msg.end_cell(), 2);
      }

And of course, at the very end there is data saving.

    save_data(balance, owner_address, jetton_master_address, jetton_wallet_code);

Final code:

    () receive_tokens (slice in_msg_body, slice sender_address, int my_ton_balance, int fwd_fee, int msg_value) impure {
      ;; NOTE we can not allow fails in action phase since in that case there will be
      ;; no bounce. Thus check and throw in computation phase.
      (int balance, slice owner_address, slice jetton_master_address, cell jetton_wallet_code) = load_data();
      int query_id = in_msg_body~load_uint(64);
      int jetton_amount = in_msg_body~load_coins();
      balance += jetton_amount;
      slice from_address = in_msg_body~load_msg_addr();
      slice response_address = in_msg_body~load_msg_addr();
      throw_unless(707,
    	  equal_slices(jetton_master_address, sender_address)
    	  |
    	  equal_slices(calculate_user_jetton_wallet_address(from_address, jetton_master_address, jetton_wallet_code), sender_address)
      );
      int forward_ton_amount = in_msg_body~load_coins();

      int ton_balance_before_msg = my_ton_balance - msg_value;
      int storage_fee = min_tons_for_storage() - min(ton_balance_before_msg, min_tons_for_storage());
      msg_value -= (storage_fee + gas_consumption());
      if(forward_ton_amount) {
    	msg_value -= (forward_ton_amount + fwd_fee);
    	slice either_forward_payload = in_msg_body;

    	var msg_body = begin_cell()
    		.store_uint(op::transfer_notification(), 32)
    		.store_uint(query_id, 64)
    		.store_coins(jetton_amount)
    		.store_slice(from_address)
    		.store_slice(either_forward_payload)
    		.end_cell();

    	var msg = begin_cell()
    	  .store_uint(0x10, 6) ;; we should not bounce here cause receiver can have uninitialized contract
    	  .store_slice(owner_address)
    	  .store_coins(forward_ton_amount)
    	  .store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    	  .store_ref(msg_body);

    	send_raw_message(msg.end_cell(), 1);
      }

      if ((response_address.preload_uint(2) != 0) & (msg_value > 0)) {
    	var msg = begin_cell()
    	  .store_uint(0x10, 6) ;; nobounce - int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool src:MsgAddress -> 010000
    	  .store_slice(response_address)
    	  .store_coins(msg_value)
    	  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    	  .store_uint(op::excesses(), 32)
    	  .store_uint(query_id, 64);
    	send_raw_message(msg.end_cell(), 2);
      }

      save_data(balance, owner_address, jetton_master_address, jetton_wallet_code);
    }

##### Token burning function (incoming transfer)

We will not analyze the burning function in detail, since after reading the analyzes of the previous functions, everything should be clear at a glance.

I will only note the logic of work - after reducing the balance of tokens by the selected amount, a message is sent to the master contract - a notification of burning.

    () burn_tokens (slice in_msg_body, slice sender_address, int msg_value, int fwd_fee) impure {
      ;; NOTE we can not allow fails in action phase since in that case there will be
      ;; no bounce. Thus check and throw in computation phase.
      (int balance, slice owner_address, slice jetton_master_address, cell jetton_wallet_code) = load_data();
      int query_id = in_msg_body~load_uint(64);
      int jetton_amount = in_msg_body~load_coins();
      slice response_address = in_msg_body~load_msg_addr();
      ;; ignore custom payload
      ;; slice custom_payload = in_msg_body~load_dict();
      balance -= jetton_amount;
      throw_unless(705, equal_slices(owner_address, sender_address));
      throw_unless(706, balance >= 0);
      throw_unless(707, msg_value > fwd_fee + 2 * gas_consumption());

      var msg_body = begin_cell()
    	  .store_uint(op::burn_notification(), 32)
    	  .store_uint(query_id, 64)
    	  .store_coins(jetton_amount)
    	  .store_slice(owner_address)
    	  .store_slice(response_address)
    	  .end_cell();

      var msg = begin_cell()
    	.store_uint(0x18, 6)
    	.store_slice(jetton_master_address)
    	.store_coins(0)
    	.store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    	.store_ref(msg_body);

      send_raw_message(msg.end_cell(), 64);

      save_data(balance, owner_address, jetton_master_address, jetton_wallet_code);
    }

#### Bounce

There is one more function to write before we move on to `recv_internal()`. In the `recv_internal()` function, we have to handle bounced messages. (More about bounce on [page 78 here](https://ton-blockchain.github.io/docs/tblkch.pdf)).

When bouncing, we must do the following:

-   return tokens to the balance
-   throw an exception if `op::internal_transfer()` or `op::burn_notification()`

We will pass the body of the message to the function framework:

    () on_bounce (slice in_msg_body) impure {

    }

Take `op` from body and throw exceptions if `op::internal_transfer()` or `op::burn_notification()`

    () on_bounce (slice in_msg_body) impure {
      in_msg_body~skip_bits(32); ;; 0xFFFFFFFF
      (int balance, slice owner_address, slice jetton_master_address, cell jetton_wallet_code) = load_data();
      int op = in_msg_body~load_uint(32);
      throw_unless(709, (op == op::internal_transfer()) | (op == op::burn_notification()));

    }

Continuing to read data from the body, we return the tokens to the balance and save the data to the `c4` register.

    () on_bounce (slice in_msg_body) impure {
      in_msg_body~skip_bits(32); ;; 0xFFFFFFFF
      (int balance, slice owner_address, slice jetton_master_address, cell jetton_wallet_code) = load_data();
      int op = in_msg_body~load_uint(32);
      throw_unless(709, (op == op::internal_transfer()) | (op == op::burn_notification()));
      int query_id = in_msg_body~load_uint(64);
      int jetton_amount = in_msg_body~load_coins();
      balance += jetton_amount;
      save_data(balance, owner_address, jetton_master_address, jetton_wallet_code);
    }

#### recv_internal()

In order for our wallet to receive messages, we will use the external method `recv_internal()`

    () recv_internal()  {

    }

##### External method arguments

According to the documentation of the [TON virtual machine - TVM](https://ton-blockchain.github.io/docs/tvm.pdf), when an event occurs on an account in one of the TON chains, it triggers a transaction.

Each transaction consists of up to 5 stages. Read more [here](https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_overview?id=transactions-and-phases).

We are interested in **Compute phase**. And to be more specific, what is "on the stack" during initialization. For normal message-triggered transactions, the initial state of the stack looks like this:

5 elements:

-   Smart contract balance (in nanoTons)
-   Incoming message balance (in nanotones)
-   Cell with incoming message
-   Incoming message body, slice type
-   Function selector (for recv_internal it is 0)

As a result, we get the following code:

    () recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body)  {

    }

##### Get data from message body

So the first thing we do in `recv_internal()` is check if the message is empty:

if (in_msg_body.slice_empty?()) { ;; ignore empty messages
return ();
}

Next, we get the flags and check if the incoming message is a bounced one. In case it's a bounce, we'll use the `on_bounce()` function we wrote earlier.

      slice cs = in_msg_full.begin_parse();
      int flags = cs~load_uint(4);
      if (flags & 1) {
    	on_bounce(in_msg_body);
    	return ();
      }

After we continue to get the data (comments reveal what it is), including `op`. Thanks to which we will build further logic.

      slice sender_address = cs~load_msg_addr();
      cs~load_msg_addr(); ;; skip dst
      cs~load_coins(); ;; skip value
      cs~skip_bits(1); ;; skip extracurrency collection
      cs~load_coins(); ;; skip ihr_fee
      int fwd_fee = cs~load_coins(); ;; we use message fwd_fee for estimation of forward_payload costs

      int op = in_msg_body~load_uint(32);

Using conditional statements, we build logic around `op` and use the functions we wrote to implement the logic inside.

      if (op == op::transfer()) { ;; outgoing transfer
    	send_tokens(in_msg_body, sender_address, msg_value, fwd_fee);
    	return ();
      }

      if (op == op::internal_transfer()) { ;; incoming transfer
    	receive_tokens(in_msg_body, sender_address, my_balance, fwd_fee, msg_value);
    	return ();
      }

      if (op == op::burn()) { ;; burn
    	burn_tokens(in_msg_body, sender_address, msg_value, fwd_fee);
    	return ();
      }

There is an exception at the end, i.e. if the contract does not take some action according to `op`, an exception will be thrown. Final `recv_internal()` code:

    () recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
      if (in_msg_body.slice_empty?()) { ;; ignore empty messages
    	return ();
      }

      slice cs = in_msg_full.begin_parse();
      int flags = cs~load_uint(4);
      if (flags & 1) {
    	on_bounce(in_msg_body);
    	return ();
      }
      slice sender_address = cs~load_msg_addr();
      cs~load_msg_addr(); ;; skip dst
      cs~load_coins(); ;; skip value
      cs~skip_bits(1); ;; skip extracurrency collection
      cs~load_coins(); ;; skip ihr_fee
      int fwd_fee = cs~load_coins(); ;; we use message fwd_fee for estimation of forward_payload costs

      int op = in_msg_body~load_uint(32);

      if (op == op::transfer()) { ;; outgoing transfer
    	send_tokens(in_msg_body, sender_address, msg_value, fwd_fee);
    	return ();
      }

      if (op == op::internal_transfer()) { ;; incoming transfer
    	receive_tokens(in_msg_body, sender_address, my_balance, fwd_fee, msg_value);
    	return ();
      }

      if (op == op::burn()) { ;; burn
    	burn_tokens(in_msg_body, sender_address, msg_value, fwd_fee);
    	return ();
      }

      throw(0xffff);
    }

####Get method

According to the [Jetton](https://github.com/ton-blockchain/TIPs/issues/74) standard, a wallet smart contract must implement a Get method that returns:

    `balance` - (uint256) number of tokens in the wallet.
    `owner` - (MsgAddress) wallet owner address;
    `jetton` - (MsgAddress) address of the master contract;
    `jetton_wallet_code` - (cell) with the code of this wallet;

That is, just unload data from `c4`:

    (int, slice, slice, cell) get_wallet_data() method_id {
      return load_data();
    }

## jetton-minter-ICO.fc

This file is a variation of the master contract, for the situation when you want to conduct an ICO.

> ICO (Initial Coin Offering) - initial placement of coins, a form of attracting investments in the form of selling investors a fixed number of new units of crypto-currencies / tokens.

The only significant difference from jetton-minter.fc is the ability to get tokens for yourself by sending a Tone to a contract.

Also, the optional `op` that were in jetton-minter.fc was removed from this particular contract.

## jetton-minter-ICO.fc

This file is a variation of the master contract, for the situation when you want to conduct an ICO.

> ICO (Initial Coin Offering) - initial placement of coins, a form of attracting investments in the form of selling investors a fixed number of new units of crypto-currencies / tokens.

The only significant difference from jetton-minter.fc is the ability to get tokens for yourself by sending a Tone to a contract.

Also, the optional `op` that were in jetton-minter.fc was removed from this particular contract.

##### Understanding ICO mechanics in recv_internal()

The balance of the incoming message (in nanoTons) is `msg_value`. From this we will subtract a small number of NanoTons for the minting message and the resulting value will be exchanged for Jetton Standards tokens in some proportion.

Check that the body of the message is not empty:

    if (in_msg_body.slice_empty?()) { ;; buy jettons for Toncoin


    }

Calculate the number of nanoTons to be exchanged for Jetton standard tokens:

      int amount = 10000000; ;; for mint message
      int buy_amount = msg_value - amount;

Let's check that the result is not a negative value, we will throw an exception if it is the other way around:

    throw_unless(76, buy_amount > 0);

Set the proportion:

    int jetton_amount = buy_amount; ;; rate 1 jetton = 1 toncoin; multiply to price here

Next, we collect a message for the `mint_tokens()` function:

      var master_msg = begin_cell()
            .store_uint(op::internal_transfer(), 32)
            .store_uint(0, 64) ;; quert_id
            .store_coins(jetton_amount)
            .store_slice(my_address()) ;; from_address
            .store_slice(sender_address) ;; response_address
            .store_coins(0) ;; no forward_amount
            .store_uint(0, 1) ;; forward_payload in this slice, not separate cell
            .end_cell();

We call the function of minting tokens:

    mint_tokens(sender_address, jetton_wallet_code, amount, master_msg);

We also save data to the `c4` register, changing the total supply of Jetton standard tokens. And we finish the execution of the `recv_internal function()`.

    save_data(total_supply + jetton_amount, admin_address, content, jetton_wallet_code);
    return ();

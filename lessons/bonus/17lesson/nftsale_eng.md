# NFT Sale and Marketplace

## Introduction

In this lesson, we will look at how the sale of NFTs can be organized. We will take contract examples from the official [token examples](https://github.com/ton-blockchain/token-contract), we are interested in:
  - nft-marketplace.fc - marketplace contract
  - nft-sale.fc - contract for the sale of a specific NFT

We will build this lesson as follows, first we will look at the top-level how smart contracts work, and then we will go through the code. We will not analyze every word in the code, so if you are unfamiliar with Func, I advise you to go through [lessons](https://github.com/romanovichim/TonFunClessons_Eng).

## Overview of functionality

The marketplace smart contract performs one function, it initializes/deploys the sales smart contract. Thus, the marketplace smart contract simply receives a message with all the necessary data to initialize the sale, and the message initializes the smart contract for the sale.

A smart sales contract performs three functions:
- accumulation of funds within the contract
- sale
- cancellation of the sale

After a successful sale or cancellation, the contract is "burned".

The accumulation is carried out by receiving funds in a contract with op == 1.

The cancellation of the sale is carried out by transferring the ownership of the current owner, the current owner and "burning" the smart contract.

When selling, we send TONcoins to the owner via messages, we pay marketplace commissions and royalties by messages, and at the end we send a message about the change of ownership of the NFT and burn the contract.

Now let's take a look at the contract code.

### Marketplace Contract

So, the task of the marketplace smart contract is to deploy/initialize a contract into the Sale network. We will do this using the already familiar State Init. The smart contract will receive the State Init message (the code and primary data for the storage), take a hash from it and thus form the Sale address of the contract, and then send a message to this address for initialization.

Let's go through the code for a more detailed analysis.

#### Storage

We will store the address of the marketplace smart contract owner in the `c4` register, we will need it to check from whom the message came, so that the sale can be initialized only from the address of the marketplace smart contract owner.

To work with the storage, this smart contract has two auxiliary functions `load_data()` and `save_data()`, which will upload and save data to the storage, respectively.

	(slice) load_data() inline {
	  var ds = get_data().begin_parse();
	  return 
		(ds~load_msg_addr() ;; owner
		 );
	}

	() save_data(slice owner_address) impure inline {
	  set_data(begin_cell()
		.store_slice(owner_address)
		.end_cell());
	}

#### Handling internal messages

Let's move on to parsing `recv_internal()`. The smart contract will not process empty messages, so we will check using `slice_empty()` and end the execution of the smart contract in case of an empty message using `return()`.

	() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
	}

Next, we get the flags and check if the incoming message is a bounced one. If this is a bounce, we complete the work of the smart contract:

	() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) {  ;; ignore all bounced messages
			return ();
		}
	}
	
> More about bounce at [page 78 here](https://ton-blockchain.github.io/docs/tblkch.pdf))

According to the logic of the marketplace, only the owner of the marketplace smart contract can initialize the sales contract, so we get the sender's address from `c4` and check if they match:

	() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) {  ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

		var (owner_address) = load_data();
		throw_unless(401, equal_slices(sender_address, owner_address));

	}

Let's proceed to the initialization of the smart sales contract, for this we will get op and check that it is equal to 1.
> As a reminder, using op is a recommendation from the [documentation](https://ton-blockchain.github.io/docs/#/howto/smart-contract-guidelines?id=smart-contract-guidelines) on smart contracts in TON.

	() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) {  ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

		var (owner_address) = load_data();
		throw_unless(401, equal_slices(sender_address, owner_address));
		int op = in_msg_body~load_uint(32);

		if (op == 1) { ;; deploy new auction

		}
	}
	

##### Op == 1

We continue to parse the message body, get the amount of TONcoin that we will send to the Sale contract, and also get the StateInit Sale of the contract and the message body for deployment.

    if (op == 1) { ;; deploy new auction
      int amount = in_msg_body~load_coins();
      (cell state_init, cell body) = (cs~load_ref(), cs~load_ref());

    }

Calculate the StateInit hash using [cell_hash](https://ton-blockchain.github.io/docs/#/func/stdlib?id=cell_hash) and collect the Sale address of the contract:

		if (op == 1) { ;; deploy new auction
		  int amount = in_msg_body~load_coins();
		  (cell state_init, cell body) = (cs~load_ref(), cs~load_ref());
		  int state_init_hash = cell_hash(state_init);
		  slice dest_address = begin_cell().store_int(0, 8).store_uint(state_init_hash, 256).end_cell().begin_parse();
		}

It remains only to send a message, and then when a message with op == 1 arrives, the marketplace smart contract will initialize the Sale contract.

		if (op == 1) { ;; deploy new auction
		  int amount = in_msg_body~load_coins();
		  (cell state_init, cell body) = (cs~load_ref(), cs~load_ref());
		  int state_init_hash = cell_hash(state_init);
		  slice dest_address = begin_cell().store_int(0, 8).store_uint(state_init_hash, 256).end_cell().begin_parse();

		  var msg = begin_cell()
			.store_uint(0x18, 6)
			.store_uint(4, 3).store_slice(dest_address)
			.store_grams(amount)
			.store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
			.store_ref(state_init)
			.store_ref(body);
		  send_raw_message(msg.end_cell(), 1); ;; paying fees, revert on errors
		}

And that’s it according to the smart contract of the marketplace, below is the full code.

	;; NFT marketplace smart contract

	;; storage scheme
	;; storage#_ owner_address:MsgAddress
	;;           = Storage;

	(slice) load_data() inline {
	  var ds = get_data().begin_parse();
	  return 
		(ds~load_msg_addr() ;; owner
		 );
	}

	() save_data(slice owner_address) impure inline {
	  set_data(begin_cell()
		.store_slice(owner_address)
		.end_cell());
	}

	() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) {  ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

		var (owner_address) = load_data();
		throw_unless(401, equal_slices(sender_address, owner_address));
		int op = in_msg_body~load_uint(32);

		if (op == 1) { ;; deploy new auction
		  int amount = in_msg_body~load_coins();
		  (cell state_init, cell body) = (cs~load_ref(), cs~load_ref());
		  int state_init_hash = cell_hash(state_init);
		  slice dest_address = begin_cell().store_int(0, 8).store_uint(state_init_hash, 256).end_cell().begin_parse();

		  var msg = begin_cell()
			.store_uint(0x18, 6)
			.store_uint(4, 3).store_slice(dest_address)
			.store_grams(amount)
			.store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
			.store_ref(state_init)
			.store_ref(body);
		  send_raw_message(msg.end_cell(), 1); ;; paying fees, revert on errors
		}
	}

	() recv_external(slice in_msg) impure {
	}


### Sale Contract

#### Review

Let's look at the `op` in `recv_internal()` to understand what this smart contract "can do".
- `op` == 1 - empty op to just get Toncoin contracts (you can accumulate crypto in a contract with this op for later use)
- `op` == 2 - buy NFT - for this op, an auxiliary function buy () is written, which will send messages to make an NFT buy
- `op` == 3 - cancel sale

#### Storage

The first thing we will analyze is what the contract stores in the `c4` register (in other words, storage). Our smart contract has two helper functions `load_data()` and `save_data()` that will upload and save data to storage respectively.

In storage:
- `slice marketplace_address` - marketplace smart contract address
- `slice nft_address` - address of sold nft
- `slice nft_owner_address` - nft owner address
- `int full_price` - price
- `cell fees_cell` - a cell containing information about commissions, for example: marketplace commission and royalties

Function code for working with storage:

	(slice, slice, slice, int, cell) load_data() inline {
	  var ds = get_data().begin_parse();
	  return 
		(ds~load_msg_addr(), ;; marketplace_address 
		  ds~load_msg_addr(), ;; nft_address
		  ds~load_msg_addr(),  ;; nft_owner_address
		  ds~load_coins(), ;; full_price
		  ds~load_ref() ;; fees_cell
		 );
	}

	() save_data(slice marketplace_address, slice nft_address, slice nft_owner_address, int full_price, cell fees_cell) impure inline {
	  set_data(begin_cell()
		.store_slice(marketplace_address)
		.store_slice(nft_address)
		.store_slice(nft_owner_address)
		.store_coins(full_price)
		.store_ref(fees_cell)
		.end_cell());
	}

#### Handling internal messages

Like the marketplace smart contract, the sell smart contract starts by unloading the flags and checking that the message is not bounced.

	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) {  ;; ignore all bounced messages
			return ();
		}

	}

Next, we upload the address of the sender of the message to the smart contract, as well as the data from the `c4` register (storage).

	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) {  ;; ignore all bounced messages
			return ();
		}

		slice sender_address = cs~load_msg_addr();

		var (marketplace_address, nft_address, nft_owner_address, full_price, fees_cell) = load_data();
	}

##### Uninitialized NFTs

Now, before moving on to the logic of selling and canceling the "auction" of the sale, we need to handle the situation when the NFT is uninitialized. To understand whether the NFT is initialized, check whether the address of the owner is zero. And then, using the tilde, we organize the check (`~` is bitwise not in FUNC).

	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) {  ;; ignore all bounced messages
			return ();
		}

		slice sender_address = cs~load_msg_addr();

		var (marketplace_address, nft_address, nft_owner_address, full_price, fees_cell) = load_data();

		var is_initialized = nft_owner_address.slice_bits() > 2; ;; not initialized if null address

		if (~ is_initialized) {


		}
	}

I note right away that in the case of an uninitialized NFT, we will only receive messages from the NFT address and only with op meaning the transfer of ownership, so the processing of an uninitialized NFT in the Sale contract comes down to establishing the owner. But let's go in order:

If the message was sent from the marketplace, we simply accumulate Toncoins in the contract (for example, in the case of a contract deployment).

		if (~ is_initialized) {

		  if (equal_slices(sender_address, marketplace_address)) {
			 return (); ;; just accept coins on deploy
		  }

		}

Next, we look for the message to come from the NFT contract, and also check that the `op` of such a message is equal to `ownership_assigned`, i.e. this is a message about a change in ownership that has occurred.

    if (~ is_initialized) {
      
      if (equal_slices(sender_address, marketplace_address)) {
         return (); ;; just accept coins on deploy
      }

      throw_unless(500, equal_slices(sender_address, nft_address));
      int op = in_msg_body~load_uint(32);
      throw_unless(501, op == op::ownership_assigned());

    }
	
It remains only to get the address and save the information about the changed ownership of the NFT.

		if (~ is_initialized) {

		  if (equal_slices(sender_address, marketplace_address)) {
			 return (); ;; just accept coins on deploy
		  }

		  throw_unless(500, equal_slices(sender_address, nft_address));
		  int op = in_msg_body~load_uint(32);
		  throw_unless(501, op == op::ownership_assigned());
		  int query_id = in_msg_body~load_uint(64);
		  slice prev_owner_address = in_msg_body~load_msg_addr();

		  save_data(marketplace_address, nft_address, prev_owner_address, full_price, fees_cell);

		  return ();

		}
		
##### Message with empty body

In this example of a Sale contract, there is also a case where the body of the message that comes into the contract is empty, in which case the contract will simply try to make a purchase by calling the `buy()` helper function.

		if (in_msg_body.slice_empty?()) {
			buy(my_balance, marketplace_address, nft_address, nft_owner_address, full_price, fees_cell, msg_value, sender_address, 0);
			return ();
		}
		
After processing the case of an empty message, we get `op` and `query_id`. We will use `op ` to build logic, at the very end we will add an error call - for the case when something "incomprehensible" came:

		int op = in_msg_body~load_uint(32);
		int query_id = in_msg_body~load_uint(64);

		if (op == 1) { 
			;; аккумулируем в контракте TONCoins'ы
			return ();
		}

		if (op == 2) { 
			 ;; покупка NFT
			return ();
		}

		if (op == 3) { 
			;;отмена продажи
			return ();
		}

		throw(0xffff);

##### Purchase

For the purchase, a separate helper function is compiled, which we call in `recv_internal()`.

    if (op == 2) { ;; buy
     
      buy(my_balance, marketplace_address, nft_address, nft_owner_address, full_price, fees_cell, msg_value, sender_address, query_id);

      return ();

    }

The first thing to do before making a sale is to check if there are enough funds sent with the message. To do this, you need to check that there is enough money to cover the price, as well as the commissions associated with sending messages.

For commissions, we define a `min_gas_amount()` function that will simply store a value of 1 TON for verification, the function is defined as a low-level TVM primitive, using the `asm` keyword.

	int min_gas_amount() asm "1000000000 PUSHINT"; ;; 1 TON

We will implement the check, and also immediately upload information about royalties, for this there is a separate auxiliary function:

	() buy(int my_balance, slice marketplace_address, slice nft_address, slice nft_owner_address, int full_price, cell fees_cell, int msg_value, slice sender_address, int query_id) impure {
	  throw_unless(450, msg_value >= full_price + min_gas_amount());

	  var (marketplace_fee, royalty_address, royalty_amount) = load_fees(fees_cell);

	}

	(int, slice, int) load_fees(cell fees_cell) inline {
	  var ds = fees_cell.begin_parse();
	  return 
		(ds~load_coins(), ;; marketplace_fee,
		  ds~load_msg_addr(), ;; royalty_address 
		  ds~load_coins() ;; royalty_amount
		 );
	}

Let's move on to sending messages. We will send the first message to the current NFT owner, we will transfer TONcoins to him. The quantity should be equal to: the price of NFT minus the marketplace commissions and royalties, as well as the remaining balance of the smart contract, in case, for example, the purchase was made by more than one message and there were already TONcoins in the contract.

	() buy(int my_balance, slice marketplace_address, slice nft_address, slice nft_owner_address, int full_price, cell fees_cell, int msg_value, slice sender_address, int query_id) impure {
	  throw_unless(450, msg_value >= full_price + min_gas_amount());

	  var (marketplace_fee, royalty_address, royalty_amount) = load_fees(fees_cell);

	  var owner_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(nft_owner_address)
			   .store_coins(full_price - marketplace_fee - royalty_amount + (my_balance - msg_value))
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(owner_msg.end_cell(), 1);

	  }

Then we send royalties and marketplace commissions, everything is simple here, the corresponding amounts are sent to the royalties and marketplace addresses:

	() buy(int my_balance, slice marketplace_address, slice nft_address, slice nft_owner_address, int full_price, cell fees_cell, int msg_value, slice sender_address, int query_id) impure {
	  throw_unless(450, msg_value >= full_price + min_gas_amount());

	  var (marketplace_fee, royalty_address, royalty_amount) = load_fees(fees_cell);

	  var owner_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(nft_owner_address)
			   .store_coins(full_price - marketplace_fee - royalty_amount + (my_balance - msg_value))
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(owner_msg.end_cell(), 1);


	  var royalty_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(royalty_address)
			   .store_coins(royalty_amount)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(royalty_msg.end_cell(), 1);


	  var marketplace_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(marketplace_address)
			   .store_coins(marketplace_fee)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(marketplace_msg.end_cell(), 1);

	}

It remains to send the last message, the message to the NFT transfer contract (with `op::transfer()`)

	() buy(int my_balance, slice marketplace_address, slice nft_address, slice nft_owner_address, int full_price, cell fees_cell, int msg_value, slice sender_address, int query_id) impure {
	  throw_unless(450, msg_value >= full_price + min_gas_amount());

	  var (marketplace_fee, royalty_address, royalty_amount) = load_fees(fees_cell);

	  var owner_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(nft_owner_address)
			   .store_coins(full_price - marketplace_fee - royalty_amount + (my_balance - msg_value))
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(owner_msg.end_cell(), 1);


	  var royalty_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(royalty_address)
			   .store_coins(royalty_amount)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(royalty_msg.end_cell(), 1);


	  var marketplace_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(marketplace_address)
			   .store_coins(marketplace_fee)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(marketplace_msg.end_cell(), 1);

	  var nft_msg = begin_cell()
			   .store_uint(0x18, 6) 
			   .store_slice(nft_address)
			   .store_coins(0)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			   .store_uint(op::transfer(), 32)
			   .store_uint(query_id, 64)
			   .store_slice(sender_address) ;; new_owner_address
			   .store_slice(sender_address) ;; response_address
			   .store_int(0, 1) ;; empty custom_payload
			   .store_coins(0) ;; forward amount to new_owner_address
			   .store_int(0, 1); ;; empty forward_payload


	  send_raw_message(nft_msg.end_cell(), 128 + 32);
	}

And everything seems to be, but it is worth stopping at the mode with which we sent the last message.

###### "Burning contract" mode == 128 + 32

After sending a message about the transfer of NFT, the smart contract of sale is no longer relevant, the question arises how to "destroy" it or, in other words, "burn it". TON has a message sending mode that destroys the current contract.

`mode' = mode + 32` means that the current account should be destroyed if its resulting balance is zero. ([Documentation Link](https://ton-blockchain.github.io/docs/#/func/stdlib?id=send_raw_message))

Thus, at the very end of the `buy()` function, we send a message about the transfer of ownership and burn this sales contract.

The final code of the `buy()` function:

	() buy(int my_balance, slice marketplace_address, slice nft_address, slice nft_owner_address, int full_price, cell fees_cell, int msg_value, slice sender_address, int query_id) impure {
	  throw_unless(450, msg_value >= full_price + min_gas_amount());

	  var (marketplace_fee, royalty_address, royalty_amount) = load_fees(fees_cell);

	  var owner_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(nft_owner_address)
			   .store_coins(full_price - marketplace_fee - royalty_amount + (my_balance - msg_value))
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(owner_msg.end_cell(), 1);


	  var royalty_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(royalty_address)
			   .store_coins(royalty_amount)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(royalty_msg.end_cell(), 1);


	  var marketplace_msg = begin_cell()
			   .store_uint(0x10, 6) ;; nobounce
			   .store_slice(marketplace_address)
			   .store_coins(marketplace_fee)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

	  send_raw_message(marketplace_msg.end_cell(), 1);

	  var nft_msg = begin_cell()
			   .store_uint(0x18, 6) 
			   .store_slice(nft_address)
			   .store_coins(0)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			   .store_uint(op::transfer(), 32)
			   .store_uint(query_id, 64)
			   .store_slice(sender_address) ;; new_owner_address
			   .store_slice(sender_address) ;; response_address
			   .store_int(0, 1) ;; empty custom_payload
			   .store_coins(0) ;; forward amount to new_owner_address
			   .store_int(0, 1); ;; empty forward_payload


	  send_raw_message(nft_msg.end_cell(), 128 + 32);
	}

##### Cancel sale

Cancellation is simply a message transferring ownership of the NFT from the current owner, to the current owner with `mode == 128 + 32` to burn the contract later. But of course, first you need to check a few conditions.

The first thing to check is that we have enough TONcoin to send messages

    if (op == 3) { ;; cancel sale
         throw_unless(457, msg_value >= min_gas_amount());

        return ();
    }

The second is that the message about the cancellation of the sale came either from the marketplace or from the owner of the NFT. To do this, we use the bitwise OR `|`.

    if (op == 3) { ;; cancel sale
         throw_unless(457, msg_value >= min_gas_amount());
         throw_unless(458, equal_slices(sender_address, nft_owner_address) | equal_slices(sender_address, marketplace_address));

        return ();
    }
	
Well, the last is sending a message about the transfer of ownership from the owner to the owner)

    if (op == 3) { ;; cancel sale
         throw_unless(457, msg_value >= min_gas_amount());
         throw_unless(458, equal_slices(sender_address, nft_owner_address) | equal_slices(sender_address, marketplace_address));

         var msg = begin_cell()
           .store_uint(0x10, 6) ;; nobounce
           .store_slice(nft_address)
           .store_coins(0)
           .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
           .store_uint(op::transfer(), 32)
           .store_uint(query_id, 64) 
           .store_slice(nft_owner_address) ;; new_owner_address
           .store_slice(nft_owner_address) ;; response_address;
           .store_int(0, 1) ;; empty custom_payload
           .store_coins(0) ;; forward amount to new_owner_address
           .store_int(0, 1); ;; empty forward_payload

        send_raw_message(msg.end_cell(), 128 + 32);

        return ();
    }
	
## Conclusion

I publish similar analyzes and tutorials in the telegram channel https://t.me/ton_learn, I will be glad for your subscription.
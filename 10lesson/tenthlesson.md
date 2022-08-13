# Lesson 10 NFT Standard

In lesson 9, we discussed that there is a division of tokens into non-fungible and fungible ones, as well as what the standard of fungible tokens looks like, in this lesson we will discuss non-fungible tokens and analyze examples according to the standard.

## What is the NFT standard in TON

So, non-fungible tokens are assets, each instance of which is unique (specific) and cannot be replaced by another similar asset. A non-fungible token is some kind of digital entity certificate with the ability to transfer the certificate through some mechanism.

[NFT standard in TON](https://github.com/ton-blockchain/TIPs/issues/62) describes:
- Change of form of ownership.
- A way to combine items in a collection.
- Method of deduplication of the common part of the collection.

> Deduplication - a method of eliminating duplicate copies, repetitive data

As for Jetton, the NFT standard has a master contract - a collection contract and smart contracts for an individual NFT in a collection. There is a great example in the standard: If you release a collection containing 10,000 items, then you deploy 10,001 smart contracts, one collection contract, and 10,000 contracts for each item.

> The NFT standard also explains why exactly this NFT implementation scheme was chosen, with so many contracts, the item is Rationale and the next one.

There are extensions in TON for the [NFT standard](https://github.com/ton-blockchain/TIPs/issues/62) (as of 07/29/2022, some of them are in Drafts):
- [NFTRoyalty](https://github.com/ton-blockchain/TIPs/issues/66) - about how to get royalty information and provide universal support for royalty payments across all NFT marketplaces and ecosystem members.
- [NFTBounceable](https://github.com/ton-blockchain/TIPs/issues/67) - a way to rollback NFT transfers if the recipient dismissed the notification. (For example, if the NFT was sent to the wrong address and the recipient's smart contract does not know how to interact with the NFT.)
- [NFTEditable](https://github.com/ton-blockchain/TIPs/issues/68) - about NFT bulk changes
- [NFTUpgradable](https://github.com/ton-blockchain/TIPs/issues/69) - about scalable NFTs

#### Functionality of contracts according to the NFT standard

The standard describes two key smart contracts for NFTs:
- collection smart contract
- smart contract for a separate NFT

> In [examples](https://github.com/ton-blockchain/token-contract/tree/main/nft) there is also a smart contract that implements the sale and some kind of marketplace, but in this lesson we will not analyze these contracts , let's focus on the NFT standard.

Collection smart contract should implement:
- deployment (deploy) of smart contracts of NFT elements of this collection. (in the example that we will analyze, there will be both a single NFT deployment and a mass NFT deployment)
- Get-method `get_collection_data()` , which will return the address of the owner of the collection, the content of the collection, and the counter of current NFTs in the collection
- Get-method `get_nft_address_by_index(int ​​index)`, which, by the number of the NFT element of this collection, returns the address (`MsgAddress`) of the smart contract of this NFT element
- Get-method `get_nft_content(int index, cell individual_content)`, which returns information on a specific NFT in the collection

A smart contract for a separate NFT must implement:
- Get-method `get_nft_data()`, which will return data for this NFT
- transfer of NFT ownership
- internal method `get_static_data`, to get data about a particular NFT by internal message.

> Important: the standard also describes many nuances regarding commissions, restrictions, and other things, but we will not dwell on this in too much detail so that the lesson does not turn into a book.

#### Metadata for the NFT standard

 - `uri` - optional parameter, link to JSON document with metadata.
 - `name` - NFT identifier string, i.e. identifies the asset.
 - `description` - asset description.
 - `image` is a URI pointing to a MIME-type image resource.
 - `image_data` - Either the binary representation of the image for the web layout, or base64 for the offline layout.

## Parsing the code

Before parsing the code, I will note that in general the "mechanics" are repeated, so the further into the analysis, the more top-level the analysis will be.

We will parse files from the [repository](https://github.com/ton-blockchain/token-contract/tree/main/nft) in the following order:

- nft-collection.fc
- nft-item.fc

##nft-collection.fc

The collection contract starts with two helper functions, for loading and unloading data.

##### Loading and unloading data from c4

 The "collection contract store" will store:
 
- `owner_address` - address of the owner of the collection, if there is no owner, then the zero address
- `next_item_index` is the number of currently deployed NFT items in the collection*.
- `content` - content of the collection in the format corresponding to the [token](https://github.com/ton-blockchain/TIPs/issues/64) standard .
- `nft_item_code` - code of a separate NFT, will be used to "reproduce" the address of the smart contract.
- `royalty_params` - royalty parameters

> * - If the value of `next_item_index` is -1, then this is an inconsistent collection, such collections must provide their own way of generating an index/enumeration of items.

Let's write help functions `load_data()` and `save_data()` that will unload and load data from register c4. (We will not analyze loading and unloading in detail, since similar functionality has been analyzed many times in previous lessons).

##### "Reproduction/Recreation" functions

In this smart contract, we need to reproduce the address of the smart contract with a separate NFT of this owner at the address of the owner. To do this, we will use the same "trick" as in the Jetton examples.

Let me remind you, if we study the [documentation](https://ton.org/docs/#/howto/step-by-step?id=_3-compiling-a-new-smart-contract) of how a smart contract is compiled .

We can see the following:

The code and data for the new smart contract are concatenated into a StateInit structure (on the following lines), the address of the new smart contract (equal to the hash of this StateInit structure) is computed and output, and then an external message is generated with a destination address equal to the address of the new smart contract. This outer message contains both the correct StateInit for the new smart contract and a non-trivial payload (signed with the correct private key).

For us, this means that we can get the address of the smart contract of a separate NFT using `item_index` and the smart contract code of a separate NFT, we will collect the StateInit of the wallet.

This is possible because the [hashing](https://en.wikipedia.org/wiki/Hash_function) are deterministic, which means that there will be a different hash for different inputs,
 at the same time, for the same input data, the hash function will always return a uniform hash.
 
To do this, the smart contract has the `calculate_nft_item_state_init()` and `calculate_nft_item_address()` functions:


	cell calculate_nft_item_state_init(int item_index, cell nft_item_code) {
	  cell data = begin_cell().store_uint(item_index, 64).store_slice(my_address()).end_cell();
	  return begin_cell().store_uint(0, 2).store_dict(nft_item_code).store_dict(data).store_uint(0, 1).end_cell();
	}

	slice calculate_nft_item_address(int wc, cell state_init) {
	  return begin_cell().store_uint(4, 3)
						 .store_int(wc, 8)
						 .store_uint(cell_hash(state_init), 256)
						 .end_cell()
						 .begin_parse();
	}

The `calculate_nft_item_state_init()` function collects the StateInit according to the given `item_index`.

The `calculate_nft_item_address()` function collects the address according to the [TL-B scheme](https://github.com/ton-blockchain/ton/blob/master/crypto/block/block.tlb#L99).

> the function `cell_hash()` is used to calculate the hash - it calculates the hash of the cell representation.

##### Auxiliary function for deploying a single NFT

>*Deploy - the process of transferring to the network (in this case, a separate NFT)

To deploy NFT, we will need to send the necessary information on NFT to the address of the smart contract, respectively:

- reproduce the address of the smart contract of a separate NFT
- send information by message

Smart contract address:


		() deploy_nft_item(int item_index, cell nft_item_code, int amount, cell nft_content) impure {
		  cell state_init = calculate_nft_item_state_init(item_index, nft_item_code);
		  slice nft_address = calculate_nft_item_address(workchain(), state_init);

		}

workchain() is a helper function from `params.fc`. It is defined as a low-level TVM primitive using the `asm` keyword.

int workchain() asm "0 PUSHINT";

Number 0 is the base vorchain.

We send information by message:

	() deploy_nft_item(int item_index, cell nft_item_code, int amount, cell nft_content) impure {
	  cell state_init = calculate_nft_item_state_init(item_index, nft_item_code);
	  slice nft_address = calculate_nft_item_address(workchain(), state_init);
	  var msg = begin_cell()
				.store_uint(0x18, 6)
				.store_slice(nft_address)
				.store_coins(amount)
				.store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
				.store_ref(state_init)
				.store_ref(nft_content);
	  send_raw_message(msg.end_cell(), 1); ;; pay transfer fees separately, revert on errors
	}

##### Helper function for sending Royalties parameters

This helper function will send static royalty data in the case of an internal message to `recv_internal()`.

Technically, everything is simple here, we send a message with the `op` code `op::report_royalty_params()` :

	() send_royalty_params(slice to_address, int query_id, slice data) impure inline {
	  var msg = begin_cell()
		.store_uint(0x10, 6) ;; nobounce - int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool src:MsgAddress -> 011000
		.store_slice(to_address)
		.store_coins(0)
		.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
		.store_uint(op::report_royalty_params(), 32)
		.store_uint(query_id, 64)
		.store_slice(data);
	  send_raw_message(msg.end_cell(), 64); ;; carry all the remaining value of the inbound message
	}
	
#### recv_internal()

In order for our wallet to receive messages, we will use the external method `recv_internal()`

    () recv_internal()  {

    }

The external method of our collection smart contract should implement:
- sending royalty parameters
- deployment of a separate NFT
- deploy several NFTs at once (batch deploy)
- change of owner
- as well as a large number of exceptions that check the logic of work)

##### External method arguments

According to the documentation of the [TON virtual machine - TVM](https://ton-blockchain.github.io/docs/tvm.pdf), when an event occurs on an account in one of the TON chains, it triggers a transaction.

Each transaction consists of up to 5 stages. Read more [here](https://ton.org/docs/#/smart-contracts/tvm_overview?id=transactions-and-phases).

We are interested in **Compute phase**. And to be more specific, what is "on the stack" during initialization. For normal message-triggered transactions, the initial state of the stack looks like this:

5 elements:
- Smart contract balance (in nanoTons)
- Incoming message balance (in nanotones)
- Cell with incoming message
- Incoming message body, slice type
- Function selector (for recv_internal it is 0)

As a result, we get the following code:

    () recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body)  {

    }
	
##### Build the skeleton of the external method

So the first thing we do in `recv_internal()` is check if the message is empty:

	  if (in_msg_body.slice_empty?()) { ;; ignore empty messages
		return ();
	  }
	  
Next, we get the flags and check if the incoming message is a bounced one. If this is a bounce, we complete the function:

		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) { ;; ignore all bounced messages
			return ();
		}
		
Next, we get the sender address, as well as `op` and `query_id`:

	slice sender_address = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
	
	
Unload data from register `c4`:

    var (owner_address, next_item_index, content, nft_item_code, royalty_params) = load_data();
	
Using the previously described function for transferring information on royalties, we send this information:

    if (op == op::get_royalty_params()) {
        send_royalty_params(sender_address, query_id, royalty_params.begin_parse());
        return ();
    }
	
Next, there will be functionality that is available only to the owner of the collection (NFT release, etc.), so we will check the address and throw an exception if this is not the case:

    throw_unless(401, equal_slices(sender_address, owner_address));

With the help of conditional statements and `op`, further smart contract logic is created:

    if (op == 1) { ;; deploy new nft

    }
    if (op == 2) { ;; batch deploy of new nfts

    }
    if (op == 3) { ;; change owner

    }
    throw(0xffff);
	
There is an exception at the end, i.e. if the contract does not take some action according to `op`, an exception will be thrown. Final framework `recv_internal()`:

	() recv_internal(cell in_msg_full, slice in_msg_body) impure {
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

		var (owner_address, next_item_index, content, nft_item_code, royalty_params) = load_data();

		if (op == op::get_royalty_params()) {
			send_royalty_params(sender_address, query_id, royalty_params.begin_parse());
			return ();
		}

		throw_unless(401, equal_slices(sender_address, owner_address));


		if (op == 1) { ;; deploy new nft

		}
		if (op == 2) { ;; batch deploy of new nfts

		}
		if (op == 3) { ;; change owner

		}
		throw(0xffff);
	}
	
##### op == 1 Deploy NFT

We get the index of a separate NFT from the message body:

    if (op == 1) { ;; deploy new nft
      int item_index = in_msg_body~load_uint(64);

      return();
    }

We check that the index is not greater than the following index, unloaded from c4:

    if (op == 1) { ;; deploy new nft
      int item_index = in_msg_body~load_uint(64);
      throw_unless(402, item_index <= next_item_index);

      }
      return();
    }

 Let's add the `is_last` variable, which we will use for checking, and also change the value of `item_index` to `next_item_index`.
 
 Immediately after that, we will use the helper function for the NFT deployment:
 
     if (op == 1) { ;; deploy new nft
      int item_index = in_msg_body~load_uint(64);
      throw_unless(402, item_index <= next_item_index);
      var is_last = item_index == next_item_index;
      deploy_nft_item(item_index, nft_item_code, in_msg_body~load_coins(), in_msg_body~load_ref());

    }
 
 Now it remains to store the data in the `c4` register, check `is_last`, add one to the `next_item_index` counter and save the data in `c4`.
 
     if (op == 1) { ;; deploy new nft
      int item_index = in_msg_body~load_uint(64);
      throw_unless(402, item_index <= next_item_index);
      var is_last = item_index == next_item_index;
      deploy_nft_item(item_index, nft_item_code, in_msg_body~load_coins(), in_msg_body~load_ref());
      if (is_last) {
        next_item_index += 1;
        save_data(owner_address, next_item_index, content, nft_item_code, royalty_params);
      }
      return();
    }

Finally, we end the function with `return ()`.

##### op == 2 Batch NFT deploy

Mass deployment is just an NFT deployment in a loop, the loop will go through a dictionary, the data for which we will simply unload from the message body (a link to the beginning of the dictionary, in simple terms).

> In detail on working with dictionaries (Hashmaps) we stopped in the seventh lesson

I also consider it important to note that the "one-time" mass deployment in TON is limited. In [TVM](https://ton.org/docs/#/smart-contracts/tvm_overview?id=tvm-is-stack-machine), the number of output actions in a single transaction must be `<=255`.

> Let me remind you that FunС has three [loops](https://ton.org/docs/#/func/statements?id=loops): `repeat`,`until`,`while`

Let's create a counter `counter`, which we will use in the loop, and also upload a link to the NFT list.

		if (op == 2) { ;; batch deploy of new nfts
		  int counter = 0;
		  cell deploy_list = in_msg_body~load_ref();

		}
		
Next, we have to use the `udict::delete_get_min(cell dict, int key_len)` function - calculates the minimum key `k` in the `dict` dictionary, deletes it and returns (dict', x, k, -1), where `dict '` is a modified version of `dict` and x is the value associated with `k`. If `dict` is empty, returns (dict, null, null, 0). The last value is -1, this is a flag, if the function returns a modified dictionary, then the flag is -1, if not, then 0. We will use the flag as a loop condition

So, let's denote a loop, and using `udict::delete_get_min(cell dict, int key_len)` we will get the NFT values for deployment.

    if (op == 2) { ;; batch deploy of new nfts
      int counter = 0;
      cell deploy_list = in_msg_body~load_ref();
      do {
        var (item_index, item, f?) = deploy_list~udict::delete_get_min(64);
       
      } until ( ~ f?);
    }

> ~ - bitwise not ? - conditional operator

Let's check the flag (i.e. there is something to work with), immediately after the check we increase the counter `counter`, which we defined earlier. We do this in order to check the condition that the number of NFT units during mass deployment does not go beyond the limits of TVM (I wrote about this above).

    if (op == 2) { ;; batch deploy of new nfts
      int counter = 0;
      cell deploy_list = in_msg_body~load_ref();
      do {
        var (item_index, item, f?) = deploy_list~udict::delete_get_min(64);
        if (f?) {
          counter += 1;
          if (counter >= 250) { ;; Limit due to limits of action list size
            throw(399);
          }
		  
      } until ( ~ f?);
    }

We also check that there is no confusion with indices, that is, the current index is not greater than the next one. And after that, let's deploy NFT. Additionally, we will handle the situation if the number of the current NFT is equal to the next one by adding one.

    if (op == 2) { ;; batch deploy of new nfts
      int counter = 0;
      cell deploy_list = in_msg_body~load_ref();
      do {
        var (item_index, item, f?) = deploy_list~udict::delete_get_min(64);
        if (f?) {
          counter += 1;
          if (counter >= 250) { ;; Limit due to limits of action list size
            throw(399);
          }

          throw_unless(403 + counter, item_index <= next_item_index);
          deploy_nft_item(item_index, nft_item_code, item~load_coins(), item~load_ref());
          if (item_index == next_item_index) {
            next_item_index += 1;
          }
        }
      } until ( ~ f?);

    }

At the very end, it remains to save the data and finish the function. Final code `op` == 2.

    if (op == 2) { ;; batch deploy of new nfts
      int counter = 0;
      cell deploy_list = in_msg_body~load_ref();
      do {
        var (item_index, item, f?) = deploy_list~udict::delete_get_min(64);
        if (f?) {
          counter += 1;
          if (counter >= 250) { ;; Limit due to limits of action list size
            throw(399);
          }

          throw_unless(403 + counter, item_index <= next_item_index);
          deploy_nft_item(item_index, nft_item_code, item~load_coins(), item~load_ref());
          if (item_index == next_item_index) {
            next_item_index += 1;
          }
        }
      } until ( ~ f?);
      save_data(owner_address, next_item_index, content, nft_item_code, royalty_params);
      return ();
    }

##### op == 3 Owner change

The collection smart contract example provides for the functionality of changing the owner of the collection - the address changes. It works like this:
- we get the address of the new owner from the body of the message using `load_msg_addr()`
- save data in register `c4` with new owner

    if (op == 3) { ;; change owner
      slice new_owner = in_msg_body~load_msg_addr();
      save_data(new_owner, next_item_index, content, nft_item_code, royalty_params);
      return ();
    }

#### Get methods

In our example, there are four Get methods:
- get_collection_data() - returns information about the collection (owner address, [Token standard](https://github.com/ton-blockchain/TIPs/issues/64) metadata about the collection, and NFT index count)
- get_nft_address_by_index(int ​​index) - reproduces the NFT smart contract by index
- royalty_params() - returns royalty parameters
- get_nft_content(int index, cell individual_nft_content) - returns information on a specific NFT in the collection

> NFT royalties are royalties whenever their NFTs change hands on the secondary market

The get_collection_data(), get_nft_address_by_index(), get_nft_content() methods are mandatory for the NFT standard in TON.

##### get_collection_data() 

We get the address of the owner, the index (the number of currently deployed NFT elements in the collection.) and information about the collection from the `c4` register and simply return this data.

	(int, cell, slice) get_collection_data() method_id {
	  var (owner_address, next_item_index, content, _, _) = load_data();
	  slice cs = content.begin_parse();
	  return (next_item_index, cs~load_ref(), owner_address);
	}

##### get_nft_address_by_index() 

Gets the serial number of the NFT element of this collection and returns the address (MsgAddress) of the smart contract of this NFT element. Reproduction of the address of the smart contract occurs due to StateInit (already sorted it out).

	slice get_nft_address_by_index(int index) method_id {
		var (_, _, _, nft_item_code, _) = load_data();
		cell state_init = calculate_nft_item_state_init(index, nft_item_code);
		return calculate_nft_item_address(workchain(), state_init);
	}

##### royalty_params() 
We return the royalty parameters. This feature belongs to the extension of the NFT standard, namely [NFTRoyalty](https://github.com/ton-blockchain/TIPs/issues/66).
`royalty_params()` returns the numerator, denominator, and address to send royalties to. The royalty share is the numerator/denominator. For example, if the numerator = 11 and the denominator = 1000, then the royalty rate is 11/1000 * 100% = 1.1%. The numerator must be less than the denominator.

	(int, int, slice) royalty_params() method_id {
		 var (_, _, _, _, royalty) = load_data();
		 slice rs = royalty.begin_parse();
		 return (rs~load_uint(16), rs~load_uint(16), rs~load_msg_addr());
	}

##### get_nft_content() 

Gets the serial number of the NFT element of this collection and the individual content of this NFT element, and returns the full content of the NFT element in a format conforming to the [TIP-64 standard](https://github.com/ton-blockchain/TIPs/issues/64).

The important thing to note here is how the content is returned:

	  return (begin_cell()
						  .store_uint(1, 8) ;; offchain tag
						  .store_slice(common_content)
						  .store_ref(individual_nft_content)
			  .end_cell());

`store_uint(1, 8) ` - a similar tag means that the data is stored offline, you can read about data storage tags in the token standard - [Content representation](https://github.com/ton-blockchain/TIPs/issues/ 64).

Full function code:

	cell get_nft_content(int index, cell individual_nft_content) method_id {
	  var (_, _, content, _, _) = load_data();
	  slice cs = content.begin_parse();
	  cs~load_ref();
	  slice common_content = cs~load_ref().begin_parse();
	  return (begin_cell()
						  .store_uint(1, 8) ;; offchain tag
						  .store_slice(common_content)
						  .store_ref(individual_nft_content)
			  .end_cell());
	}

## nft-item.fc

The smart contract of a separate NFT begins with auxiliary functions for working with the `с4` register, let's look at what will be stored in the "storage" of the smart contract of a separate NFT.

- `index` - the index of this particular NFT
- `collection_address` - smart contract address of the collection to which this NFT belongs.
- `owner_address` - address of the current owner of this NFT
- `content` - content if NFT has a collection - individual NFT content in any format, if NFT does not have a collection - NFT content in TIP-64 format.

> The question may arise, what to pass in `collection_address` and `index`, if there is no collection, in `collection_address` we will pass addr_none, in `index` we will pass an arbitrary but constant value.

#### Loading data

Here we use the `store_` functions already familiar to us:

	() store_data(int index, slice collection_address, slice owner_address, cell content) impure {
		set_data(
			begin_cell()
				.store_uint(index, 64)
				.store_slice(collection_address)
				.store_slice(owner_address)
				.store_ref(content)
				.end_cell()
		);
	}

But with unloading data and `c4` everything will be more complicated than in previous times.

#### Upload data

In addition to the data from `c4`, we will also pass the value 0 and -1, depending on whether the NFT is fully initialized and ready for interaction.
We will get the value as follows:
- first unload index, collection_address from `с4`
- and then check the number of bits in the remaining `owner_address` and `cell content` using the `slice_bits()` function

	(int, int, slice, slice, cell) load_data() {
		slice ds = get_data().begin_parse();
		var (index, collection_address) = (ds~load_uint(64), ds~load_msg_addr());
		if (ds.slice_bits() > 0) {
		  return (-1, index, collection_address, ds~load_msg_addr(), ds~load_ref());
		} else {  
		  return (0, index, collection_address, null(), null()); ;; nft not initialized yet
		}
	}

#### Plus a helper function for sending a message send_msg()

The smart contract of a single NFT must support the following functionality:
- transfer of ownership of NFTs
- getting static NFT data

According to the standard, both functionality involves sending messages, so let's write an auxiliary function for sending messages, which will accept:

- `slice to_address` - address where to send the message
- `int amount` - amount of TON
- `int op` - `op` code to identify the operation
- `int query_id` - query_id used in all internal request-response messages. [More](https://ton.org/docs/#/howto/smart-contract-guidelines?id=smart-contract-guidelines)
- `builder payload` - some payload we want to send with the message
- `int send_mode` - Message sending mode, more details about modes can be found in the third lesson

The framework for the send message helper function:

	() send_msg(slice to_address, int amount, int op, int query_id, builder payload, int send_mode) impure inline {

	}
	
> Let me remind you `inline` - means that the code is actually substituted in each place of the function call.

We collect the message, checking that there is a `builder payload` and of course we send the message with the given `mode`.

Final code:

	() send_msg(slice to_address, int amount, int op, int query_id, builder payload, int send_mode) impure inline {
	  var msg = begin_cell()
		.store_uint(0x10, 6) ;; nobounce - int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool src:MsgAddress -> 011000
		.store_slice(to_address)
		.store_coins(amount)
		.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
		.store_uint(op, 32)
		.store_uint(query_id, 64);

	  if (~ builder_null?(payload)) {
		msg = msg.store_builder(payload);
	  }

	  send_raw_message(msg.end_cell(), send_mode);
	}

#### NFT transfer_ownership() function

In order to effect an NFT ownership transfer, the key things to do are:
- check different conditions from [standard](https://github.com/ton-blockchain/TIPs/issues/62)
- send a message to the new owner that ownership has been assigned
- send excess TON back, or to the specified address (back is written here for ease of understanding)
- save the new owner in the contract

So the function will take:

`int my_balance` - Balance (after crediting the cost of the incoming message) of the smart contract (in nanoTons). According to [Compute phase](https://ton.org/docs/#/smart-contracts/tvm_overview?id=initialization-of-tvm)
`int index` - index of a single NFT collection
`slice collection_address` - collection smart contract address
`slice owner_address` - address of the owner
`cell content` - cell with NFT content
`slice sender_address` - address of the sender of the change of ownership message
`int query_id` - query_id used in all internal request-response messages. [More](https://ton.org/docs/#/howto/smart-contract-guidelines?id=smart-contract-guidelines)
`slice in_msg_body` - what will remain of the message body in `recv_internal()`, inside we need address addresses
`int fwd_fees` - the transaction cost of the message sent to `recv_internal()`, here it will be used to estimate the TON value needed to perform the transfer operation

The function starts by checking that the address of the "change owner command sender" is equal to the address of the owner, i.e. only the current owner can change.

    throw_unless(401, equal_slices(sender_address, owner_address));
	
Now we need to parse `force_chain()` from the params.fc file.

	force_chain(to_owner_address);

The `force_chain` function checks that the address is in workchain number 0 (the base workchain). You can read more about addresses and numbers [here](https://github.com/ton-blockchain/ton/blob/master/doc/LiteClient-HOWTO) at the very beginning. Let's analyze the code from params.fc:
	int workchain() asm "0 PUSHINT";

	() force_chain(slice addr) impure {
	  (int wc, _) = parse_std_addr(addr);
	  throw_unless(333, wc == workchain());
	}

We define the `workchain()` helper function as a low-level TVM primitive using the `asm` keyword. Integer == 0 we need for comparison.

	int workchain() asm "0 PUSHINT";
	

To extract the information we need from the address, `parse_std_addr()` is used. `parse_std_addr()` - returns a workchain and a 256-bit integer address from `MsgAddressInt`.

	() force_chain(slice addr) impure {
	  (int wc, _) = parse_std_addr(addr);
	  throw_unless(333, wc == workchain());
	}

And to raise an exception if the workchains are not equal, we will use `throw_unless()`.

Let's go back to our nft-item.fc function. We get the address of the new owner, check the workchain with the force_chain() function, and also get the address where to send the notification that the owner has changed.

    slice new_owner_address = in_msg_body~load_msg_addr();
    force_chain(new_owner_address);
    slice response_destination = in_msg_body~load_msg_addr();
	
Since the example does not involve the use of a custom payload, we skip it and get the amount of nanoTons from the `forward_amount` body that will be sent to the new owner. Now the function looks like this:

	() transfer_ownership(int my_balance, int index, slice collection_address, slice owner_address, cell content, slice sender_address, int query_id, slice in_msg_body, int fwd_fees) impure inline {
		throw_unless(401, equal_slices(sender_address, owner_address));

		slice new_owner_address = in_msg_body~load_msg_addr();
		force_chain(new_owner_address);
		slice response_destination = in_msg_body~load_msg_addr();
		in_msg_body~load_int(1); ;; this nft don't use custom_payload
		int forward_amount = in_msg_body~load_coins();
	}

Next comes the calculation of the Ton value, which will need to be sent back to the address for notification of a change in ownership. I will not stop here, so as not to drag out the lesson, but to make it easier to understand the code that will be below, I advise you to familiarize yourself with [Transaction fees] (https://ton.org/docs/#/smart-contracts/fees). Also note that we take into account when calculating that the address can be `addr_none`.

    int rest_amount = my_balance - min_tons_for_storage();
    if (forward_amount) {
      rest_amount -= (forward_amount + fwd_fees);
    }
    int need_response = response_destination.preload_uint(2) != 0; ;; if NOT addr_none: 00
    if (need_response) {
      rest_amount -= fwd_fees;
    }

If the remaining value is less than zero, we will throw an exception:

   throw_unless(402, rest_amount >= 0); ;; base nft spends fixed amount of gas, will not check for response
   
Now we send a notification to the new owner:

		if (forward_amount) {
		  send_msg(new_owner_address, forward_amount, op::ownership_assigned(), query_id, begin_cell().store_slice(owner_address).store_slice(in_msg_body), 1);  ;; paying fees, revert on errors
		}
		
After checking the workchain, we will send a notification to the address that was specified for the notification.

		if (need_response) {
		  force_chain(response_destination);
		  send_msg(response_destination, rest_amount, op::excesses(), query_id, null(), 1); ;; paying fees, revert on errors
		}

And of course we save the changes in the `c4` register. Outcome:

	() transfer_ownership(int my_balance, int index, slice collection_address, slice owner_address, cell content, slice sender_address, int query_id, slice in_msg_body, int fwd_fees) impure inline {
		throw_unless(401, equal_slices(sender_address, owner_address));

		slice new_owner_address = in_msg_body~load_msg_addr();
		force_chain(new_owner_address);
		slice response_destination = in_msg_body~load_msg_addr();
		in_msg_body~load_int(1); ;; this nft don't use custom_payload
		int forward_amount = in_msg_body~load_coins();

		int rest_amount = my_balance - min_tons_for_storage();
		if (forward_amount) {
		  rest_amount -= (forward_amount + fwd_fees);
		}
		int need_response = response_destination.preload_uint(2) != 0; ;; if NOT addr_none: 00
		if (need_response) {
		  rest_amount -= fwd_fees;
		}

		throw_unless(402, rest_amount >= 0); ;; base nft spends fixed amount of gas, will not check for response

		if (forward_amount) {
		  send_msg(new_owner_address, forward_amount, op::ownership_assigned(), query_id, begin_cell().store_slice(owner_address).store_slice(in_msg_body), 1);  ;; paying fees, revert on errors
		}
		if (need_response) {
		  force_chain(response_destination);
		  send_msg(response_destination, rest_amount, op::excesses(), query_id, null(), 1); ;; paying fees, revert on errors
		}

		store_data(index, collection_address, new_owner_address, content);
	}

##### External method arguments

According to the documentation of the [TON virtual machine - TVM](https://ton-blockchain.github.io/docs/tvm.pdf), when an event occurs on an account in one of the TON chains, it triggers a transaction.

Each transaction consists of up to 5 stages. Read more [here](https://ton.org/docs/#/smart-contracts/tvm_overview?id=transactions-and-phases).

We are interested in **Compute phase**. And to be more specific, what is "on the stack" during initialization. For normal message-triggered transactions, the initial state of the stack looks like this:

5 elements:
- Smart contract balance (in nanoTons)
- Incoming message balance (in nanotones)
- Cell with incoming message
- Incoming message body, slice type
- Function selector (for recv_internal it is 0)

As a result, we get the following code:

    () recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body)  {

    }
	
##### Get data from message body

So the first thing we do in `recv_internal()` is check if the message is empty:

  if (in_msg_body.slice_empty?()) { ;; ignore empty messages
    return ();
  }
 
Next, we begin to parse (read out) the message:

	slice cs = in_msg_full.begin_parse();
	
We get the flags and check that the message was not returned (here we mean bounced).
	
	int flags = cs~load_uint(4);
    if (flags & 1) { ;; ignore all bounced messages
        return ();
    }
	
Now we skip values that we don't need, what values can be found [here](https://ton.org/docs/#/smart-contracts/messages).

    cs~load_msg_addr(); ;; skip dst
    cs~load_coins(); ;; skip value
    cs~skip_bits(1); ;; skip extracurrency collection
    cs~load_coins(); ;; skip ihr_fee
	
We also get `fwd_fee`, which we will later use to calculate how many Ton to send back after all the manipulations.

Now we get the data from the `c4` register, including `init `, the very value 0 and -1, depending on whether the NFT is fully initialized and ready for interaction.

If the NFT is not ready, check that the sender of the message is the owner of the collection and initialize this NFT

    (int init?, int index, slice collection_address, slice owner_address, cell content) = load_data();
    if (~ init?) {
      throw_unless(405, equal_slices(collection_address, sender_address));
      store_data(index, collection_address, in_msg_body~load_msg_addr(), in_msg_body~load_ref());
      return ();
    }
	
Next, we get `op` and `query_id` to build logic using conditional operators:

    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);

The first `op` is the transfer of ownership, technically it's simple: call the `transfer_ownership()` function we declared earlier and finish execution.

    if (op == op::transfer()) {
      transfer_ownership(my_balance, index, collection_address, owner_address, content, sender_address, query_id, in_msg_body, fwd_fee);
      return ();
    }

The second `op` is getting static data, so we just send a message with the data:

    if (op == op::get_static_data()) {
      send_msg(sender_address, 0, op::report_static_data(), query_id, begin_cell().store_uint(index, 256).store_slice(collection_address), 64);  ;; carry all the remaining value of the inbound message
      return ();
    }
	
At the end there is an exception, i.e. if the contract does not take some action according to `op`, an exception will be thrown. Final `recv_internal()` code:

	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}

		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) { ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

		cs~load_msg_addr(); ;; skip dst
		cs~load_coins(); ;; skip value
		cs~skip_bits(1); ;; skip extracurrency collection
		cs~load_coins(); ;; skip ihr_fee
		int fwd_fee = cs~load_coins(); ;; we use message fwd_fee for estimation of forward_payload costs


		(int init?, int index, slice collection_address, slice owner_address, cell content) = load_data();
		if (~ init?) {
		  throw_unless(405, equal_slices(collection_address, sender_address));
		  store_data(index, collection_address, in_msg_body~load_msg_addr(), in_msg_body~load_ref());
		  return ();
		}

		int op = in_msg_body~load_uint(32);
		int query_id = in_msg_body~load_uint(64);

		if (op == op::transfer()) {
		  transfer_ownership(my_balance, index, collection_address, owner_address, content, sender_address, query_id, in_msg_body, fwd_fee);
		  return ();
		}
		if (op == op::get_static_data()) {
		  send_msg(sender_address, 0, op::report_static_data(), query_id, begin_cell().store_uint(index, 256).store_slice(collection_address), 64);  ;; carry all the remaining value of the inbound message
		  return ();
		}
		throw(0xffff);
	}
	
#### Get-method get_nft_data()

A smart contract for a separate NFT according to the [standard](https://github.com/ton-blockchain/TIPs/issues/62) must have one mandatory Get method.

This method simply returns data about this individual NFT, namely, unloads data from `c4`:

	(int, int, slice, slice, cell) get_nft_data() method_id {
	  (int init?, int index, slice collection_address, slice owner_address, cell content) = load_data();
	  return (init?, index, collection_address, owner_address, content);
	}
# Lesson 5 Remembering the Address and identifying the operation
## Introduction

In this lesson, we will write a smart contract that can perform different operations depending on the flag in the test network of The Open Network in the FUNC language, deploy it to the test network using [toncli](https://github.com/disintar/toncli), and we will test it in the next lesson.

## Requirements

To complete this tutorial, you need to install the [toncli](https://github.com/disintar/toncli/blob/master/INSTALLATION.md) command line interface .

And also be able to create / deploy a project using toncli, you can learn this in [the first lesson](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/1lesson/firstlesson.md).

## Op - to identify the operation

Before considering what kind of smart contract we will do in this lesson, I suggest that you study [recommendations](https://ton.org/docs/#/howto/smart-contract-guidelines?id=smart-contract-guidelines) about the smart contract message body(`message body;`).

In order for us to create a semblance of a client-server architecture on smart contracts described in the recommendations, it is proposed to start each message (strictly speaking, the message body) with some `op` flag, which will identify what operation the smart contract should perform.

In this tutorial, we will make a smart contract that performs different actions depending on the `op`.

## Smart contract

The smart contract will remember the address set by the manager and communicate it to anyone who requests it, in particular the following functionality**:
- when the contract receives a message from the Manager with `op` equal to 1
  followed by some `query_id` followed by `MsgAddress`, it should store the resulting address in storage.
- when a contract receives an internal message from any address with `op` equal to 2 followed by `query_id`, it must reply to the sender with a message with a body containing:
  - `op` is equal to 3
  - same `query_id`
  - Manager's address
  - The address that has been remembered since the last manager request (an empty address `addr_none` if there was no manager request yet)
  - The TON value attached to the message minus the processing fee.
- when the smart contract receives any other message, it must throw an exception.

** I decided to take ideas for smart contracts from the [FunC contest1](https://github.com/ton-blockchain/func-contest1) tasks, as they are very well suited for getting acquainted with the development of smart contracts for TON.

## Smart contract structure

##### External method

In order for our proxy to receive messages, we will use the external method `recv_internal()`

    () recv_internal()  {

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
	
##### Inside a method

Inside the method, we will take `op` , `query_id`, and the sender address `sender_address` from the function arguments, and then, using conditional operators, we will build logic around `op`.

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
	 ;; take op , query_id, and sender address sender_address

	  if (op == 1) {
		;; here we will save the address received from the manager
	  } else {
		if (op == 2) {
		  ;; sending a message
		} else {
		   ;; there will be an exception
		}
	  }
	}
	
## Secondary functions

Let's think about what functionality can be carried out in a function?

- comparison of addresses, so that when op is equal to 1, check that the request came from the Manager.
- unloading and loading the address of the manager and the address that we store in the contract in register c4.
- parse the sender's address from the incoming message.

##### Address comparison

FunC supports function definition in assembler (meaning Fift). This happens as follows - we define the function as a low-level TVM primitive. For the comparison function it would look like this:

int equal_slices (slice a, slice b) asm "SDEQ";

As you can see, the `asm` keyword is used

You can see the list of possible primitives from page 77 in [TVM](https://ton-blockchain.github.io/docs/tvm.pdf).

##### Unload addresses from register c4

We will store addresses in slices, but based on the task, we have to store two addresses, the Manager's address, for verification, and the address that the Manager will send for storage. Therefore, the slices will be returned in a tuple.

In order to "get" data from c4, we need two functions from the [FunC standard library](https://ton.org/docs/#/func/stdlib) .

Namely:
`get_data` - Gets a cell from the c4 register.
`begin_parse` - converts a cell into a slice

Let's pass this value to the ds variable:

`var ds = get_data().begin_parse()`

Load the address from the message with `load_msg_addr()` - which loads from the slice the only prefix that is a valid MsgAddress. We have two of them, so 'subtract' two times.

`return (ds~load_msg_addr(), ds~load_msg_addr());`

As a result, we get the following function:

	(slice, slice) load_data () inline {
	  var ds = get_data().begin_parse();
	  return (ds~load_msg_addr(), ds~load_msg_addr());
	}
	
#####Inline

In previous lessons, we have already used the `inline` specifier, which actually substitutes the code at each place where the function is called. In this lesson, we will consider why this is necessary from a practical point of view.

As we know from [documentation](https://ton.org/docs/#/smart-contracts/fees) the transaction fee consists of:

 - storage_fees - commission for a place in the blockchain.
 - in_fwd_fees - commission for importing messages (this is the case when we process `external` messages).
 - computation_fees - fees for executing TVM instructions.
 - action_fees - commission associated with processing the list of actions (for example, sending messages).
 - out_fwd_fees - fee for importing outgoing messages.
 
 More details [here](https://ton-blockchain.github.io/docs/tvm.pdf).
 The `inline` specifier itself saves **computation_fee**.
 
By default, when you have a funC function, it gets its own identifier stored in a separate id->function dictionary, and when you call it somewhere in the program, it looks up the function in the dictionary and then jumps to it.

The `inline` specifier puts the body of the function directly into the code of the parent function.

So if a function is only used once or twice, it's often much cheaper to declare the function `inline`, as going to a link is much cheaper than looking up and going through a dictionary.

##### Load addresses into register c4

Of course, in addition to unloading, you need a download. Let's make a function that saves the address of the manager and the address that the manager will send:

	() save_data (slice manager_address, slice memorized_address) impure inline {
		 
	}

Note that the function has [specifier](https://ton.org/docs/#/func/functions?id=specifiers) `impure`. And we must specify the `impure` specifier if the function can modify the contract store. Otherwise, the FunC compiler may remove this function call.

In order to "save" data from c4, we need functions from the [FunC standard library](https://ton.org/docs/#/func/stdlib) .

Namely:

`begin_cell()` - will create a Builder for the future cell
`store_slice()` - store Slice(slice) in Builder
`end_cell()` - create a Cell (cell)

`set_data()` - writes the cell to register c4

Assembling the cell:

	begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell()
Load it into c4:

	set_data(begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell());
As a result, we get the following function:

	() save_data (slice manager_address, slice memorized_address) impure inline {
		  set_data(begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell());
	}

##### Parse the sender's address from the incoming message

Let's declare a function with which we can get the sender's address from the message cell. The function will return a slice, since we will take the address itself using `load_msg_addr()` - which loads the only prefix from the slice that is a valid MsgAddress and returns it to the slice.

	slice parse_sender_address (cell in_msg_full) inline {
	
	  return sender_address;
	}

Now, using the `begin_parse` already familiar to us, we will convert the cell into a slice.

	slice parse_sender_address (cell in_msg_full) inline {
	  var cs = in_msg_full.begin_parse();

	  return sender_address;
	}

We start "reading out" the cell with `load_uint`, a function from the [FunC standard library](https://ton.org/docs/#/func/stdlib) that loads an unsigned n-bit integer from a slice.

In this lesson, we will not dwell on the flags in detail, but you can read more in paragraph [3.1.7](https://ton-blockchain.github.io/docs/tblkch.pdf).
And finally, we take the address.

As a result, we get the following function:

	slice parse_sender_address (cell in_msg_full) inline {
	  var cs = in_msg_full.begin_parse();
	  var flags = cs~load_uint(4);
	  slice sender_address = cs~load_msg_addr();
	  return sender_address;
	}

## Subtotal

At the moment we have ready auxiliary functions and the body of the main function of this smart contract `recv_internal()`.

	int equal_slices (slice a, slice b) asm "SDEQ";

	(slice, slice) load_data () inline {
	  var ds = get_data().begin_parse();
	  return (ds~load_msg_addr(), ds~load_msg_addr());
	}

	() save_data (slice manager_address, slice memorized_address) impure inline {
	  set_data(begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell());
	}

	slice parse_sender_address (cell in_msg_full) inline {
	  var cs = in_msg_full.begin_parse();
	  var flags = cs~load_uint(4);
	  slice sender_address = cs~load_msg_addr();
	  return sender_address;
	}

		() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
		 ;; возьмем  op , query_id, и адрес отправителя sender_address

		  if (op == 1) {
			;; здесь будем сохранять адрес полученный от менеджера
		  } else {
			if (op == 2) {
			  ;; отправка сообщения
			} else {
			   ;; здесь будет исключение
			}
		  }
		}
		
It remains only to fill `recv_internal()`.

##Filling the external method

##### Take op , query_id, and sender_address

Subtract op , query_id from the body of the message, respectively. According to [recommendations](https://ton.org/docs/#/howto/smart-contract-guidelines?id=smart-contract-guidelines) these are 32 and 64 bit values.

And also using the `parse_sender_address()` function, which we wrote above, we will take the sender address.	

		() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
		int op = in_msg_body~load_int(32);
		int query_id = in_msg_body~load_uint(64);
		var sender_address = parse_sender_address(in_msg_full);
		   
		  if (op == 1) {
			;; здесь будем сохранять адрес полученный от менеджера
		  } else {
			if (op == 2) {
			  ;; отправка сообщения
			} else {
			   ;; здесь будет исключение
			}
		  }
		}

##### Flag op == 1

In accordance with the task with flag 1, we must receive the manager's addresses and the saved address, check that the sender's address is equal to the manager's address (only the manager can change the address) and save the new address that is stored in the message body.

Load the manager address `manager_address` and the saved address `memorized_address)` from c4 using the `load_data()` function written earlier.

	(slice manager_address, slice memorized_address) = load_data();

Using the `equal_slices` function and the unary `~` operator, which is bitwise not, checks for address equality, throwing an exception if the addresses are not equal.

    (slice manager_address, slice memorized_address) = load_data();
    throw_if(1001, ~ equal_slices(manager_address, sender_address));


Take the address using the already familiar `load_msg_addr()` and save the addresses using the `save_data()` function written earlier

	(slice manager_address, slice memorized_address) = load_data();
    throw_if(1001, ~ equal_slices(manager_address, sender_address));
	slice new_memorized_address = in_msg_body~load_msg_addr();
    save_data(manager_address, new_memorized_address);
	
##### Flag op == 2

In accordance with the task with flag 2, we must send a message with a body containing:
  - `op` is equal to 3
  - same `query_id`
  - Manager's address
  - The address that has been remembered since the last manager request (an empty address `addr_none` if there was no manager request yet)
  - The TON value attached to the message minus the processing fee.
  
 Before sending a message, let's load the addresses stored in the contract.
 
(slice manager_address, slice memorized_address) = load_data();
 
 The full message structure can be found [here - message layout](https://ton.org/docs/#/smart-contracts/messages?id=message-layout). But usually we don't need to control each field, so we can use the short form from [example](https://ton.org/docs/#/smart-contracts/messages?id=sending-messages):
 
		 var msg = begin_cell()
			.store_uint(0x18, 6)
			.store_slice(addr)
			.store_coins(amount)
			.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			.store_slice(message_body)
		  .end_cell();

A complete analysis of messages in TON is in the [third lesson](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/3lesson/thirdlesson.md).

Sending a message in accordance with the conditions:

	(slice manager_address, slice memorized_address) = load_data();
      var msg = begin_cell()
              .store_uint(0x10, 6)
              .store_slice(sender_address)
              .store_grams(0)
              .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
              .store_uint(3, 32)
              .store_uint(query_id, 64)
              .store_slice(manager_address)
              .store_slice(memorized_address)
            .end_cell();
      send_raw_message(msg, 64);
	  
##### Exception

Here everyone just uses the usual `throw` from the [Built-in FunC modules](https://ton.org/docs/#/func/builtins?id=throwing-exceptions).

throw(3);

##Full smart contract code

	int equal_slices (slice a, slice b) asm "SDEQ";

	(slice, slice) load_data () inline {
	  var ds = get_data().begin_parse();
	  return (ds~load_msg_addr(), ds~load_msg_addr());
	}

	() save_data (slice manager_address, slice memorized_address) impure inline {
	  set_data(begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell());
	}

	slice parse_sender_address (cell in_msg_full) inline {
	  var cs = in_msg_full.begin_parse();
	  var flags = cs~load_uint(4);
	  slice sender_address = cs~load_msg_addr();
	  return sender_address;
	}

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
	  int op = in_msg_body~load_int(32);
	  int query_id = in_msg_body~load_uint(64);
	  var sender_address = parse_sender_address(in_msg_full);

	  if (op == 1) {
		(slice manager_address, slice memorized_address) = load_data();
		throw_if(1001, ~ equal_slices(manager_address, sender_address));
		slice new_memorized_address = in_msg_body~load_msg_addr();
		save_data(manager_address, new_memorized_address);
	  } else {
		if (op == 2) {
		  (slice manager_address, slice memorized_address) = load_data();
		  var msg = begin_cell()
				  .store_uint(0x10, 6)
				  .store_slice(sender_address)
				  .store_grams(0)
				  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				  .store_uint(3, 32)
				  .store_uint(query_id, 64)
				  .store_slice(manager_address)
				  .store_slice(memorized_address)
				.end_cell();
		  send_raw_message(msg, 64);
		} else {
		  throw(3); 
		}
	  }
	}
	
## Conclusion

Tests, we will write in the next lesson. Plus, I wanted to say a special thank you to those who donate TON to support the project, it is very motivating and helps to release lessons faster.
# Lesson 3 Proxy smart contract
## Introduction

In this tutorial, we will write a proxy (sends all messages to its owner) smart contract in the test network The Open Network in the FunC language, deploy it to the test network using [toncli](https://github.com/disintar/toncli), and we will test it in the next lesson.

## Requirements

To complete this tutorial, you need to install the [toncli](https://github.com/disintar/toncli/blob/master/INSTALLATION.md) command line interface .

And also be able to create/deploy a project using toncli, you can learn how to do it in the [first lesson](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/1lesson/firstlesson.md).

## Smart contract

The smart contract that we will create should have the following functionality**:
- Forwarding all messages coming into the contract to the owner;
- When forwarding, the sender's address must go first, and then the body of the message
- The value of the Toncoin attached to the message must be equal to the value of the incoming message minus processing fees (computation and message forwarding fees)
- The owner's address is stored in the smart contract storage
- When sending a message to the contract from the owner, the forwarding should not be carried out

** I decided to take ideas for smart contracts from the [FunC contest1](https://github.com/ton-blockchain/func-contest1) tasks, as they are very well suited for getting acquainted with the development of smart contracts for TON.

## External method

In order for our proxy to receive messages, we will use the external method `recv_internal()`

    () recv_internal() {

    }

##### External method arguments
Here a logical question arises - how to understand what arguments a function should have so that it can receive messages on the TON network?

According to the documentation of the [TON virtual machine - TVM](https://ton-blockchain.github.io/docs/tvm.pdf), when an event occurs on an account in one of the TON chains, it triggers a transaction.

Each transaction consists of up to 5 phases(stages). Read more [here](https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_overview?id=transactions-and-phases).

We are interested in **Compute phase**. And to be more specific, what is "on the stack" during initialization. For normal message-triggered transactions, the initial state of the stack looks like this:

5 elements:
- Smart contract balance (in nanoTons)
- Incoming message balance (in nanotones)
- Cell with incoming message
- Incoming message body, slice type
- Function selector (for recv_internal it is 0)

As a result, we get the following code:

    () recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body) {

    }
	
## Sender's address

In accordance with the task, we need to take the address of the sender. We will take the address from the cell with the incoming message `in_msg_full`. Let's move the code to a separate function.

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
	  slice sender_address = parse_sender_address(in_msg_full);
	}
	
##### Writing a function

Let's write the code of the parse_sender_address function, which takes the sender's address from the message cell and parse it:

	slice parse_sender_address (cell in_msg_full) inline {
	  var cs = in_msg_full.begin_parse();
	  var flags = cs~load_uint(4);
	  slice sender_address = cs~load_msg_addr();
	  return sender_address;
	}

As you can see the function has an `inline` specifier, its code is actually substituted at every place where the function is called.

In order for us to take the address, we need to convert the cell into a slice using `begin_parse`:

	var cs = in_msg_full.begin_parse();

Now we need to "subtract" the resulting slice to the address. Using the `load_uint` function from the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib) it loads an unsigned n-bit integer from the slice, "subtract" the flags.

	var flags = cs~load_uint(4);

In this lesson, we will not dwell on the flags in detail, but you can read more in paragraph [3.1.7](https://ton-blockchain.github.io/docs/tblkch.pdf).

And finally, the address. Use `load_msg_addr()` - which loads from the slice the only prefix that is a valid MsgAddress.

	slice sender_address = cs~load_msg_addr();
	return sender_address;

## Address of the recipient

We will take the address from [c4](https://ton-blockchain.github.io/docs/tvm.pdf) which we have already talked about in previous lessons.

We will use:
`get_data` - Gets a cell from the c4 register.
`begin_parse` - converts a cell into a slice.
`load_msg_addr()` - which loads from the slice the only prefix that is a valid MsgAddress.

As a result, we get the following function:

	slice load_data () inline {
	  var ds = get_data().begin_parse();
	  return ds~load_msg_addr();
	}


It remains only to call it:

	slice load_data () inline {
	  var ds = get_data().begin_parse();
	  return ds~load_msg_addr();
	}

	slice parse_sender_address (cell in_msg_full) inline {
	  var cs = in_msg_full.begin_parse();
	  var flags = cs~load_uint(4);
	  slice sender_address = cs~load_msg_addr();
	  return sender_address;
	}

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
	  slice sender_address = parse_sender_address(in_msg_full);
	  slice owner_address = load_data();
	}
	
## Check the address equality condition

By the condition of the task, the proxy should not forward the message if the contract owner accesses the smart contract of the proxy. Therefore, it is necessary to compare two addresses.

##### Compare Function

FunC support function definition in assembler (meaning Fift). This happens as follows - we define the function as a low-level TVM primitive. For the comparison function it would look like this:

	int equal_slices (slice a, slice b) asm "SDEQ";

As you can see, the `asm` keyword is used

You can see the list of possible primitives from page 77 in [TVM](https://ton-blockchain.github.io/docs/tvm.pdf).

##### Unary operator

So we will use our `equal_slices` function in `if`:

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
	  slice sender_address = parse_sender_address(in_msg_full);
	  slice owner_address = load_data();

	  if  equal_slices(sender_address, owner_address) {

	   }
	}
	
But the function will check exactly the equality, how to check the inequality? The unary operator `~`, which is bitwise not, can help here. Now our code looks like this:

	int equal_slices (slice a, slice b) asm "SDEQ";

	slice load_data () inline {
	  var ds = get_data().begin_parse();
	  return ds~load_msg_addr();
	}

	slice parse_sender_address (cell in_msg_full) inline {
	  var cs = in_msg_full.begin_parse();
	  var flags = cs~load_uint(4);
	  slice sender_address = cs~load_msg_addr();
	  return sender_address;
	}

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
	  slice sender_address = parse_sender_address(in_msg_full);
	  slice owner_address = load_data();

	  if ~ equal_slices(sender_address, owner_address) {

	   }
	}
	
It remains to send a message.

## Send message
So it remains for us to fill the body of the conditional operator in accordance with the task, namely, to send an incoming message.

##### Message structure

The full message structure can be found [here - message layout](https://ton-blockchain.github.io/docs/#/smart-contracts/messages?id=message-layout). But usually we don't need to control each field, so we can use the short form from [example](https://ton-blockchain.github.io/docs/#/smart-contracts/messages?id=sending-messages):


	 var msg = begin_cell()
		.store_uint(0x18, 6)
		.store_slice(addr)
		.store_coins(amount)
		.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
		.store_slice(message_body)
	  .end_cell();


As you can see, functions from the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib) are used to construct the message. Namely, the "wrapper" functions of the Builder primitives (partially built cells, as you may remember from the first lesson). Consider:

 `begin_cell()` - will create a Builder for the future cell
 `end_cell()` - will create a Cell (cell)
 `store_uint` - store uint in Builder
 `store_slice` - store the slice in the Builder
 `store_coins` - here the documentation means `store_grams` - used to store TonCoins. More details [here](https://ton-blockchain.github.io/docs/#/func/stdlib?id=store_grams).
  
 And also additionally consider `store_ref`, which will be needed to send the address.
 
 `store_ref` - Stores a cell reference in the Builder
 Now that we have all the necessary information, let's assemble the message.
 
 ##### The final touch - the body of the incoming message

To send in a message the message body that came in `recv_internal`. we will collect the cell, and in the message itself we will make a link to it using `store_ref`.

	  if ~ equal_slices(sender_address, owner_address) {
		cell msg_body_cell = begin_cell().store_slice(in_msg_body).end_cell();
	   }

##### Collecting the message

In accordance with the condition of the problem, we must send the address and body of the message. So let's change `.store_slice(message_body)` to `.store_slice(sender_address)` and `.store_ref(msg_body_cell)` in the msg variable. We get:

	  if ~ equal_slices(sender_address, owner_address) {
		cell msg_body_cell = begin_cell().store_slice(in_msg_body).end_cell();

		var msg = begin_cell()
			  .store_uint(0x10, 6)
			  .store_slice(owner_address)
			  .store_grams(0)
			  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			  .store_slice(sender_address)
			  .store_ref(msg_body_cell)
			  .end_cell();
	   }

It remains only to send our message.

##### Message sending mode

To send messages, use `send_raw_message` from the [standard library](https://ton-blockchain.github.io/docs/#/func/stdlib?id=send_raw_message).

We have already collected the msg variable, it remains to figure out `mode`. Each mode is described in [documentation](https://ton-blockchain.github.io/docs/#/func/stdlib?id=send_raw_message). Let's look at an example to make it clearer.

Let there be 100 coins on the balance of the smart contract and we receive an internal message with 60 coins and send a message with 10, the total fee is 3.

 `mode = 0` - balance (100+60-10 = 150 coins), send(10-3 = 7 coins)
 `mode = 1` - balance (100+60-10-3 = 147 coins), send(10 coins)
 `mode = 64` - balance (100-10 = 90 coins), send (60+10-3 = 67 coins)
 `mode = 65` - balance (100-10-3=87 coins), send (60+10 = 70 coins)
 `mode = 128` -balance (0 coins), send (100+60-3 = 157 coins)
 
 Modes 1 and 65 described above are mode' = mode + 1.
 
Since, according to the task, the value of Toncoin attached to the message must be equal to the value of the incoming message, minus the fees associated with processing. `mode = 64` with `.store_grams(0)` will do for us. The example will result in the following:

Let there be 100 coins on the balance of the smart contract and we receive an internal message with 60 coins and send a message with 0 (because `.store_grams(0)`) , the total fee is 3.

 `mode = 64` - balance (100 = 100 coins), send (60-3 = 57 coins)
 
 So our conditional statement will look like this:

 
	   if ~ equal_slices(sender_address, owner_address) {
		cell msg_body_cell = begin_cell().store_slice(in_msg_body).end_cell();

		var msg = begin_cell()
			  .store_uint(0x10, 6)
			  .store_slice(owner_address)
			  .store_grams(0)
			  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			  .store_slice(sender_address)
			  .store_ref(msg_body_cell)
			  .end_cell();
		 send_raw_message(msg, 64);
	   }

And the full code of the smart contract:

	int equal_slices (slice a, slice b) asm "SDEQ";

	slice load_data () inline {
	  var ds = get_data().begin_parse();
	  return ds~load_msg_addr();
	}

	slice parse_sender_address (cell in_msg_full) inline {
	  var cs = in_msg_full.begin_parse();
	  var flags = cs~load_uint(4);
	  slice sender_address = cs~load_msg_addr();
	  return sender_address;
	}

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
	  slice sender_address = parse_sender_address(in_msg_full);
	  slice owner_address = load_data();

	  if ~ equal_slices(sender_address, owner_address) {
		cell msg_body_cell = begin_cell().store_slice(in_msg_body).end_cell();

		var msg = begin_cell()
			  .store_uint(0x10, 6)
			  .store_slice(owner_address)
			  .store_grams(0)
			  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			  .store_slice(sender_address)
			  .store_ref(msg_body_cell)
			  .end_cell();
		 send_raw_message(msg, 64);
	   }
	}
	
## Conclusion

Since the messages and our proxy function are `internal`, then it will not work to "pull" the contract through `toncli` - it works with messages inside the TON. How then to develop such contracts correctly - answer from [tests](https://en.wikipedia.org/wiki/Test-driven_development). Which we will write in the next lesson.
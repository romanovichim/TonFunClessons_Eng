# Lesson 4 FunC tests for smart contract proxy
## Introduction

In this tutorial, we will write tests for the smart contract created in the third lesson on The Open Network testnet in FUNC language and execute them using [toncli](https://github.com/disintar/toncli).

## Requirements

To complete this tutorial, you need to install the [toncli](https://github.com/disintar/toncli/blob/master/INSTALLATION.md) command line interface and complete the [third lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/3lesson/thirdlesson.md) .

## Important

Written below describes the old version of the tests. New toncli tests, currently available for dev version of func/fift, instruction [here](https://github.com/disintar/toncli/blob/master/docs/advanced/func_tests_new.md), lesson on new tests [ here](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/11lesson/11lesson.md). The release of new tests does not mean that the lessons on the old ones are meaningless - they convey the logic well, so success in passing the lesson. Also note that old tests can be used with the `--old` flag when using `toncli run_tests`

## Tests for smart contract proxy

For our proxy smart contract, we will write the following tests:

- test_same_addr() tests that when sending a message to the contract from the owner, the forwarding should not be carried out
- test_example_data() tests the remaining conditions [of the third lesson](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/3lesson/thirdlesson.md)

## FunC test structure under toncli

Let me remind you that for each FunC test under toncli, you need to write two functions. The first one will determine the data (in terms of TON it would be more correct to say the state, but I hope that the data is a more understandable analogy), which we will send to the second for testing.

Each test function must specify a method_id. Method_id test functions should be started from 0.

##### Data function

The data function takes no arguments, but must return:
- function selector - id of the called function in the tested contract;
- tuple - (stack) values ​​that we will pass to the function that performs tests;
- c4 cell - "permanent data" in the control register c4;
- c7 tuple - "temporary data" in the control register c7;
- gas limit integer - gas limit (to understand the concept of gas, I advise you to first read about it in [Ethereum](https://ethereum.org/en/developers/docs/gas/));

> In simple words, gas measures the amount of computational effort required to perform certain operations on the network. And you can read in detail [here](https://ton-blockchain.github.io/docs/#/smart-contracts/fees). Well, in full detail [here in Appendix A](https://ton-blockchain.github.io/docs/tvm.pdf).

> Stack - a list of elements organized according to the LIFO principle (English last in - first out, "last in - first out"). The stack is well written in [wikipedia](https://ru.wikipedia.org/wiki/%D0%A1%D1%82%D0%B5%D0%BA).

More about registers c4 and c7 [here](https://ton-blockchain.github.io/docs/tvm.pdf) in 1.3.1

##### Test function

The test function must take the following arguments:

- exit code - return code of the virtual machine, so we can understand the error or not
- c4 cell - "permanent data" in control register c4
- tuple - (stack) values ​​that we pass from the data function
- c5 cell - to check outgoing messages
- gas - the gas that was used

[TVM return codes](https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_exit_codes)

## Let's start writing tests

For the tests in this tutorial, we will need a comparison helper function. Let's define it as a low-level primitive using the `asm` keyword:

`int equal_slices (slice a, slice b) asm "SDEQ";`


## Test the contract proxy call

Let's write the first test `test_example_data()` and analyze its code.

##### Data function

Let's start with the data function:

Начнем с функции данных:

	[int, tuple, cell, tuple, int] test_example_data() method_id(0) {
		int function_selector = 0;

		cell my_address = begin_cell()
					.store_uint(1, 2)
					.store_uint(5, 9) 
					.store_uint(7, 5)
					.end_cell();

		cell their_address = begin_cell()
					.store_uint(1, 2)
					.store_uint(5, 9) 
					.store_uint(8, 5) 
					.end_cell();

		slice message_body = begin_cell().store_uint(12345, 32).end_cell().begin_parse();

		cell message = begin_cell()
				.store_uint(0x6, 4)
				.store_slice(their_address.begin_parse()) 
				.store_slice(their_address.begin_parse()) 
				.store_grams(100)
				.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				.store_slice(message_body)
				.end_cell();

		tuple stack = unsafe_tuple([12345, 100, message, message_body]);

		return [function_selector, stack, my_address, get_c7(), null()];
	}

## Let's analyze

`int function_selector = 0;`

Since we are calling `recv_internal()` we are assigning the value 0, why 0? Fift (namely, in it we compile our FunC scripts) has predefined identifiers, namely:
- `main` and `recv_internal` have id = 0
- `recv_external` have id = -1
- `run_ticktock` have id = -2

To check sending we need addresses from which we will send messages, let in this example we will have our address `my_address` and their address `their_address`. The question arises of how the address should look, given that it needs to be assigned with FunC types. Let's turn to the [TL-B schema](https://github.com/ton-blockchain/ton/blob/master/crypto/block/block.tlb) , and specifically to line 100, where address descriptions begin.

	cell my_address = begin_cell()
				.store_uint(1, 2)
				.store_uint(5, 9) 
				.store_uint(7, 5)
				.end_cell();

`.store_uint(1, 2)` - 0x01 external address;

`.store_uint(5, 9)` - len equal to 5;

`.store_uint(7, 5)` - and let our address be 7;

In order to understand TL-B and this piece specifically, I advise you to study https://core.telegram.org/mtproto/TL .

We will also collect one more address, let it be 8.

	cell their_address = begin_cell()
				.store_uint(1, 2)
				.store_uint(5, 9) 
				.store_uint(8, 5) 
				.end_cell();

To assemble the message, it remains to assemble the slice of the message body, put the number 12345 there

slice message_body = begin_cell().store_uint(12345, 32).end_cell().begin_parse();

Now it remains to collect the message itself:

	cell message = begin_cell()
			.store_uint(0x6, 4)
			.store_slice(their_address.begin_parse()) 
			.store_slice(their_address.begin_parse()) 
			.store_grams(100)
			.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			.store_slice(message_body)
			.end_cell();

I note that we collected addresses in cells, so to store them in a message using `store_slice()`, you need to use `begin_parse()`, which will turn the cell into a slice.

As you may have noticed, both the sender and the recipient are the same address, this was done to simplify the tests and not produce a large number of addresses, since by condition, when sending a message to the contract from **only** the owner, forwarding should not be carried out.

Now let me remind you what the function should return:
- function selector - id of the called function in the tested contract;
- tuple - (stack) values ​​that we will pass to the function that performs tests;
- c4 cell - "permanent data" in the control register c4;
- c7 tuple - "temporary data" in the control register c7;
- gas limit integer

As you may have noticed, we only need to collect the tuple and return the data. In accordance with the signature (syntactic construction of the function declaration) recv_internal() of our contract, we put the following values ​​there:

	tuple stack = unsafe_tuple([12345, 100, message, message_body]);

I note that we will already return `my_address`, this is necessary to check the condition for matching addresses.

	return [function_selector, stack, my_address, get_c7(), null()];

As you can see, in c7 we put the current state of c7 using `get_c7()` , and in gas limit integer we put `null()`.

##### Test function

The code:

	_ test_example(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(1) {
		throw_if(100, exit_code != 0);

		slice actions = actions.begin_parse();
		throw_if(101, actions~load_uint(32) != 0x0ec3c86d); 


		throw_if(102, ~ slice_empty?(actions~load_ref().begin_parse())); 

		slice msg = actions~load_ref().begin_parse();
		throw_if(103, msg~load_uint(6) != 0x10);

		slice send_to_address = msg~load_msg_addr();
		slice expected_my_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(7, 5).end_cell().begin_parse();

		throw_if(104, ~ equal_slices(expected_my_address, send_to_address));
		throw_if(105, msg~load_grams() != 0);
		throw_if(106, msg~load_uint(1 + 4 + 4 + 64 + 32 + 1 + 1) != 0);

		slice sender_address = msg~load_msg_addr();
		slice expected_sender_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(8, 5).end_cell().begin_parse();
		throw_if(107, ~ equal_slices(sender_address, expected_sender_address));

		slice fwd_msg = msg~load_ref().begin_parse();

		throw_if(108, fwd_msg~load_uint(32) != 12345);
		fwd_msg.end_parse();

		msg.end_parse();
	}

## Let's analyze

`throw_if(100, exit_code != 0);`

Check the return code, the function will throw an exception if the return code is non-zero.
0 - standard return code from the successful execution of a smart contract.

slice actions = actions.begin_parse();
throw_if(101, actions~load_uint(32) != 0x0ec3c86d);

Outgoing messages are written to the c5 register, so we unload a 32-bit value from there (`load_uint` is a function from the standard FunC library, it loads an unsigned n-bit integer from a slice.) and give an error if it is not equal to 0x0ec3c86d i.e. it was not sending a message. The number 0x0ec3c86d can be taken from [TL-B schema line 371](https://github.com/ton-blockchain/ton/blob/d01bcee5d429237340c7a72c4b0ad55ada01fcc3/crypto/block/block.tlb) and to make sure that `send_raw_message` uses ` action_send_msg` let's see the standard library [line 764](https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/vm/tonops.cpp) .

![github tone](./img/send_action.PNG)

Before moving on, we need to understand how data is stored in c5 from [documentation](https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_overview?id=result-of-tvm-execution). C5 stores two cell references with the last action in the list and a cell reference with the previous action, respectively.
More details on how to get data from actions completely will be described in the code below in the task. Now the main thing is that we will unload the first link from c5 and immediately check that it is not empty so that we can then take the cell with the message.

	throw_if(102, ~ slice_empty?(actions~load_ref().begin_parse()));

We check with `slice_empty?` from the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib?id=slice_empty).

We need to take a slice of messages from the "actions" cell, take a reference to the cell with the message using `load_ref()` and convert it to a slice using `begin_parse()`.

	slice msg = actions~load_ref().begin_parse();

Let's continue:

	slice send_to_address = msg~load_msg_addr();
	slice expected_my_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(7, 5).end_cell().begin_parse();
	throw_if(104, ~ equal_slices(expected_my_address, send_to_address));

Let's start reading the message. Check the recipient's address by loading the address from the message with `load_msg_addr()` - which loads the only prefix from the slice that is a valid MsgAddress.

In the slice `expected_my_address` we put the same address that we collected in the function that determines the data.

And, accordingly, we will check their non-match using the previously declared `equal_slices()` . Since the function will check for equality to check for inequality, we use the unary operator ` ~` , which is bitwise not. Bit operations are well described on [wikipedia](https://en.wikipedia.org/wiki/Bitwise_operation).

    throw_if(105, msg~load_grams() != 0);
    throw_if(106, msg~load_uint(1 + 4 + 4 + 64 + 32 + 1 + 1) != 0);

Using `load_grams()` and `load_uint()` from the [standard library](https://ton-blockchain.github.io/docs/#/func/stdlib?id=load_grams) check if the number of Ton in the message is not equal to 0 and other service fields that can be viewed in the [message schema](https://ton-blockchain.github.io/docs/#/smart-contracts/messages) by reading them from the message.

	slice sender_address = msg~load_msg_addr();
	slice expected_sender_address = begin_cell().store_uint(1, 2).store_uint(5,9).store_uint(8, 5).end_cell().begin_parse();
	throw_if(107, ~ equal_slices(sender_address, expected_sender_address));

Continuing to read messages, we check the sender's address, just as we previously checked the recipient's address.

	slice fwd_msg = msg~load_ref().begin_parse();
	throw_if(108, fwd_msg~load_uint(32) != 12345);

It remains to check the value in the body of the message. First, let's load the cell reference from the message with `load_ref()` and convert it to a slice `begin_parse()`. And load a 32-bit value accordingly (`load_uint` is a function from the standard FunC library; it loads an unsigned n-bit integer from a slice.) by checking it against our value of 12345.


	fwd_msg.end_parse();

	msg.end_parse();

At the very end, we check after reading whether the slice is empty, both of the entire message and the message body from which we took the value. It's important to note that `end_parse()` throws an exception if the slice is not empty, which is very handy in tests.

## Testing the same address

According to the task from [the third lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/3lesson/thirdlesson.md), when sending a message to the contract from the owner, the forwarding should not be carried out, let's test it.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] test_same_addr_data() method_id(2) {
		int function_selector = 0;

		cell my_address = begin_cell()
								.store_uint(1, 2) 
								.store_uint(5, 9)
								.store_uint(7, 5)
								.end_cell();

		slice message_body = begin_cell().store_uint(12345, 32).end_cell().begin_parse();

		cell message = begin_cell()
				.store_uint(0x6, 4)
				.store_slice(my_address.begin_parse()) 
				.store_slice(my_address.begin_parse())
				.store_grams(100)
				.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				.store_slice(message_body)
				.end_cell();

		tuple stack = unsafe_tuple([12345, 100, message, message_body]);

		return [function_selector, stack, my_address, get_c7(), null()];
	}
	
## Let's analyze

The data function practically does not differ from the previous data function, the only difference is that there is only one address, since we are testing what will happen if we send a message to the smart contract proxy from our address. Again, we will send to ourselves, to save our time writing a test.

##### Test function

The code:

	_ test_same_addr(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(3) {
		throw_if(100, exit_code != 0);

		throw_if(102, ~ slice_empty?(actions.begin_parse())); 

	}

Again, we check the return code, the function will throw an exception if the return code is not zero.

`throw_if(100, exit_code != 0);`

0 - standard return code from the successful execution of a smart contract.

`throw_if(102, ~ slice_empty?(actions.begin_parse()));`

Since the proxy contract should not send a message, we simply check that the slice is empty using `slice_empty?`, more about the function [here](https://ton-blockchain.github.io/docs/#/func/stdlib?id=slice_empty ) .

## Exercise

As you can see, we haven't tested the mode in which we send a message using `send_raw_message;`.

##### Clue

An example of a "message parsing" function:

	(int, cell) extract_single_message(cell actions) impure inline method_id {
		;; ---------------- Parse actions list
		;; prev:^(OutList n)
		;; #0ec3c86d
		;; mode:(## 8)
		;; out_msg:^(MessageRelaxed Any)
		;; = OutList (n + 1);
		slice cs = actions.begin_parse();
		throw_unless(1010, cs.slice_refs() == 2);
		
		cell prev_actions = cs~load_ref();
		throw_unless(1011, prev_actions.cell_empty?());
		
		int action_type = cs~load_uint(32);
		throw_unless(1013, action_type == 0x0ec3c86d);
		
		int msg_mode = cs~load_uint(8);
		throw_unless(1015, msg_mode == 64); 
		
		cell msg = cs~load_ref();
		throw_unless(1017, cs.slice_empty?());
		
		return (msg_mode, msg);
	}
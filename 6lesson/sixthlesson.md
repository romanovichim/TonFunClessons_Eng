# Lesson 6 FunC tests for smart contract with op and query_id
## Introduction

In this tutorial, we will write tests for the smart contract created in the fifth lesson on The Open Network testnet in FUNC language and execute them using [toncli](https://github.com/disintar/toncli).

## Requirements

To complete this tutorial, you need to install the [toncli] command line interface(https://github.com/disintar/toncli/blob/master/INSTALLATION.md) and complete [lesson 5](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/5lesson/fifthlesson.md) .

## Task of the fifth lesson

For convenience, I recall here what we did in the fifth lesson. The smart contract will remember the address set by the manager and communicate it to anyone who requests it, in particular the following functionality**:
- when the contract receives a message from the Manager with `op` equal to 1
  followed by some `query_id` followed by `MsgAddress`, it should store the resulting address in storage.
- when a contract receives an internal message from any address with `op` equal to 2 followed by `query_id`, it must reply to the sender with a message with a body containing:
  - `op` is equal to 3
  - same `query_id`
  - Manager's address
  - The address that has been remembered since the last manager request (an empty address `addr_none` if there was no manager request yet)
  - The TON value attached to the message minus the processing fee.
- when the smart contract receives any other message, it must throw an exception.

## Tests for smart contract with op and query_id

For our proxy smart contract, we will write the following tests:

- test_example() saving addresses with op = 1
- only_manager_can_change() test that if op = 1, only the manager can change the address in the smart contract
- query() contract work when op = 2
- query_op3() check the exception

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

> Gas measures the amount of computational effort required to perform certain operations on the network

More about registers c4 and c7 [here] (https://ton-blockchain.github.io/docs/tvm.pdf) in 1.3.1

##### Test function

The test function must take the following arguments:

- exit code - return code of the virtual machine, so we can understand the error or not
- c4 cell - "permanent data" in control register c4
- tuple - (stack) values ​​that we pass from the data function
- c5 cell - to check outgoing messages
- gas - the gas that was used

[TVM return codes](https://ton.org/docs/#/smart-contracts/tvm_exit_codes)

## Test saving addresses with op = 1

Let's write the first test `test_example()` and analyze its code. The test will check if the contract stores the address of the manager and the address that the manager passes to the contract.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] test_example_data() method_id(0) {

		int function_selector = 0;

		cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
		cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

		slice message_body = begin_cell().store_uint(1, 32).store_uint(12345, 64).store_slice(stored_address.begin_parse()).end_cell().begin_parse();

		cell message = begin_cell()
				.store_uint(0x6, 4)
				.store_slice(manager_address.begin_parse())
				.store_uint(0, 2) ;; should be contract address
				.store_grams(100)
				.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				.store_slice(message_body)
				.end_cell();

		tuple stack = unsafe_tuple([12345, 100, message, message_body]);

		cell data = begin_cell().store_slice(manager_address.begin_parse()).store_uint(0, 2).end_cell();

		return [function_selector, stack, data, get_c7(), null()];
	}

## Let's analyze

And so in the first test, we want to check the operation of the smart contract with `op` equal to 1.
Accordingly, we will send a message with `op` equal to 1 from the contract manager and store some address in it. To do this, in the data function we need:

- manager address `manager_address`
- address to store in contract `stored_address`
- message body with `op` equal to 1
- the message itself, respectively `message`
- manager address in c4 to check `data`

Let's start parsing:

`int function_selector = 0;`

Since we are calling `recv_internal()` we are assigning the value 0, why 0? Fift (namely, in it we compile our FunC scripts) has predefined identifiers, namely:
- `main` and `recv_internal` have id = 0
- `recv_external` have id = -1
- `run_ticktock` have id = -2

Let's collect the two necessary addresses, let it be 1 and 3:

		cell manager_address = begin_cell().
			store_uint(1, 2).
			store_uint(5, 9).
			store_uint(1, 5).
			end_cell();
			
		cell stored_address = begin_cell().
			store_uint(1, 2)
			.store_uint(5, 9)
			.store_uint(3, 5)
			.end_cell();

We collect addresses in accordance with the [TL-B scheme] (https://github.com/tonblockchain/ton/blob/master/crypto/block/block.tlb) , and specifically to line 100, where address descriptions begin. For example `manager_address`:

`.store_uint(1, 2)` - 0x01 external address;

`.store_uint(5, 9)` - len equal to 5;

`.store_uint(1, 5)` - address will be 1;

Now let's assemble the message body slice, it will contain:
- 32-bit op `store_uint(1, 32)`
- 64-bit query_id `store_uint(12345, 64)`
- storage address `store_slice(stored_address.begin_parse())`

Since we store a slice in the body, and we set the address with a cell, we will use
`begin_parse()` ( converts the cell to a slice ).

To assemble the message body, we will use:

`begin_cell()` - will create a Builder for the future cell
`end_cell()` - create a Cell (cell)

It looks like this:

	slice message_body = begin_cell().store_uint(1, 32).store_uint(12345, 64).store_slice(stored_address.begin_parse()).end_cell().begin_parse();

Now it remains to collect the message itself, but how to send a message to the address of the smart contract. To do this, we will use `addr_none`, since, in accordance with the [SENDRAWMSG documentation](https://ton.org/docs/#/func/stdlib?id=send_raw_message), the current address of the smart contract will be automatically substituted for it. We get:

    cell message = begin_cell()
            .store_uint(0x6, 4)
            .store_slice(sender_address.begin_parse()) 
            .store_uint(0, 2) 
            .store_grams(100)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_slice(message_body)
            .end_cell();

Now let's collect the values that we will pass to the function that performs the tests, namely `int balance`, `int msg_value`, `cell in_msg_full`, `slice in_msg_body`:

	tuple stack = unsafe_tuple([12345, 100, message, message_body]);

We will also collect a cell for the register `c4`, put the address of the manager and `addr_none` there using the functions already familiar to us.

	cell data = begin_cell().store_slice(manager_address.begin_parse()).store_uint(0, 2).end_cell();

And of course return the required values.

	return [function_selector, stack, data, get_c7(), null()];

As you can see, in c7 we put the current state of c7 using `get_c7()` , and in gas limit integer we put `null()`.

##### Test function

The code:

	_ test_example(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(1) {
		throw_if(100, exit_code != 0);

		cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
		cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

		slice stored = data.begin_parse();
		throw_if(101, ~ equal_slices(stored~load_msg_addr(), manager_address.begin_parse()));
		throw_if(102, ~ equal_slices(stored~load_msg_addr(), stored_address.begin_parse()));
		stored.end_parse();
	}

## Parsing

`throw_if(100, exit_code != 0);`

We check the return code, the function will throw an exception if the return code is not zero.
0 - standard return code from the successful execution of a smart contract.

Next, we will collect two addresses, similar to what we collected in the data function, in order to compare them.

	cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
	cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();


Now let's get something to compare with, we have a `data` cell, respectively, using `begin_parse` - we will convert the cell into a slice.

	slice stored = data.begin_parse();

	stored.end_parse();

And at the end, we check after the subtraction whether the slice is empty. It's important to note that `end_parse()` throws an exception if the slice is not empty, which is handy for testing.

We will read addresses from `stored` using `load_msg_addr()`. We will compare addresses using the `equal_slices` function, which we will take from the previous lesson.

		slice stored = data.begin_parse();
		throw_if(101, ~ equal_slices(stored~load_msg_addr(), manager_address.begin_parse()));
		throw_if(102, ~ equal_slices(stored~load_msg_addr(), stored_address.begin_parse()));
		stored.end_parse();
		
## Testing that when op = 1, only the manager can change the address in the smart contract

Let's write the `only_manager_can_change()` test and analyze its code.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] only_manager_can_change_data() method_id(2) {
		int function_selector = 0;

		cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
		cell sender_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(2, 5).end_cell();
		cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

		slice message_body = begin_cell().store_uint(1, 32).store_uint(12345, 64).store_slice(stored_address.begin_parse()).end_cell().begin_parse();

		cell message = begin_cell()
				.store_uint(0x6, 4)
				.store_slice(sender_address.begin_parse()) 
				.store_uint(0, 2) 
				.store_grams(100)
				.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				.store_slice(message_body)
				.end_cell();

		tuple stack = unsafe_tuple([12345, 100, message, message_body]);

		cell data = begin_cell().store_slice(manager_address.begin_parse()).store_uint(0, 2).end_cell();

		return [function_selector, stack, data, get_c7(), null()];
	}

## Let's analyze

As you can see, the code is almost the same as `test_example()`. Besides that:
- added one more address `sender_address`
- in the message, the address of the manager `manager_address` has changed to the address of the sender `sender_address`

We will collect the sender's address, like all other addresses:

	cell sender_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(2, 5).end_cell();

And change the address of the manager `manager_address` in the messages to the sender address `sender_address`.

		cell message = begin_cell()
				.store_uint(0x6, 4)
				.store_slice(sender_address.begin_parse()) 
				.store_uint(0, 2) 
				.store_grams(100)
				.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				.store_slice(message_body)
				.end_cell();

##### Test function

The code:

	_ only_manager_can_change(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(3) {
		throw_if(100, exit_code == 0); 

		cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
		cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

		slice stored = data.begin_parse();
		throw_if(101, ~ equal_slices(stored~load_msg_addr(), manager_address.begin_parse()));
		throw_if(102, stored~load_uint(2) != 0);
		stored.end_parse();
	}

## Let's analyze

Again, we check the return code, the function will throw an exception if the return code is not zero.

`throw_if(100, exit_code != 0);`

0 - standard return code from the successful execution of a smart contract.

We collect the manager addresses `manager_address;` and the stored address `stored_address`, the same as in the data function to check.

	cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
	cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

Now let's get something to compare with, we have a `data` cell, respectively, using `begin_parse` - we will convert the cell into a slice.

	slice stored = data.begin_parse();

	stored.end_parse();

And at the end, we check after the subtraction whether the slice is empty. It's important to note that `end_parse()` throws an exception if the slice is not empty, which is handy for testing.

We will read addresses from `stored` using `load_msg_addr()`. We will compare addresses using the `equal_slices` function, which we will take from the previous lesson.

	slice stored = data.begin_parse();
	throw_if(101, ~ equal_slices(stored~load_msg_addr(), manager_address.begin_parse()));

	stored.end_parse();

Additionally compare the stored address with `addr_none` using `~load_uint(2)`

`load_uint` - Loads an n-bit unsigned integer from a slice

We get:

    slice stored = data.begin_parse();
    throw_if(101, ~ equal_slices(stored~load_msg_addr(), manager_address.begin_parse()));
    throw_if(102, stored~load_uint(2) != 0);
    stored.end_parse();
	
## Testing the operation of the smart contract with op = 2

Let's write a `query()` test and analyze its code. With `op` = 2, we must send a message with a specific body.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] query_data() method_id(4) {
		int function_selector = 0;

		cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
		cell sender_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(2, 5).end_cell();
		cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

		slice message_body = begin_cell().store_uint(2, 32).store_uint(12345, 64).store_slice(stored_address.begin_parse()).end_cell().begin_parse();

		cell message = begin_cell()
				.store_uint(0x6, 4)
				.store_slice(sender_address.begin_parse()) 
				.store_uint(0, 2)
				.store_grams(100)
				.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				.store_slice(message_body)
				.end_cell();

		tuple stack = unsafe_tuple([12345, 100, message, message_body]);

		cell data = begin_cell().store_slice(manager_address.begin_parse()).store_slice(stored_address.begin_parse()).end_cell();

		return [function_selector, stack, data, get_c7(), null()];
	}

## Let's analyze

The data function is not much different from the previous ones in this lesson.

`int function_selector = 0;`

Checking the predefined function number `recv_internal`.

We collect three addresses:

- manager address `manager_address`
- sender address `sender_address`
- address to store in contract `stored_address`

		cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
		cell sender_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(2, 5).end_cell();
		cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

Now let's assemble the message body slice (IMPORTANT: now `op`=2), it will contain:
- 32-bit op `store_uint(2, 32)`
- 64-bit query_id `store_uint(12345, 64)`
- storage address `store_slice(stored_address.begin_parse())`

Since we store a slice in the body, and we set the address with a cell, we will use
`begin_parse()` ( converts the cell to a slice ).

To assemble the message body, we will use:

`begin_cell()` - will create a Builder for the future cell
`end_cell()` - create a Cell (cell)

It looks like this:

	slice message_body = begin_cell().store_uint(2, 32).store_uint(12345, 64).store_slice(stored_address.begin_parse()).end_cell().begin_parse();

It's time for a message:

		cell message = begin_cell()
				.store_uint(0x6, 4)
				.store_slice(sender_address.begin_parse()) 
				.store_uint(0, 2)
				.store_grams(100)
				.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				.store_slice(message_body)
				.end_cell();
				
The sender is `sender_address`, the recipient is the address of the contract, thanks to sending `addr_none`. The current smart contract address is automatically substituted instead.

Now let's collect the values ​​that we will pass to the function that performs the tests, namely `int balance`, `int msg_value`, `cell in_msg_full`, `slice in_msg_body`:

		tuple stack = unsafe_tuple([12345, 100, message, message_body]);


We will also collect a cell for the register `c4`, put the address of the manager and the address for storage there using the functions already familiar to us.

	cell data = begin_cell().store_slice(manager_address.begin_parse()).store_slice(stored_address.begin_parse()).end_cell();

And of course return the required values.

	return [function_selector, stack, data, get_c7(), null()];

As you can see, in c7 we put the current state of c7 using `get_c7()` , and in gas limit integer we put `null()`.

##### Test function

The code:

	_ query(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(5) {
		throw_if(100, exit_code != 0); 

		cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
		cell sender_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(2, 5).end_cell();
		cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

		slice stored = data.begin_parse();
		throw_if(101, ~ equal_slices(stored~load_msg_addr(), manager_address.begin_parse()));
		throw_if(102, ~ equal_slices(stored~load_msg_addr(), stored_address.begin_parse()));
		stored.end_parse();

		slice all_actions = actions.begin_parse();
		all_actions~load_ref();
		slice msg = all_actions~load_ref().begin_parse();

		throw_if(103, msg~load_uint(6) != 0x10);

		slice send_to_address = msg~load_msg_addr();

		throw_if(104, ~ equal_slices(sender_address.begin_parse(), send_to_address));
		throw_if(105, msg~load_grams() != 0);
		throw_if(106, msg~load_uint(1 + 4 + 4 + 64 + 32 + 1 + 1) != 0);

		throw_if(107, msg~load_uint(32) != 3);
		throw_if(108, msg~load_uint(64) != 12345);
		throw_if(109, ~ equal_slices(manager_address.begin_parse(), msg~load_msg_addr()));
		throw_if(110, ~ equal_slices(stored_address.begin_parse(), msg~load_msg_addr()));

		msg.end_parse();
	}

## Let's analyze

So the beginning is similar to what we have already parsed, three addresses (`manager_address`,`sender_address`,`stored_address)`) identical to those that we collected in the comparison data function and the comparison itself using `equal_slices()`.

	cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
	cell sender_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(2, 5).end_cell();
	cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

	slice stored = data.begin_parse();
	throw_if(101, ~ equal_slices(stored~load_msg_addr(), manager_address.begin_parse()));
	throw_if(102, ~ equal_slices(stored~load_msg_addr(), stored_address.begin_parse()));
	stored.end_parse();

Then we move on to the message. Outgoing messages are written to register c5. Let's get them from the `actions` cell to the `stored` slice.

	slice all_actions = actions.begin_parse();

Now let's remember how data is stored in c5 in accordance with [documentation] (https://ton.org/docs/#/smart-contracts/tvm_overview?id=result-of-tvm-execution).

A list of two cell references is stored there, two cell references with the last action in the list and a cell reference with the previous action, respectively. (At the end of the tutorial, there will be code that shows how to parse `actions` in full, I hope this helps)

Therefore, first we "unload" the first link and take the second one, where our message is:

	all_actions~load_ref();
	slice msg = all_actions~load_ref().begin_parse();

The cell is immediately loaded into the `msg` slice. Let's check the flags:

	throw_if(103, msg~load_uint(6) != 0x10);

After loading the sender's address from the message with `load_msg_addr()` - which loads the only prefix from the slice that is a valid MsgAddress - check if they are equal to the address we specified earlier. Don't forget to convert the cell to a slice.

	slice send_to_address = msg~load_msg_addr();

	throw_if(104, ~ equal_slices(sender_address.begin_parse(), send_to_address));

Using `load_grams()` and `load_uint()` from the [standard library](https://ton.org/docs/#/func/stdlib?id=load_grams) check if the number of Ton in the message is not equal to 0 and other service fields that can be viewed in the [message schema](https://ton.org/docs/#/smart-contracts/messages) by reading them from the message.

	throw_if(105, msg~load_grams() != 0);
    throw_if(106, msg~load_uint(1 + 4 + 4 + 64 + 32 + 1 + 1) != 0);

We start checking the body of the message, starting with `op` and `query_id`:

	throw_if(107, msg~load_uint(32) != 3);
	throw_if(108, msg~load_uint(64) != 12345);

Next, take their address message bodies and compare them using `equal_slices`. Since the function will check for equality to test for inequality, we use the unary operator ` ~` , which is not bitwise.

	throw_if(109, ~ equal_slices(manager_address.begin_parse(), msg~load_msg_addr()));
	throw_if(110, ~ equal_slices(stored_address.begin_parse(), msg~load_msg_addr()));

At the very end, after reading, we check whether the slice is empty, both of the entire message and the message body from which we took the value. It's important to note that `end_parse()` throws an exception if the slice is not empty, which is very handy in tests.

	msg.end_parse();
	
## Testing the operation of the smart contract in case of an exception

Let's write a `query_op3` test and analyze its code. By assignment - when the smart contract receives any other message, it should throw an exception.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] query_op3_data() method_id(6) {
		int function_selector = 0;

		cell manager_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(1, 5).end_cell();
		cell sender_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(2, 5).end_cell();
		cell stored_address = begin_cell().store_uint(1, 2).store_uint(5, 9).store_uint(3, 5).end_cell();

		slice message_body = begin_cell().store_uint(3, 32).store_uint(12345, 64).store_slice(stored_address.begin_parse()).end_cell().begin_parse();

		cell message = begin_cell()
				.store_uint(0x6, 4)
				.store_slice(sender_address.begin_parse()) 
				.store_uint(0, 2) 
				.store_grams(100)
				.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				.store_slice(message_body)
				.end_cell();

		tuple stack = unsafe_tuple([12345, 100, message, message_body]);

		cell data = begin_cell().store_slice(manager_address.begin_parse()).store_slice(stored_address.begin_parse()).end_cell();

		return [function_selector, stack, data, get_c7(), null()];
	}

## Let's analyze

This data function is almost completely equivalent to the one we wrote in the last paragraph, with the exception of one detail - this is the value of `op` in the body of the message so that we can check what happens if `op` is not equal to 2 or 1.

	slice message_body = begin_cell().store_uint(3, 32).store_uint(12345, 64).store_slice(stored_address.begin_parse()).end_cell().begin_parse();

##### Test function

The code:

	_ query_op3(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(7) {
		throw_if(100, exit_code == 0);
	}

## Let's analyze
We check that if the return code is 0, i.e. completed without errors, throw an exception.

	throw_if(100, exit_code == 0);

And that is all.

## Conclusion

I wanted to say a special thank you to those who donate to support the project, it is very motivating and helps to release lessons faster. If you want to help the project (release lessons faster, translate it all into English, etc.), at the bottom of the [main page] (https://github.com/romanovichim/TonFunClessons_ru), there are addresses for donations.

##### Addition

An example of a "analyzing actions" function:

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
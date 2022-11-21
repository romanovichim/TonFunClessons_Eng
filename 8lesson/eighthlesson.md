# Lesson 8 FunC tests for smart contract with Hashmap
## Introduction

In this tutorial, we will write tests for the smart contract created in the seventh lesson on The Open Network testnet in FUNC language and execute them using [toncli](https://github.com/disintar/toncli).

## Requirements

To complete this tutorial, you need to install the [toncli](https://github.com/disintar/toncli/blob/master/INSTALLATION.md) command line interface  and complete the previous tutorials.

## Important

Written below describes the old version of the tests. New toncli tests, currently available for dev version of func/fift, instruction [here](https://github.com/disintar/toncli/blob/master/docs/advanced/func_tests_new.md), lesson on new tests [ here](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/11lesson/11lesson.md). The release of new tests does not mean that the lessons on the old ones are meaningless - they convey the logic well, so success in passing the lesson. Also note that old tests can be used with the `--old` flag when using `toncli run_tests`

## Tests for smart contract with Hashmap

For the smart contract from lesson 7, we will write the following tests:
- test_example()
- get_stored_value()
- get_not_stored_value()
- wrong_op()
- bad_query()
- remove_outdated()
- get_stored_value_after_remove()
- remove_outdated2()
- get_stored_value_after_remove2()
- get_not_stored_value2()
- remove_outdated3()

> Important, there are a lot of tests in this lesson, and we will not analyze each one in detail, but we will look at the logic, dwelling only on the most important nuances. Therefore, I advise you to go through the previous lessons before going through this one.

## FunC test structure under toncli

Let me remind you that for each FunC test under toncli we will write two functions. The first one will determine the data (in terms of TON it would be more correct to say the state, but I hope that the data is a more understandable analogy), which we will send to the second for testing.

Each test function must specify a method_id. Method_id test functions should be started from 0.

##### Data function

The data function takes no arguments, but must return:
- function selector - id of the called function in the tested contract;
- tuple - (stack) values ​​that we will pass to the function that performs tests;
- c4 cell - "permanent data" in the control register c4;
- c7 tuple - "temporary data" in the control register c7;
- gas limit integer - gas limit (to understand the concept of gas, I advise you to first read about it in [Ethereum](https://ethereum.org/en/developers/docs/gas/));

> Gas measures the amount of computational effort required to perform certain operations on the network

More about registers c4 and c7 [here](https://ton-blockchain.github.io/docs/tvm.pdf) in 1.3.1

##### Test function

The test function must take the following arguments:

- exit code - return code of the virtual machine, so we can understand the error or not
- c4 cell - "permanent data" in control register c4
- tuple - (stack) values ​​that we pass from the data function
- c5 cell - to check outgoing messages
- gas - the gas that was used

[TVM return codes](https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_exit_codes)

## Test the contract triggering and just put the data for the next tests.

Let's write the first test test_example and analyze its code.

##### Data function

Let's start with the data function:


	[int, tuple, cell, tuple, int] test_example_data() method_id(0) {
		int function_selector = 0;

		slice message_body = begin_cell()
		  .store_uint(1, 32) ;; add key
		  .store_uint(12345, 64) ;; query id
		  .store_uint(787788, 256) ;; key
		  .store_uint(1000, 64) ;; valid until
		  .store_uint(12345, 128) ;; 128-bit value
		  .end_cell().begin_parse();

		cell message = begin_cell()
				.store_uint(0x18, 6)
				.store_uint(0, 2) 
				.store_grams(0)
				.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
				.store_slice(message_body)
				.end_cell();

		tuple stack = unsafe_tuple([12345, 100, message, message_body]);

		cell data = begin_cell().end_cell();

		return [function_selector, stack, data, get_c7_now(100), null()];
	}


## Let's analyze

`int function_selector = 0;`

Since we are calling `recv_internal()` we are assigning the value 0, why 0? Fift (namely, in it we compile our FunC scripts) has predefined identifiers, namely:
- `main` and `recv_internal` have id = 0
- `recv_external` have id = -1
- `run_ticktock` have id = -2

Next, we collect the body of the message in accordance with the task of [lesson seven](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/7lesson/seventhlesson.md).

		slice message_body = begin_cell()
		  .store_uint(1, 32) ;; op
		  .store_uint(12345, 64) ;; query id
		  .store_uint(787788, 256) ;; key
		  .store_uint(1000, 64) ;; valid until
		  .store_uint(12345, 128) ;; 128-bit value
		  .end_cell().begin_parse();

Comments described each value for convenience. Let's also collect the message cell:

    cell message = begin_cell()
            .store_uint(0x18, 6)
            .store_uint(0, 2)
            .store_grams(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_slice(message_body)
            .end_cell();
			
The message must be sent to the address of the smart contract. For this we will use `addr_none` (i.e. `.store_uint(0, 2)`), because according to [SENDRAWMSG documentation](https://ton-blockchain.github.io/docs/#/func/stdlib?id=send_raw_message ) the current address of the smart contract will be automatically substituted for it.

Further, everything is standard for the data function:

    tuple stack = unsafe_tuple([12345, 100, message, message_body]);

    cell data = begin_cell().end_cell();

    return [function_selector, stack, data, get_c7_now(100), null()];

Except for one thing c7 tuple - "temporary data" in c7 control register, before we didn't care what was in c7 and we just used `get_c7()`. i.e. just the current state of c7. But in this tutorial, we will have to work with c7 data and therefore we will have to write a helper function for tests.

##Help function

The code:

	tuple get_c7_now(int now) inline method_id {
		return unsafe_tuple([unsafe_tuple([
			0x076ef1ea,           ;; magic
			0,                    ;; actions
			0,                    ;; msgs_sent
			now,                ;; unixtime
			1,                    ;; block_lt
			1,                    ;; trans_lt
			239,                  ;; randseed
			unsafe_tuple([1000000000, null()]),  ;; balance_remaining
			null(),               ;; myself
			get_config()          ;; global_config
		])]);
	}

So in this smart contract, we need to manipulate the time in the smart contract, we will do this by changing the data in the `c7` register. To understand what tuple format we should "put" into `c7`, let's refer to the documentation, namely [TON description paragraph 4.4.10](https://ton-blockchain.github.io/docs/tblkch.pdf).

We will not dwell on each parameter in detail; I tried to convey the essence briefly with comments in the code.

##### Test function

The code:

	_ test_example(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(1) {
		throw_if(100, exit_code != 0);
	}

## Let's analyze

`throw_if(100, exit_code != 0);`

We check the return code, the function will throw an exception if the return code is not zero.
0 - standard return code from the successful execution of a smart contract.

And that's it, the first test just puts the data so that we can check the operation of the smart contract in the next tests.


## Test getting the stored value

Let's write a `get_stored_value` test that will take the values we put in `test_example` and parse its code.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] get_stored_value_data() method_id(2) {
		int function_selector = 127977;

		int key = 787788;

		tuple stack = unsafe_tuple([key]);

		return [function_selector, stack, get_prev_c4(), get_c7(), null()];
	}

## Let's analyze

	int function_selector = 127977;

To understand what id the GET function has, you need to go to the compiled smart contract and see what id is assigned to the function. Let's go to the build folder and open contract.fif and find the line with `get_key`

	127977 DECLMETHOD get_key

It is necessary to pass the key to the `get_key` function, let's pass the key that we set in the previous test, namely `787788`

	int key = 787788;

	tuple stack = unsafe_tuple([key]);

It remains only to return the data:

	return [function_selector, stack, get_prev_c4(), get_c7(), null()];

As you can see, in c7 we put the current state of c7 using `get_c7()` , and in gas limit integer we put `null()`. Then the situation with the `c4` register is interesting, we need to put a cell from the previous test, this cannot be done using the standard FunC library, BUT in `toncli` this moment is thought out:
In [description of toncli tests](https://github.com/disintar/toncli/blob/master/docs/advanced/func_tests.md), there are get_prev_c4 / get_prev_c5 functions that allow you to get c4/c5 cells from previous tests.

##### Test function

The code:

	_ get_stored_value(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(3) {
		throw_if(100, exit_code != 0);

		var valid_until = first(stack);
		throw_if(102, valid_until != 1000);
		var value = second(stack);
		throw_if(101, value~load_uint(128) != 12345);
	}

## Let's analyze

`throw_if(100, exit_code != 0);`

We check the return code, the function will throw an exception if the return code is not zero.
0 - standard return code from the successful execution of a smart contract.

Let me remind you that the `tuple` variable is the (stack) values ​​that we pass from the data function. We will parse it using [data type primitives](https://ton-blockchain.github.io/docs/#/func/stdlib?id=other-tuple-primitives) `tuple` - `first` and `second`.

    var valid_until = first(stack);
    throw_if(102, valid_until != 1000);
    var value = second(stack);
    throw_if(101, value~load_uint(128) != 12345);

We check the value of `valid_until` and the `128-bit value` we passed. Throw exceptions if the values ​​are different.

## Test for an exception if there is no entry for the received key

Let's write a `get_not_stored_value()` test and analyze its code.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] get_not_stored_value_data() method_id(4) {
		int function_selector = 127977;

		int key = 787789; 

		tuple stack = unsafe_tuple([key]);

		return [function_selector, stack, get_prev_c4(), get_c7(), null()];
	}

## Let's analyze

The data function differs only in the key, we take the key, which is not in the contract store.

	int key = 787789;

##### Test function

The code:

	_ get_not_stored_value(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(5) {
		throw_if(100, exit_code == 0);
	}
	
## Let's analyze

We check that if the return code is 0, i.e. completed without errors, throw an exception.

	throw_if(100, exit_code == 0);

And that is all.

## Check that op = 2 throws an exception if the message contains something other than op and query_id

Let's write a bad_query() test and analyze its code.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] bad_query_data() method_id(8) {
	   int function_selector = 0;

	   slice message_body = begin_cell()
		 .store_uint(2, 32) ;; remove old
		 .store_uint(12345, 64) ;; query id
		 .store_uint(12345, 128) ;; 128-bit value
		 .end_cell().begin_parse();

	   cell message = begin_cell()
			   .store_uint(0x18, 6)
			   .store_uint(0, 2) ;; should be contract address
			   .store_grams(0)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			   .store_slice(message_body)
			   .end_cell();

	   tuple stack = unsafe_tuple([12345, 100, message, message_body]);

	   return [function_selector, stack, get_prev_c4(), get_c7(), null()];
	}

## Let's analyze

The main thing in this data function is the body of the message, in addition to op and query_id, garbage has been added to it in the form store_uint(12345, 128) . You need this to check the following code from the contract:

	if (op == 2) {
		in_msg_body.end_parse();
	}

Thus, getting here the contract will throw an exception.

##### Test function

The code:

	_ bad_query(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(9) {
		throw_if(100, exit_code == 0);
	}

## Let's analyze

As you can see, we are just checking that the contract will throw an exception.

## Test deleting data, but with now < all keys

Let's write the remove_outdated() test and analyze its code.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] remove_outdated_data() method_id(10) {
	   int function_selector = 0;

	   slice message_body = begin_cell()
		 .store_uint(2, 32) ;; remove old
		 .store_uint(12345, 64) ;; query id
		 .end_cell().begin_parse();

	   cell message = begin_cell()
			   .store_uint(0x18, 6)
			   .store_uint(0, 2)
			   .store_grams(0)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			   .store_slice(message_body)
			   .end_cell();

	   tuple stack = unsafe_tuple([12345, 100, message, message_body]);

	   return [function_selector, stack, get_prev_c4(), get_c7_now(1000), null()];
	}

## Let's analyze

`int function_selector = 0;`

Since we are calling `recv_internal()` we are assigning the value 0, why 0? Fift (namely, in it we compile our FunC scripts) has predefined identifiers, namely:
- `main` and `recv_internal` have id = 0
- `recv_external` have id = -1
- `run_ticktock` have id = -2

Next, we collect the body of the message in accordance with the task [of the seventh lesson](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/7lesson/seventhlesson.md) with `op` = 2 .

	   slice message_body = begin_cell()
		 .store_uint(2, 32) ;; remove old
		 .store_uint(12345, 64) ;; query id
		 .end_cell().begin_parse();

Let's also collect the message cell:

	   cell message = begin_cell()
			   .store_uint(0x18, 6)
			   .store_uint(0, 2)
			   .store_grams(0)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			   .store_slice(message_body)
			   .end_cell();

Further, everything is standard for the data function:

	   tuple stack = unsafe_tuple([12345, 100, message, message_body]);

	   return [function_selector, stack, get_prev_c4(), get_c7_now(1000), null()];

Also, let's put 1000 in c7 to check how deletion works with now < `valid_until` in the contract.

##### Test function

The code:

	_ remove_outdated(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(11) {
		throw_if(100, exit_code != 0);
	}

## Let's 

With now < `valid_until` the contract should just work correctly, so:

`throw_if(100, exit_code != 0);`

We check the return code, the function will throw an exception if the return code is not zero.
0 - standard return code from the successful execution of a smart contract.

Whether the value was deleted or not will be checked in the next test.

## Test that the values were not deleted when now < all keys

In this `get_stored_value_after_remove()` test, everything is absolutely identical to the test:
`get_stored_value()` , so I will not stop, just give the code:

##### get_stored_value_after_remove() code 

[int, tuple, cell, tuple, int] get_stored_value_after_remove_data() method_id(12) {
    int function_selector = 127977;

    int key = 787788;

    tuple stack = unsafe_tuple([key]);

    return [function_selector, stack, get_prev_c4(), get_c7(), null()];
}


_ get_stored_value_after_remove(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(13) {
    throw_if(100, exit_code != 0);

    var valid_until = first(stack);
    throw_if(102, valid_until != 1000);
    var value = second(stack);
    throw_if(101, value~load_uint(128) != 12345);
}

## Testing deletion of obsolete data

Now let's remove obsolete data by setting get_c7_now(now) to 1001. We do it like this: the test function `remove_outdated2()` with `op` = 2 and now = 1001 will remove obsolete , and `get_stored_value_after_remove2()` will check that the data for the key `787788` has been deleted and the `get_key()` function will return an exception. We get:

	[int, tuple, cell, tuple, int] remove_outdated2_data() method_id(14) {
	   int function_selector = 0;

	   slice message_body = begin_cell()
		 .store_uint(2, 32) ;; remove old
		 .store_uint(12345, 64) ;; query id
		 .end_cell().begin_parse();

	   cell message = begin_cell()
			   .store_uint(0x18, 6)
			   .store_uint(0, 2) ;; should be contract address
			   .store_grams(0)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			   .store_slice(message_body)
			   .end_cell();

	   tuple stack = unsafe_tuple([12345, 100, message, message_body]);

	   return [function_selector, stack, get_prev_c4(), get_c7_now(1001), null()];
	}


	_ remove_outdated2(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(15) {
		throw_if(100, exit_code != 0);
	}


	[int, tuple, cell, tuple, int] get_stored_value_after_remove2_data() method_id(16) {
		int function_selector = 127977;

		int key = 787788;

		tuple stack = unsafe_tuple([key]);

		return [function_selector, stack, get_prev_c4(), get_c7(), null()];
	}


	_ get_stored_value_after_remove2(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(17) {
		throw_if(100, exit_code == 0);
	}

## Test another key

After we have removed the obsolete data, we will try to get data with a different key, the `get_key` function should also throw an exception.

	[int, tuple, cell, tuple, int] get_not_stored_value2_data() method_id(18) {
		;; Funtion to run (recv_internal)
		int function_selector = 127977;

		int key = 787789; ;; random key

		;; int balance, int msg_value, cell in_msg_full, slice in_msg_body
		tuple stack = unsafe_tuple([key]);

		cell data = begin_cell().end_cell();

		return [function_selector, stack, data, get_c7(), null()];
	}


	_ get_not_stored_value2(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(19) {
		throw_if(100, exit_code == 0);
	}

As you can see, we use the key 787789, which was not there, and check that the function throws an exception.

## Let's run the deletion again when the data has already been deleted

And finally, the last test, once again run the deletion with now < all keys


	[int, tuple, cell, tuple, int] remove_outdated3_data() method_id(20) {
	   int function_selector = 0;

	   slice message_body = begin_cell()
		 .store_uint(2, 32) ;; remove old
		 .store_uint(12345, 64) ;; query id
		 .end_cell().begin_parse();

	   cell message = begin_cell()
			   .store_uint(0x18, 6)
			   .store_uint(0, 2) 
			   .store_grams(0)
			   .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			   .store_slice(message_body)
			   .end_cell();

	   tuple stack = unsafe_tuple([12345, 100, message, message_body]);

	   return [function_selector, stack, begin_cell().end_cell(), get_c7_now(1000), null()];
	}


	_ remove_outdated3(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(21) {
		throw_if(100, exit_code != 0);
	}
	
## Conclusion

I wanted to say a special thank you to those who donate to support the project, it is very motivating and helps to release lessons faster. If you want to help the project (release lessons faster, translate it all into English, etc.), at the bottom of the [main page] (https://github.com/romanovichim/TonFunClessons_ru), there are addresses for donations.

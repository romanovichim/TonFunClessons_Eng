# Lesson 11 New func tests for smart contracts in toncli

## Introduction

New tests have appeared in toncli, in this tutorial we will write tests for a smart contract in FUNC language in a new style and execute them using [toncli](https://github.com/disintar/toncli).

## Requirements

To complete this tutorial, you need to install the [toncli](https://github.com/disintar/toncli/blob/master/INSTALLATION.md) command line interface and complete the [first lesson](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/1lesson/firstlesson.md) and [second lesson](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/2lesson/secondlesson.md).

> This lesson has been written on 08/23/2022 at the moment new tests are available in the dev version of func/fift. How to install the dev version is described in [instructions for new tests](https://github.com/disintar/toncli/blob/master/docs/advanced/func_tests_new.md).

## What we will test

In this lesson, we will test a smart contract similar to the one in the first lesson. So, before moving on to the tests, let's consider the contract itself.

The smart contract that we will create should have the following functionality:

- store in your data an integer total - a 64-bit unsigned number;
- when receiving an internal incoming message, the contract must take an unsigned 32-bit integer from the message body, add it to total and store it in the contract data;
- the smart contract must have a get total method that allows you to return the value of total

Smart contract code:

	() recv_internal(slice in_msg) impure {
	  int n = in_msg~load_uint(32);

	  slice ds = get_data().begin_parse();
	  int total = ds~load_uint(64);

	  total += n;

	  set_data(begin_cell().store_uint(total, 64).end_cell());
	}

	int get_total() method_id {
	  slice ds = get_data().begin_parse();
	  int total = ds~load_uint(64);
	  return total;
	}

> If you don't understand something in this smart contract, I advise you to go through the first lesson.

## Let's start testing

In old tests, we had to write two functions: a data function and a test function, and also specify the id of the function so that the tests understand what the tests are about. There is no such logic in the new tests.

In the new tests, testing occurs through two functions that allow you to call smart contract methods:
- `invoke_method` , which assumes no exception will be thrown
- `invoke_method_expect_fail` which assumes an exception will be thrown

These special functions, we will call inside the test functions, which can return any number of values, all of them will be displayed when the tests are run in the report.

The name of each test function must start with `__test`. This way we can determine which functions are tests and which are just helpers.

Let's see how it works with examples.

### Testing sending a message and checking by amount

Let's call our test function `__test_example()`, it will return the amount of gas consumed, so it will be `int`.

	int __test_example() {

	}

Since we will be writing a lot of tests in our lesson, we will often need to zero out the `c4` register, so we will create a helper function that will write `c4` to zero. (It won't have `__test` in its name).

We will do this using the functions of the [FunC standard library](https://ton.org/docs/#/func/stdlib)

`set_data(begin_cell().store_uint(total, 64).end_cell());`

`begin_cell()` - will create a Builder for the future cell
`store_uint()` - writes the value of total
`end_cell()`- create Cell
`set_data()` - writes the cell to register c4

We get the code:

	() set_default_initial_data() impure {
	  set_data(begin_cell().store_uint(0, 64).end_cell());
	}
	
`impure` is a keyword that indicates that the function changes the smart contract data.

> If `impure` is not specified and the result of a function call is not used, then the FunC compiler may remove that function call.

Let's call the helper function in our test function:

	int __test_example() {
		set_default_initial_data();

	}

One of the convenient features of the new tests is that within one test function, you can call several smart contract methods. Inside our test, we will call the `recv_internal()` method and the Get method, so we will increment the value in `c4` with the message and immediately check that the value has changed to the one sent.

To call the `recv_internal()` method, we need to create a cell with a message.

	int __test_example() {
		set_default_initial_data();

		cell message = begin_cell().store_uint(10, 32).end_cell();

	}
	
Now we can call methods, we will use `invoke_method`. `invoke_method` takes two arguments: the name of the method and the arguments (which will be passed to the method) as a tuple. Two values ​​are returned: the gas used and the values ​​returned by the method (as a tuple). If the method call results in an exception, `invoke_method` will also result in an exception, and the test will fail.

In the first call, the arguments will be `recv_internal` and a tuple with a message transformed into a slice using `begin_parse()`

`var (int gas_used1, _) = invoke_method(recv_internal, [message.begin_parse()]);`

For the record, let's store the amount of gas used in `int gas_used1`.

In the second call, the arguments will be the Get method `get_total()` and an empty tuple.

`var (int gas_used2, stack) = invoke_method(get_total, []);`

For the report, we also store the amount of gas used in `int gas_used2`, plus the values ​​that the method returns, to check later that everything worked correctly.

We get:

	int __test_example() {
		set_default_initial_data();

		cell message = begin_cell().store_uint(10, 32).end_cell();
		var (int gas_used1, _) = invoke_method(recv_internal, [message.begin_parse()]);
		var (int gas_used2, stack) = invoke_method(get_total, []);

	}
	
Let's check that the value returned by invoke_method in the second call is equal to the value we sent. Throw an exception if it's not. And in the end we will return the amount of gas consumed.

	int __test_example() {
		set_data(begin_cell().store_uint(0, 64).end_cell());
		cell message = begin_cell().store_uint(10, 32).end_cell();
		var (int gas_used1, _) = invoke_method(recv_internal, [message.begin_parse()]);
		var (int gas_used2, stack) = invoke_method(get_total, []);
		[int total] = stack;
		throw_if(101, total != 10);
		return gas_used1 + gas_used2;
	}
	
This is the whole test, very convenient.

### Data in c4 and new tests

By default, "persistent" data is not copied from a previous test function.

Let's check this with the next test.

##### Let's call the get method method without data in c4

Since we expect the method to throw an exception, we will use `invoke_method_expect_fail`. It takes two arguments just like invoke_method but only returns the amount of gas used by the method.

	int __test_no_initial_data_should_fail() {
		int gas_used = invoke_method_expect_fail(get_total, []);
		return gas_used;
	}
	
##### Let's call the get method method with data from previous tests in c4

Now, to show how you can work with the data in `c4` in different test functions, call the first test (it will give data for `c4`) and use the special function for tests `get_prev_c4()`

We call the first test `__test_example()`:

	int __test_set_data() {
	  return __test_example();
	}
	
Now we just copy the first test, replacing sending a message with the number 10, with `set_data(get_prev_c4());`

	int __test_data_from_prev_test() {
		set_data(get_prev_c4());
		var (int gas_used, stack) = invoke_method(get_total, []);
		var [total] = stack;
		throw_if(102, total != 10);
		return gas_used;
	}
	

> Of course we can take data from the previous test functions for `c4` and `c5` using `get_prev_c4()` and `get_prev_c5()` respectively, but it is good practice to write helper functions (as we did at the very beginning) and using them in different test functions.

### Invoke method exceptions and test function exceptions

It is important to note that exceptions thrown by invoke methods will not affect the test suite internally. Let's check that the value of the variable does not change if, after its declaration, `invoke_method_expect_fail` throws an exception.

The function framework of this test:

	int __test_throw_doesnt_corrupt_stack() {
		int check_stack_is_not_corrupted = 123;

	}

As you can see, we pushed the number 123 onto the stack. Now let's call the Get method of our smart contract, assuming that this will result in an exception, since there is no data in `c4`.

	int __test_throw_doesnt_corrupt_stack() {
		int check_stack_is_not_corrupted = 123;
		int gas_used = invoke_method_expect_fail(get_total, []);

	}

And at the very end, we check that the value has not changed.

	int __test_throw_doesnt_corrupt_stack() {
		int check_stack_is_not_corrupted = 123;
		int gas_used = invoke_method_expect_fail(get_total, []);

		throw_if(102, check_stack_is_not_corrupted != 123);
		return gas_used;
	}
	
### Testing types

Let's see how types can be tested in new tests. To do this, we will write a helper function that will store a number and a cell with two numbers.

> Yes, you can call helper functions with invoke methods)

The first number will be determined immediately, and the second two will be passed to the function.

	(int, cell) build_test_cell(int x, int y) {
	  return (12345, begin_cell().store_uint(x, 64).store_uint(y, 64).end_cell());
	}
	
Let's assemble the framework of the test function and immediately call the helper one:

	int __test_not_integer_return_types() {
	  var (int gas_used, stack) = invoke_method(build_test_cell, [100, 500]);

	}
	
We get the values, namely the number and the cell `[int res, cell c] = stack;`, immediately check the value of the number `throw_if(102, res != 12345);`. We get:

	int __test_not_integer_return_types() {
	  var (int gas_used, stack) = invoke_method(build_test_cell, [100, 500]);
	  [int res, cell c] = stack;
	  throw_if(102, res != 12345);

	}
	
Let's convert the cell to a slice using `begin_parse`. And now by subtracting the values, we check the values. We will subtract using `load_uint` - a function from the [FunC standard library](https://ton.org/docs/#/func/stdlib) it loads an unsigned n-bit integer from a slice.

	int __test_not_integer_return_types() {
	  var (int gas_used, stack) = invoke_method(build_test_cell, [100, 500]);
	  [int res, cell c] = stack;
	  throw_if(102, res != 12345);
	  slice s = c.begin_parse();
	  throw_if(103, s~load_uint(64) != 100);
	  throw_if(104, s~load_uint(64) != 500);
	  return gas_used;
	}
	
At the very end, we return the used gas.

### Gas flow test example

Since invoke methods return gas consumption, this makes it very convenient to check gas consumption in new tests. Let's see how it works by calling an empty helper function.

Empty function:

	() empty_method() inline method_id {

	}

Calling an empty function costs approximately 600 units of gas. Test framework:

	int __test_empty_method_gas_consumption() method_id {

	}

With the help of `invoke_method` we will call the function and check that the gas consumption is not less than 400, but not more than 700.

	int __test_empty_method_gas_consumption() method_id {
	  var (int gas_used, _) = invoke_method(empty_method, []);
	  throw_if(101, gas_used < 500);
	  throw_if(102, gas_used > 700);
	  return gas_used;
	}

### Return multiple values

Let's go back to our smart contract and take advantage of the fact that new tests can return multiple values. To return multiple values, you need to put them in a tuple. Let's try to send three identical messages to the smart contract.

Function framework:

	[int, int, int] __test_can_return_complex_type_from_test() {

	}

We will set the "start state" using the helper function `set_default_initial_data()`, which we wrote for the first test. We will also collect the message cell.

	[int, int, int] __test_can_return_complex_type_from_test() {
	  set_default_initial_data();

	  cell message = begin_cell().store_uint(10, 32).end_cell();

	}

The only thing left is to send a message three times and "wrap" the returned gas values into a tuple.

	[int, int, int] __test_can_return_complex_type_from_test() {
	  set_default_initial_data();

	  cell message = begin_cell().store_uint(10, 32).end_cell();

	  (int gas_used1, _) = invoke_method(recv_internal, [message.begin_parse()]);
	  (int gas_used2, _) = invoke_method(recv_internal, [message.begin_parse()]);
	  (int gas_used3, _) = invoke_method(recv_internal, [message.begin_parse()]);

	  return [gas_used1, gas_used2, gas_used3];
	}

### Test chains

New tests allow you to create test chains by keeping the data they return on the stack.

> That is, the data in c4 does not remain after the execution of the test function, we talked about this, but you can put data on the stack

Let's put three numbers on the stack as one test function.

	(int, int, int) __test_can_return_more_than_one_stack_entry() {
	  return (1, 2, 3);
	}

And the other check that there are values on the stack. To do this, we need a helper function that will return the current stack depth.

Let me remind you that FunC supports the definition of a function in assembler (meaning Fift). This happens as follows - we define a function as a low-level TVM primitive. For a function that will return the current stack depth, it would look like this:

	int stack_depth() asm "DEPTH";

As you can see, the `asm` keyword is used

You can see the list of possible primitives from page 77 in [TVM](https://ton-blockchain.github.io/docs/tvm.pdf).

So let's check that the stack depth is not equal to zero.

	int __test_check_stack_depth_after_prev_test() {
	  int depth = stack_depth();
	  throw_if(100, depth != 0);
	  return 0;
	}
	
Thanks to such mechanics, it is possible to implement a complex chain of tests.

## Conclusion

New tests in `toncli` greatly simplify the testing of smart contracts in the TON network, which will allow you to quickly and most importantly develop applications for the TON network with high quality. Lessons and articles about the technical component of the TON network, I write [here](https://t.me/ton_learn), I will be glad for your subscription.
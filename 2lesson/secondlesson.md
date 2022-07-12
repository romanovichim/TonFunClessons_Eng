# Lesson 2 FunC tests for smart contract
## Introduction

In this tutorial, we will write tests for the smart contract created in the first lesson on The Open Network testnet in FunC language and execute them using [toncli](https://github.com/disintar/toncli).

## Requirements

To complete this tutorial, you need to install the [toncli] command line interface(https://github.com/disintar/toncli/blob/master/INSTALLATION.md) and complete the [first lesson](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/1lesson/firstlesson.md) .

## Tests for the first smart contract

For our first smart contract, we will write the following tests:

- test_example - calls recv_internal() with number 10
- test_get_total - tests the get method
- test_exception - checks the addition of a number that does not fit the bit condition

## FunC test structure under toncli

For each FunC test under toncli, we will write two functions. The first one will determine the data (in terms of TON it would be more correct to say the state, but I hope that the data is a more understandable analogy), which we will send to the second for testing.

Each test function must specify a method_id. Method_id test functions should be started from 0.

##### Create a test file

Let's create in the code of our previous lesson, in the *tests* folder, the file *example.func* in which we will write our tests.

##### Data function

The data function takes no arguments, but must return:
- function selector - id of the called function in the tested contract;
- tuple - (stack) values ​​that we will pass to the function that performs tests;
- c4 cell - "permanent data" in the control register c4;
- c7 tuple - "temporary data" in the control register c7;
- gas limit integer - gas limit (to understand the concept of gas, I advise you to first read about it in [Ethereum](https://ethereum.org/en/developers/docs/gas/));

> In simple words, gas measures the amount of computational effort required to perform certain operations on the network. And you can read in detail [here] (https://ton.org/docs/#/smart-contracts/fees). Well, in full detail [here in Appendix A] (https://ton-blockchain.github.io/docs/tvm.pdf).

> Stack - a list of elements organized according to the LIFO principle (English last in - first out, "last in - first out"). The stack is well written in [wikipedia](https://ru.wikipedia.org/wiki/%D0%A1%D1%82%D0%B5%D0%BA).

More about registers c4 and c7 [here] (https://ton-blockchain.github.io/docs/tvm.pdf) in 1.3.1

##### Test function

The test function must take the following arguments:

- exit code - return code of the virtual machine, so we can understand the error or not
- c4 cell - "permanent data" in control register c4
- tuple - (stack) values ​​that we pass from the data function
- c5 cell - to check outgoing messages
- gas - the gas that was used

[TVM return codes](https://ton.org/docs/#/smart-contracts/tvm_exit_codes)

## Test the recv_internal() call

Let's write the first test test_example and analyze its code.

##### Data function

Let's start with the data function:

    [int, tuple, cell, tuple, int] test_example_data() method_id(0) {
		int function_selector = 0;

		cell message = begin_cell()     
				.store_uint(10, 32)          
				.end_cell();

		tuple stack = unsafe_tuple([message.begin_parse()]); 

		cell data = begin_cell()             
			.store_uint(0, 64)              
			.end_cell();

		return [function_selector, stack, data, get_c7(), null()];
	}

## Let's analyze

`int function_selector = 0;`

Since we are calling `recv_internal()` we are assigning the value 0, why 0? Fift (namely, in it we compile our FunC scripts) has predefined identifiers, namely:
- `main` and `recv_internal` have id = 0
- `recv_external` have id = -1
- `run_ticktock` have id = -2

		cell message = begin_cell()     
				.store_uint(10, 32)          
				.end_cell();


In the message cell we write unsigned integer 10 32-bit.

tuple stack = unsafe_tuple([message.begin_parse()]);

`tuple` is another FunC data type.
Tuple - ordered set of arbitrary values of stack value types.

Using `begin_parse()` we turn the *message *cell into *slice* and write it to *tuple* using the `unsafe_tuple()` function.

		cell data = begin_cell()             
			.store_uint(0, 64)              
			.end_cell();

In the control register c4 put 0 64-bit.

It remains only to return the data:

`return [function_selector, stack, data, get_c7(), null()];`

As you can see, in c7 we put the current state of c7 using `get_c7()` , and in gas limit integer we put `null()`.

##### Test function

The code:

	_ test_example(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(1) {
		throw_if(100, exit_code != 0);

		var ds = data.begin_parse();

		throw_if(101, ds~load_uint(64) != 10); 
		throw_if(102, gas > 1000000); 
	}

## Let's analyze

`throw_if(100, exit_code != 0);`

We check the return code, the function will throw an exception if the return code is not equal to zero.
0 - standard return code from the successful execution of a smart contract.

		var ds = data.begin_parse();

		throw_if(101, ds~load_uint(64) != 10); 

We check that the number we sent is equal to 10, i.e. we sent the number 10 32-bit, and 10 64-bit were written to the control register c4 as a result of the execution of the smart contract.

Namely, we create an exception if not 10.

`throw_if(102, gas > 1000000); `

Despite the fact that in the problem that we solved in the first lesson there were no restrictions on the use of gas, in tests of smart contracts it is important to check not only the execution logic, but also that the logic does not lead to very large gas consumption, otherwise the contract will be not viable on the mainnet.

## Testing the Get function call

Let's write the test_get_total test and analyze its code.

##### Data function

Let's start with the data function:


	[int, tuple, cell, tuple, int] test_get_total_data() method_id(2) {
		int function_selector = 128253; 
		
		tuple stack = unsafe_tuple([]); 

		cell data = begin_cell()            
			.store_uint(10, 64)              
			.end_cell();

		return [function_selector, stack, data, get_c7(), null()];
	}
	
## Let's analyze

`int function_selector = 128253; `

To understand what id the GET function has, you need to go to the compiled smart contract and see what id is assigned to the function. Let's go to the build folder and open contract.fif and find the line there with get_total

`128253 DECLMETHOD get_total`

In the case of the get_total function, we don't need to pass any arguments, so we just declare an empty tuple

`tuple stack = unsafe_tuple([]); `

And in c4 we write 10, for verification.

		cell data = begin_cell()            
			.store_uint(10, 64)              
			.end_cell();
			

##### Test function

The code:

	_ test_get_total(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(3) {
		throw_if(103, exit_code != 0); 
		int counter = first(stack); 
		throw_if(104, counter != 10); 
	}
	
## Let's analyze

`throw_if(103, exit_code != 0); `

Let's check the return code.

		int counter = first(stack); 
		throw_if(104, counter != 10); 
		
In our test, it is important for us that the value 10 that we passed was "on top" of the stack, so we subtract using the first function of the standard library [stdlib.fc](https://ton.org/docs/#/func/stdlib?id= first) which returns the first value of the tuple.

## Test the exception

Let's write a test_exception test and analyze its code.

##### Data function

Let's start with the data function:

	[int, tuple, cell, tuple, int] test_exception_data() method_id(4) {
		int function_selector = 0;

		cell message = begin_cell()     
				.store_uint(30, 31)           
				.end_cell();

		tuple stack = unsafe_tuple([message.begin_parse()]);

		cell data = begin_cell()            
			.store_uint(0, 64)               
			.end_cell();

		return [function_selector, stack, data, get_c7(), null()];
	}
	
## Let's analyze

As we can see, the difference from our first function is minimal, namely the value that we put in the tuple, 30 31-bit.

		cell message = begin_cell()     
				.store_uint(30, 31)           
				.end_cell();
				
But in the function of tests, the differences will already be more noticeable.

##### Test function

	_ test_exception(int exit_code, cell data, tuple stack, cell actions, int gas) method_id(5) {
		throw_if(100, exit_code == 0);
	}
	
Unlike other test functions, here we expect an exception if the smart contract is executed successfully.	

## Run tests

In order for toncli to "understand" where the tests are located, you need to add information to `project.yaml`.


	contract:
	  data: fift/data.fif
	  func:
		- func/code.func
	  tests:
		- tests/example.func

Now we run the tests with the command:

`toncli run_tests`

It should turn out the following:

![toncli get send](./img/run_tests.png)

P.S if you have any questions, I suggest asking [here](https://t.me/ton_learn)
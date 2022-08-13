# Lesson 1: Simple FunC Smart Contract
## Introduction

In this tutorial, we will write your first smart contract on The Open Network testnet in FunC language and deploy* it to the testnet using [toncli](https://github.com/disintar/toncli), and test it with the message in Fift language.

> *Deploy is the process of transferring to the network (in this case, a smart contract to the blockchain)

## Requirements

To complete this tutorial, you need to install the [toncli](https://github.com/disintar/toncli/blob/master/INSTALLATION.md) command line interface.

## Smart contract

The smart contract that we will create should have the following functionality:
- store in its data an integer *total* - a 64-bit unsigned number;
- when receiving an internal incoming message, the contract must take an unsigned 32-bit integer from the message body, add it to *total* and store it in the contract data;
- The smart contract must provide a *get total* method that allows you to return the value of *total*
- If the body of the incoming message is less than 32 bits, then the contract must throw an exception

## Create a project with toncli

Run the following commands in the console:

     toncli start wallet
     cd wallet

Toncli has created a simple wallet project, you can see 4 folders in it:
- build;
- func;
- fift;
- test;

At this stage, we are interested in the func and fift folders, in which we will write code in FunС and Fift, respectively.

##### What is FunC and Fift

The FunC high-level language is used to program smart contracts on TON. FunC programs are compiled into Fift assembler code, which generates the corresponding bytecode for the TON Virtual Machine (TVM) (More about TVM [here](https://ton-blockchain.github.io/docs/tvm.pdf)). Further, this bytecode (actually a tree of cells, like any other data in the TON Blockchain) can be used to create a smart contract on the blockchain or can be run on a local instance of TVM (TON Virtual Machine).

More information about FunC can be found [here](https://ton.org/docs/#/smart-contracts/)

##### Let's prepare a file for our code

Go to func folder:

    cd func

And open the code.func file, on your screen you will see the wallet smart contract, delete all the code and we are ready to start writing our first smart contract.

## External methods

Smart contracts on the TON network have two reserved methods that can be accessed.

First, `recv_external()` this function is executed when a request to the contract comes from the outside world, that is, not from TON, for example, when we form a message ourselves and send it via lite-client (About installing [lite-client](https://ton.org/docs/#/compile?id=lite-client)).
Second, `recv_internal()` this function is executed when inside TON itself, for example, when any contract refers to ours.
 
 > Light client (English lite-client) is a software that connects to full nodes to interact with the blockchain. They help users access and interact with the blockchain without the need to synchronize the entire blockchain.
 
`recv_internal()` fits our conditions.

In the `code.fc` file we write:

     () recv_internal(slice in_msg_body) impure {
     ;; here will be the code
     }
 
  > FunC has single-line comments, which start with `;;` (double `;`).
  
We pass the in_msg_body slice to the function and use the impure keyword

`impure` is a keyword that indicates that the function changes the smart contract data.

For example, we must specify the `impure` specifier if the function can modify the contract store, send messages, or throw an exception when some data is invalid and the function is intended to validate that data.

Important: If impure is not specified and the result of a function call is not used, then the FunC compiler may remove that function call.

But in order to understand what a slice is, let's talk about the types in the smart contracts of the TON network

##### Cell, slice, builder, integer types in FunC

In our simple smart contract, we will use only four types:

- Cell - TVM cell consisting of 1023 bits of data and up to 4 references to other cells
- Slice - a partial representation of the TVM cell used to parse data from the cell
- Builder - partially built cell containing up to 1023 bits of data and up to four links; can be used to create new cells
- Integer - signed 257-bit integer

More about types in FunC:
[briefly here](https://ton.org/docs/#/smart-contracts/) ,
[detailed description here in section 2.1](https://ton-blockchain.github.io/docs/fiftbase.pdf)

In simple terms, cell is a sealed cell, slice is when the cell can be read, and builder is when you assemble the cell.

## Convert the resulting slice to Integer

To convert the resulting slice to Integer, add the following code:
`int n = in_msg_body~load_uint(32);`

The `recv_internal()` function now looks like this:

     () recv_internal(slice in_msg_body) impure {
		int n = in_msg_body~load_uint(32);
     }

`load_uint` function is from the [FunC standard library](https://ton.org/docs/#/func/stdlib) it loads an unsigned n-bit integer from a slice.

## Persistent smart contract data

To add the resulting variable to `total` and store the value in the smart contract, let's look at how the persistent data/storage functionality is implemented in TON.

>Note: Do not confuse with TON Storage, the storage in the previous sentence is a convenient analogy.

The TVM virtual machine is stack-based, so it is good practice to store data in a contract using a specific register, rather than storing the data "on top" of the stack.

To store permanent data, register c4 is assigned, the data type is Cell.

More details about the registers can be found [c4](https://ton-blockchain.github.io/docs/tvm.pdf) in paragraph 1.3

##### Take data from c4

In order to "get" data from c4, we need two functions from the FunC standard library.

Namely:
`get_data` - Gets a cell from the c4 register.
`begin_parse` - converts a cell into a slice

Pass this value to slice ds

`slice ds = get_data().begin_parse();`

And also we will transform this slice into Integer 64-bit for summation in accordance with our task. (With the help of the `load_uint` function already familiar to us)

`int total = ds~load_uint(64);`

Now our function will look like this:

    () recv_internal(slice in_msg_body) impure {
		int n = in_msg_body~load_uint(32);

		slice ds = get_data().begin_parse();
		int total = ds~load_uint(64);
    }

##### Sum up

For summation, we will use the binary summation operation `+` and the assignment `=`

    () recv_internal(slice in_msg_body) impure {
		int n = in_msg_body~load_uint(32);

		slice ds = get_data().begin_parse();
		int total = ds~load_uint(64);

		total += n;
    }

##### Save the value

In order to keep a constant value, we need to do four things:

- create a Builder for the future cell
- write a value to it
- from Builder create Cell (cell)
- Write the resulting cell to the register

We will do this again using the functions of the [FunC standard library](https://ton.org/docs/#/func/stdlib)

`set_data(begin_cell().store_uint(total, 64).end_cell());`

`begin_cell()` - creates a Builder for the future cell
`store_uint()` - writes the value of total
`end_cell()`- create Cell (cell)
`set_data()` - writes the cell to register c4

Outcome:

    () recv_internal(slice in_msg_body) impure {
		int n = in_msg_body~load_uint(32);

		slice ds = get_data().begin_parse();
		int total = ds~load_uint(64);

		total += n;

		set_data(begin_cell().store_uint(total, 64).end_cell());
    }
	
## Throw exceptions

All that's left to do in our internal function is to add an exception call if the received variable is not 32-bit.

For this we will use [built-in](https://ton.org/docs/#/func/builtins) exceptions.

Exceptions can be thrown by the conditional primitives `throw_if` and `throw_unless` and the unconditional `throw` .

Let's use `throw_if` and pass any error code. In order to take the bitness we use `slice_bits()`.

throw_if(35,in_msg_body.slice_bits() < 32);

By the way, in the TON TVM virtual machine, there are standard exception codes, we will really need them in tests. You can view it [here](https://ton.org/docs/#/smart-contracts/tvm_exit_codes).

Insert at the beginning of the function:

    () recv_internal(slice in_msg_body) impure {
		throw_if(35,in_msg_body.slice_bits() < 32);

		int n = in_msg_body~load_uint(32);

		slice ds = get_data().begin_parse();
		int total = ds~load_uint(64);

		total += n;

		set_data(begin_cell().store_uint(total, 64).end_cell());
    }
	
## Write a Get function

Any function in FunC matches the following pattern:

`[<forall declarator>] <return_type><function_name(<comma_separated_function_args>) <specifiers>`

Let's write a get_total() function that returns an Integer and has a method_id specification (more on that later)
 
    int get_total() method_id {
  	;; здесь будет код
	}

##### Method_id

The method_id specification allows you to call a GET function by name from lite-client or ton-explorer.
Roughly speaking, all functions in that volume have a numerical identifier, get methods are numbered by crc16 hashes of their names.

##### Get data from c4

In order for the function to return the total stored in the contract, we need to take the data from the register, which we have already done:

    int get_total() method_id {
  		slice ds = get_data().begin_parse();
 	 	int total = ds~load_uint(64);
		
  		return total;
	}
	
## All code of our smart contract

    () recv_internal(slice in_msg_body) impure {
		throw_if(35,in_msg_body.slice_bits() < 32);

		int n = in_msg_body~load_uint(32);

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
	
## Deploy the contract to the testnet

For deployment to the test network, we will use the command line interface [toncli] (https://github.com/disintar/toncli/)

`toncli deploy -n testnet`

##### What to do if it says that there is not enough TON?

You need to get them from the test faucet, the bot for this is @testgiver_ton_bot
You can see the wallet address directly in the console, after the deploy command, toncli will display it to the right of the INFO line: Found existing deploy-wallet

To check if TON came to your wallet on the test network, you can use this explorer: https://testnet.tonscan.org/

> Important: This is only a testnet

## Testing the contract

##### Call recv_internal()

To call recv_internal(), you need to send a message within the TON network.
With [toncli send](https://github.com/disintar/toncli/blob/master/docs/advanced/send_fift_internal.md)

Let's write a small Fift script that will send a 32-bit message to our contract.

##### Message script

To do this, create a `try.fif` file in the fift folder and write the following code in it:
 
    "Asm.fif" include
	
	<b
		11 32 u, // number
	b>
	

`"Asm.fif" include` - needed to compile message into bytecode

Now consider the message:

`<b b>` - create Builder cells, more details in paragraph [5.2](https://ton-blockchain.github.io/docs/fiftbase.pdf)

`10 32 u` - put 32-bit unsigned integer 10

` // number` - single line comment

##### Deploy the resulting message

On the command line:

`toncli send -n testnet -a 0.03 --address "address of your contract" --body ./fift/try.fif`

Now let's test the GET function:

`toncli get get_total`

You should get the following:

![toncli get send](./img/tonclisendget.png)

## Congratulations you made it to the end

##### Exercise

As you may have noticed, we have not tested the exception, modify the message so that the smart contract throws an exception.
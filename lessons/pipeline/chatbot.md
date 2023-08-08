## Introduction

In this tutorial, we will analyze the chatbot smart contract. Which we need in order to figure out how to inspect transactions in tests and for onchain tests.

## About TON

TON is an [actor model](https://en.wikipedia.org/wiki/Actor_model) is a mathematical parallel computing model that underlies TON smart contracts. In it, each smart contract can receive one message, change its own state, or send one or more messages per unit of time.

Most often, to create a full-fledged application on TON, you need to write several smart contracts that seem to communicate with each other using messages. In order for the contract to understand what it needs to do when a message arrives, it is recommended to use `op`. `op` is a 32-bit identifier that should be passed in the body of the message.

Thus, inside the message using conditional statements, depending on the smart contract `op` performs different actions.

Therefore, it is important to be able to test messages, which we will do today.

The chatbot smart contract receives any internal message and responds to it with an internal message with the reply text.

## Parsing the contract

##### Standard Library

The first thing to do is [import the standard library](https://ton-blockchain.github.io/docs/#/func/stdlib). The library is just a wrapper for the most common TVM (TON virtual machine) commands that are not built-in.

	#include "imports/stdlib.fc";

To process internal messages, we need the `recv_internal()` method


    () recv_internal()  {

    }
	
	
##### External method arguments
Here a logical question arises - how to understand what arguments a function should have so that it can receive messages on the TON network?

According to the documentation of the [TON virtual machine - TVM](https://ton-blockchain.github.io/docs/tvm.pdf), when an event occurs on an account in one of the TON chains, it triggers a transaction.

Each transaction consists of up to 5 stages. More details [here](https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_overview?id=transactions-and-phases).

We are interested in **Compute phase**. And to be more specific, what is "on the stack" during initialization. For normal post-triggered transactions, the initial state of the stack looks like this:

5 elements:
- Smart contract balance (in nanoTons)
- Incoming message balance (in nanotones)
- Cell with incoming message
- Incoming message body, slice type
- Function selector (for recv_internal it is 0)

    () recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body)  {

    }
	
But it is not necessary to write all the arguments to `recv_internal()`. By setting arguments to `recv_internal()`, we tell the smart contract code about some of them. Those arguments that the code will not know about will simply lie at the bottom of the stack, never touched. For our smart contract, this is:

	() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {

	}

##### Gas to handle messages

Our smart contract will need to use the gas to send the message further, so we will check with what msg_value the message came, if it is very small (less than 0.01 TON), we will finish the execution of the smart contract with `return()`.

	#include "imports/stdlib.fc";

	() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {

	  if (msg_value < 10000000) { ;; 10000000 nanoton == 0.01 TON
		return ();
	  }
	  

	}

##### Get the address

To send a message back, you need to get the address of the person who sent it to us. To do this, you need to parse the `in_msg` cell.

In order for us to take the address, we need to convert the cell into a slice using `begin_parse`:

	var cs = in_msg_full.begin_parse();

Now we need to "subtract" the resulting slice to the address. Using the `load_uint` function from the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib) it loads an unsigned n-bit integer from the slice, "subtract" the flags.

	var flags = cs~load_uint(4);

In this lesson, we will not dwell on the flags in detail, but you can read more in paragraph [3.1.7] (https://ton-blockchain.github.io/docs/tblkch.pdf).

And finally, the address. Use `load_msg_addr()` - which loads from the slice the only prefix that is a valid MsgAddress.

	  slice sender_address = cs~load_msg_addr(); 
	  
Code:

	#include "imports/stdlib.fc";

	() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {

	  if (msg_value < 10000000) { ;; 10000000 nanoton == 0.01 TON
		return ();
	  }
	  
	  slice cs = in_msg.begin_parse();
	  int flags = cs~load_uint(4); 
	  slice sender_address = cs~load_msg_addr(); 

	}
	

##### Sending a message

Now you need to send a message back

##### Message structure

The full message structure can be found [here - message layout](https://ton-blockchain.github.io/docs/#/smart-contracts/messages?id=message-layout). But usually we don't need to control each field, so we can use the short form from [example](https://ton-blockchain.github.io/docs/#/smart-contracts/messages?id=sending-messages):

	 var msg = begin_cell()
		.store_uint(0x18, 6)
		.store_slice(addr)
		.store_coins(amount)
		.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
		.store_slice(message_body)
	  .end_cell();
As you can see, functions of the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib) are used to build the message. Namely, the "wrapper" functions of the Builder primitives (partially built cells, as you may remember from the first lesson). Consider:

`begin_cell()` - will create a Builder for the future cell
 `end_cell()` - will create a Cell (cell)
 `store_uint` - store uint in Builder
 `store_slice` - store the slice in the Builder
 `store_coins` - here the documentation means `store_grams` - used to store TonCoins. More details [here](https://ton-blockchain.github.io/docs/#/func/stdlib?id=store_grams).

##### Message body

In the body of the message we put `op` and our message `reply`, to put a message we need to do `slice`.

slice msg_text = "reply";

In the recommendations about the body of the message, there is a recommendation to add `op`, despite the fact that it will not carry any functionality here, we will add it.

In order for us to create a similar client-server architecture on smart contracts described in the recommendations, it is proposed to start each message (strictly speaking, the message body) with some `op` flag, which will identify what operation the smart contract should perform.

Let's put `op` equal to 0 in our message.

Now the code looks like this:

	#include "imports/stdlib.fc";

	() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {

	  if (msg_value < 10000000) { ;; 10000000 nanoton == 0.01 TON
		return ();
	  }
	  
	  slice cs = in_msg.begin_parse();
	  int flags = cs~load_uint(4); 
	  slice sender_address = cs~load_msg_addr(); 

	  slice msg_text = "reply"; 

	  cell msg = begin_cell()
		  .store_uint(0x18, 6)
		  .store_slice(sender_address)
		  .store_coins(100) 
		  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
		  .store_uint(0, 32)
		  .store_slice(msg_text) 
	  .end_cell();

	}

The message is ready, let's send it.

##### Message sending mode(mode)

To send messages, use `send_raw_message` from the [standard library](https://ton-blockchain.github.io/docs/#/func/stdlib?id=send_raw_message).

We have already collected the msg variable, it remains to figure out `mode`. Description of each mode is in [documentation](https://ton-blockchain.github.io/docs/#/func/stdlib?id=send_raw_message). Let's look at an example to make it clearer.

Let there be 100 coins on the balance of the smart contract and we receive an internal message with 60 coins and send a message with 10, the total fee is 3.

  `mode = 0` - balance (100+60-10 = 150 coins), send(10-3 = 7 coins)
  `mode = 1` - balance (100+60-10-3 = 147 coins), send(10 coins)
  `mode = 64` - balance (100-10 = 90 coins), send (60+10-3 = 67 coins)
  `mode = 65` - balance (100-10-3=87 coins), send (60+10 = 70 coins)
  `mode = 128` -balance (0 coins), send (100+60-3 = 157 coins)

As we choose `mode`, let's go to [documentation](https://docs.ton.org/develop/smart-contracts/messages#message-modes):

- We're sending a normal message, so mode 0.
- We will pay the commission for the transfer separately from the cost of the message, which means +1.
- We will also ignore any errors that occur during the processing of this message on the action phase, so +2.

We get `mode` == 3, the final smart contract:


	#include "imports/stdlib.fc";

	() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {

	  if (msg_value < 10000000) { ;; 10000000 nanoton == 0.01 TON
		return ();
	  }
	  
	  slice cs = in_msg.begin_parse();
	  int flags = cs~load_uint(4); 
	  slice sender_address = cs~load_msg_addr(); 

	  slice msg_text = "reply"; 

	  cell msg = begin_cell()
		  .store_uint(0x18, 6)
		  .store_slice(sender_address)
		  .store_coins(100) 
		  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
		  .store_uint(0, 32)
		  .store_slice(msg_text) 
	  .end_cell();

	  send_raw_message(msg, 3);
	}
	

##hexBoC

Before deploying a smart contract, you need to compile it into hexBoС, let's take the project from the previous tutorial.

Let's rename `main.fc` to `chatbot.fc` and write our smart contract into it.

Since we changed the filename, we need to upgrade `compile.ts` as well:

	import * as fs from "fs";
	import { readFileSync } from "fs";
	import process from "process";
	import { Cell } from "ton-core";
	import { compileFunc } from "@ton-community/func-js";

	async function compileScript() {

		const compileResult = await compileFunc({
			targets: ["./contracts/chatbot.fc"], 
			sources: (path) => readFileSync(path).toString("utf8"),
		});

		if (compileResult.status ==="error") {
			console.log("Error happend");
			process.exit(1);
		}

		const hexBoC = 'build/main.compiled.json';

		fs.writeFileSync(
			hexBoC,
			JSON.stringify({
				hex: Cell.fromBoc(Buffer.from(compileResult.codeBoc,"base64"))[0]
					.toBoc()
					.toString("hex"),
			})

		);

		console.log("Compiled, hexBoC:"+hexBoC);

	}

	compileScript();

Compile the smart contract with the `yarn compile` command.

You now have a `hexBoC` representation of the smart contract.

## Conclusion

In the next tutorial, we will write tests.

# Lesson 1 Simple Smart Contract
## Introduction

In this lesson, we will write your first smart contract in the test network of The Open Network in FUNC language, deploy* it to the test network using [Blueprint](https://github.com/ton-community/blueprint), and also test it using a message with the help of the Javascript library [ton](https://github.com/ton-core/ton).

  > *Deploy - the process of transferring to the network (in this case, the smart contract to the blockchain)
  
## Requirements

To complete this lesson, it is enough to install [Node.js](https://nodejs.org). It is preferable to install one of the latest versions, for example, version 18.

## Smart Contract

The smart contract that we will make should have the following functionality:
- Store an integer *total* in its data - a 64-bit unsigned number;
- Upon receiving an internal incoming message, the contract should take a 32-bit unsigned integer from the body of the message, add it to *total*, and save it in the contract data;
- The smart contract should provide a *get total* method allowing to return the value of *total*
- If the body of the incoming message is less than 32 bits, then the contract should throw an exception

## Let's Create a Project Using Blueprint

In the console, execute the following command:

```bash
npm create ton@latest
```

Next, follow the instructions. You will need to enter the project name, smart contract name, and optionally a stub for a simple contract. For our lesson, we will call the project `my-counter`, the smart contract `Counter` and we will choose to start with an empty contract in **FunC** language, which we will talk about a bit later.

```bash
? Project name my-counter
? First created contract name (PascalCase) Counter
? Choose the project template An empty contract (FunC)
```

Blueprint has created a simple project. Let's move to its directory:
```bash
cd my-counter
```

There you can see 4 folders:
- contracts;
- wrappers;
- scripts;
- tests;

At this stage, we are interested in the contracts and wrappers folders, where we will be writing code in FunС and a wrapper for it in TypeScript respectively.

##### What is FunC?

The high-level FunC language is used for programming smart contracts on TON. FunC programs are compiled into Fift assembly code, which generates the corresponding bytecode for the TON Virtual Machine (TVM) (Learn more about TVM [here](https://ton-blockchain.github.io/docs/tvm.pdf)). This bytecode (actually a cell tree, like any other data in the TON Blockchain) can then be used to create a smart contract in the blockchain or can be run on a local instance of TVM (TON Virtual Machine).

You can learn more about FunC [here](https://ton-blockchain.github.io/docs/#/smart-contracts/)

##### Let's Prepare a File for Our Code

Go to the contracts folder:

```bash
cd contracts
```

And open the counter.func file, on your screen you will see a smart contract with just one empty function. Now we are ready to start writing our first smart contract.
## External Methods

Smart contracts in the TON network have two reserved methods to which one can refer.

The first, `recv_external()` this function is executed when a request to the contract comes from the outside world, i.e. not from TON, for example, when we form a message ourselves and send it through the lite-client (About installing [lite-client](https://ton-blockchain.github.io/docs/#/compile?id=lite-client)).
The second, `recv_internal()` this function is executed within TON itself, for example, when some contract refers to ours.
 
> A lite-client (lightweight client) is software that connects to full nodes for interacting with the blockchain. They help users to access the blockchain and interact with it without the need to synchronize the entire blockchain.

`recv_internal()` suits our requirements.

In the `counter.fc` file, there is already a declared function without code:

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    ;; code will be here
}
```
 
>  ;;  double semicolon is a single-line comment syntax
 
The function accepts numbers with the contract balance, the sum of the incoming message, a cell with the original message, and a slice in_msg_body, in which only the body of the received message is stored. We also use the keyword impure.

`impure` is a keyword that indicates that the function modifies the data of the smart contract.

For example, we must specify the `impure` specifier if the function can change the storage of contracts, send messages, or generate an exception when some data is invalid and the function is intended to check this data.

Important: If impure is not specified and the result of the function call is not used, then the FunC compiler can remove this function call.

To understand what a slice is, let's discuss types in TON network smart contracts.

##### Cell, slice, builder, integer types in FunC

In our simple smart contract, we will use only four types:

- Cell - A TVM cell, consisting of 1023 bits of data and up to 4 references to other cells
- Slice - A partial representation of a TVM cell, used for parsing data from a cell
- Builder - A partially built cell, containing up to 1023 bits of data and up to four links; can be used to create new cells
- Integer - A signed 257-bit integer

More about types in FunC:
[briefly here](https://ton-blockchain.github.io/docs/#/smart-contracts/)
[in detail here in section 2.1](https://ton-blockchain.github.io/docs/fiftbase.pdf)

In simple terms, a cell is a sealed cell, a slice is when a cell can be read, and a builder is when you assemble a cell.

## Convert the Received Slice to Integer

To convert the received slice to Integer we add the following code:
`int n = in_msg_body~load_uint(32);` 

The `recv_internal()` function now looks like this:

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    int n = in_msg_body~load_uint(32);
}
```

`load_uint` is a function from the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib). It loads an n-bit unsigned integer from a slice.
## Persistent Data of a Smart Contract

To add the received variable to `total` and save the value in the smart contract, let's look at how the functionality for storing persistent data/storage in TON is implemented.

> Note: Don't confuse with TON Storage, the storage in the previous sentence is a convenient analogy.

The TVM virtual machine is stack-based, so a good practice for storing data in a contract would be to use a specific register, rather than storing this data "on top" of the stack.

The c4 register, of type Cell, is allocated for storing persistent data.

You can learn more about the registers [here](https://ton-blockchain.github.io/docs/tvm.pdf) in section 1.3

##### Let's Take Data from c4

To "retrieve" data from c4 we will need two functions from the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib).

Specifically:
`get_data` - takes a cell from the c4 register.
`begin_parse` - converts the cell to a slice.

We'll pass this value to the slice ds:

`slice ds = get_data().begin_parse();` 

And also, we'll convert this slice into a 64-bit Integer for summation in accordance with our task. (With the help of the already familiar `load_uint` function)

`int total = ds~load_uint(64);` 

Now our function will look like this:

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    int n = in_msg_body~load_uint(32);

    slice ds = get_data().begin_parse();
    int total = ds~load_uint(64);
}
```

##### Summation

For summing, we will use the binary operation of summing `+`  and assignment `=` 

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    int n = in_msg_body~load_uint(32);

    slice ds = get_data().begin_parse();
    int total = ds~load_uint(64);

    total += n;
}
```

##### Saving the Value

In order to save the persistent value, we need to perform four actions:

- Create a Builder for the future cell
- Write the value into it
- Create a Cell from the Builder
- Write the resulting cell to the register

We will do this again using functions from the [FunC standard library](https://ton-blockchain.github.io/docs/#/func/stdlib)

`set_data(begin_cell().store_uint(total, 64).end_cell());` 

`begin_cell()` - will create a Builder for the future cell
`store_uint()`- will write the total value
`end_cell()`- will create a Cell
`set_data()` - will write the cell to the c4 register

Result:

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    int n = in_msg_body~load_uint(32);

    slice ds = get_data().begin_parse();
    int total = ds~load_uint(64);

    total += n;

    set_data(begin_cell().store_uint(total, 64).end_cell());
}
```
## Exception Generation

All that's left to do in our internal function is to add an exception call if the received variable is not 32-bit.

For this, we will use [built-in](https://ton-blockchain.github.io/docs/#/func/builtins) exceptions.

Exceptions can be invoked by conditional primitives `throw_if` and `throw_unless` and unconditional `throw`.

We will use `throw_if` and pass any error code. To get the bitness, we use `slice_bits()`.

```func
throw_if(35, in_msg_body.slice_bits() < 32);
```

By the way, in the TON TVM virtual machine, there are standard exception codes, which will be very useful in tests. You can check them out [here](https://ton-blockchain.github.io/docs/#/smart-contracts/tvm_exit_codes).

Let's insert this at the beginning of the function:

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    throw_if(35, in_msg_body.slice_bits() < 32);

    int n = in_msg_body~load_uint(32);

    slice ds = get_data().begin_parse();
    int total = ds~load_uint(64);

    total += n;

    set_data(begin_cell().store_uint(total, 64).end_cell());
}
```

## Writing the Get Function

Any function in FunC corresponds to the following pattern:

`[<forall declarator>] <return_type><function_name(<comma_separated_function_args>) <specifiers>`

Let's write the get_total() function that returns an Integer and has a method_id specification (more on this later)
 
```func
int get_total() method_id {
    ;; code will be here
}
```

##### Method_id

The method_id specification allows calling the GET function by name from lite-client or ton-explorer.
Roughly speaking, all functions in TON have a numerical identifier, get methods are numbered according to the crc16 hashes of their names.

##### Taking Data from c4

So that the function returns total stored in the contract, we need to get data from the register, which we have already done:

 
```func
int get_total() method_id {
    slice ds = get_data().begin_parse();
    int total = ds~load_uint(64);

    return total;
}
````	

## The Entire Code of Our Smart Contract

```func
#include "imports/stdlib.fc";

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
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
```
## Writing a Typescript Contract Wrapper

We want to be able to interact with our smart contract. For this, we will write a so-called wrapper in Typescript (a typed version of Javascript).

Go to the wrappers directory of the project and open the Counter.ts file. Much of the wrapper is already present by default. Now we just need to supplement the part where contract data for deployment is set and add two functions for interaction: sending numbers to the contract and calling the get method get_total().

### Setting up data for deployment

These lines are responsible for what we want to set in the contract data (c4 cell):

```ts
export type CounterConfig = {};

export function counterConfigToCell(config: CounterConfig): Cell {
    return beginCell().endCell();
}
```

`CounterConfig` is an object, into which we can add values if needed, with which the contract will be initialized.
`counterConfigToCell` is a function that transforms this very object into a cell that is ready to be written into contract data for deployment.

In our case, only one 64-bit number should be in the contract data. We won't need CounterConfig, but we need to update the function.

The function returns only one cell, into which we write data for contract deployment. Let's add a 0 of 64-bit length to it:

```ts
return beginCell().storeUint(0, 64).endCell();
```

Now when creating a contract, the number 0 will immediately be in its data.

### Method for sending messages with numbers

Further down in the same file, the Counter class is initialized, where we can modify old and add new methods for interacting with the contract. By default, there are already methods for initializing the contract either from a config or from the address of an already deployed contract, as well as a ready method for deployment.

Let's add a method with which we can send a message to the contract to increase the total number.

> All wrapper methods that send messages should have a `send` prefix at the beginning.
> All wrapper methods that call get methods should have a `get` prefix at the beginning.

For convenience, we can copy the sendDeploy method, rename it to sendNumber, and then only change what we need.

```ts
async sendNumber(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
        value,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body: beginCell().endCell(),
    });
}
```

This method accepts provider and via objects, which determine where and from whom the message needs to be sent, respectively. Also, a number value is passed, which indicates how many Toncoin we want to attach to the sent message.

In the method body, the provider.internal() function is called, which sends a message to our contract. It takes the via object that we got earlier, as well as the parameters of the sent message. It's these parameters that we need to change now.

As we remember, our smart contract expects only one 32-bit number from the received message. Let's add an argument for our method and change the body parameter:

```ts
async sendNumber(provider: ContractProvider, via: Sender, value: bigint, number: bigint) {
    await provider.internal(via, {
        value,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body: beginCell().storeUint(number, 32).endCell(),
    });
}
```

It is always better to use the bigint type for numbers in smart contract wrappers, as it supports very large numbers and is more accurate than number.### Method for calling get_total

Let's add a method that will call get_total of our contract:

```ts
async getTotal(provider: ContractProvider) {
    // code will go here
}
```

It should no longer accept via and value parameters, as no messages are sent to the contract when calling get methods.

Let's add a call to get_total. To do this, use the `provider.get` function, which takes two parameters: the name of the get method and the arguments to pass to it. In our case, the name is "get_total", and the list of arguments is empty.

```ts
const result = (await provider.get('get_total', [])).stack;
```

Now let's return the number obtained as a result from our `getTotal` function:

```ts
return result.readBigNumber();
```

### Full Wrapper Code

```ts
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type CounterConfig = {};

export function counterConfigToCell(config: CounterConfig): Cell {
    return beginCell().storeUint(0, 64).endCell();
}

export class Counter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Counter(address);
    }

    static createFromConfig(config: CounterConfig, code: Cell, workchain = 0) {
        const data = counterConfigToCell(config);
        const init = { code, data };
        return new Counter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendNumber(provider: ContractProvider, via: Sender, value: bigint, number: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(number, 32).endCell(),
        });
    }

    async getTotal(provider: ContractProvider) {
        const result = (await provider.get('get_total', [])).stack;
        return result.readBigNumber();
    }
}
```

## Deploy the contract to the test network

For deployment to the test network, we will use the [Blueprint](https://github.com/ton-community/blueprint/) command-line interface, which was installed automatically when creating the project.

`npx blueprint run`

Then, follow the instructions. Select the test network - testnet. Then, a wallet authorization method is required, from which the deployment will be made. You can connect Tonkeeper or Tonhub, if you choose the first item TON Connect.
A QR code will appear in the console, which needs to be scanned from the application of your wallet on your phone. If this method does not suit you, you can use one of the other proposed methods.

After successfully connecting the wallet, you will probably need to confirm the sending of the transaction from the application. If you have done everything correctly, you will see a message in the console that the contract has been successfully deployed.
##### What if it says that there is not enough TON?

You need to get them from the test faucet, the bot for this is [@testgiver_ton_bot](https://t.me/testgiver_ton_bot).

To check whether TON has arrived in your wallet in the test network, you can use this explorer: https://testnet.tonscan.org/

> Important: We are only talking about the test network

## Checking the Contract

##### Calling recv_internal()

To call recv_internal() it is necessary to send a message within the TON network. For this, we created the `sendNumber` method in the wrapper. To use this method and send a message from the wallet, we will write a small Typescript script that will send a message to our contract using the wrapper.

##### Message Script

In the scripts folder, create a `sendNumber.ts` file and write the following code in it (most of which can be copied from the deployCounter.ts file in the same folder):

```ts
import { toNano } from 'ton-core';
import { Counter } from '../wrappers/Counter';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const counter = provider.open(Counter.createFromConfig({}, await compile('Counter')));

    // code will go here
}
```

This code declares a single function `run` where we can interact with our smart contract. For this, a `counter` object of the wrapper class, which we wrote above in this lesson, is created. Now let's add a call to the `sendNumber` method to the function:

```ts
await counter.sendNumber(provider.sender(), toNano('0.01'), 123n);
```

To run the script, again execute the command `npx blueprint run` in the console, but this time, select the required script - that is, `sendNumber`. Most likely, the wallet will already be connected from the time of deployment, so there is no need to go through authorization again.

If you see the inscription "**Sent transaction**" in the console, then our message to the contract has been sent. Now let's check if the number in the contract data has been updated using the `getTotal` method.

#### Get-method Script

Create another file in the scripts directory, for example `getTotal.ts`, and again copy the same code into it, but this time use our getTotal() method from the wrapper.

```ts
import { toNano } from 'ton-core';
import { Counter } from '../wrappers/Counter';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const counter = provider.open(Counter.createFromConfig({}, await compile('Counter')));

    console.log('Total:', await counter.getTotal());
}
```

Similarly, run the script using the command `npx blueprint run`, and after execution, you should see the inscription "**Total: 123n**" in the console.

## Congratulations, you have reached the end

##### Exercise

As you may have noticed, we didn't test the operation of exceptions, modify the message in the wrapper so that the smart contract calls an exception.

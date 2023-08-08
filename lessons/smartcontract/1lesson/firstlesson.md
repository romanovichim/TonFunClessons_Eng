# Lesson 1 Simple Smart Contract

## Introduction

In this lesson, we will write your first smart contract on the TON blockchain using the FunC language, deploy it to the test network using [Blueprint](https://github.com/ton-community/blueprint), and try to interact with it using the [ton](https://github.com/ton-core/ton) JavaScript library.

> \*Deploy - the process of transferring to the network (in this case, a smart contract to the blockchain)

## Requirements

To complete this lesson, you only need to install [Node.js](https://nodejs.org). It is recommended to install one of the latest versions, such as 18.

## Smart Contract

The smart contract we will create should have the following functionality:

-   Store an integer _total_ in its data - a 64-bit unsigned integer
-   When receiving an internal incoming message, the contract should take a 32-bit unsigned integer from the message body, add it to _total_, and save it in its data
-   The smart contract should have a method _get_total_ that allows you to retrieve the value of _total_
-   If the body of the incoming message is less than 32 bits, the contract should throw an exception

## Create a project using Blueprint

In the console, run the following command:

```bash
npm create ton@latest
```

Then simply follow the instructions. You will need to enter the project name, the name of the smart contract, and optionally choose a template for a simple contract. For our lesson, let's name the project `my-counter`, the smart contract `Counter`, and choose to start with an empty contract in the **FunC** language, which we will discuss a little later.

```bash
? Project name my-counter
? First created contract name (PascalCase) Counter
? Choose the project template An empty contract (FunC)
```

Blueprint will create a simple project. Go to its directory:

```bash
cd my-counter
```

There you will see 4 folders:

-   contracts
-   wrappers
-   scripts
-   tests

At this stage, we are interested in the _contracts_ and _wrappers_ folders, where we will write code in FunC and its TypeScript wrapper, respectively.

##### What is FunC?

For programming smart contracts on the TON blockchain, it is recommended to use the FunC language. You can learn more about it [in the documentation](https://docs.ton.org/develop/func/overview).

##### Prepare a file for our code

Go to the contracts folder:

```bash
cd contracts
```

And open the `counter.fc` file. On your screen, you will see a smart contract with just one empty function. Now we are ready to start writing our first smart contract.

## Smart Contract Functions

Smart contracts on the TON network have two main functions:

-   The first one, `recv_external()`, is executed when a request to the contract comes from the external world, i.e., not from TON. For example, when you use an application to access a wallet smart contract to transfer Toncoin to a friend, this request is made through `recv_external()`.
-   The second one, `recv_internal()`, is executed when a contract is accessed directly within the blockchain. For example, when another contract accesses ours.

In our case, `recv_internal()` is suitable.

The `counter.fc` file already has a declared function without code:

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    ;; code will be here
}
```

> ;; two semicolons denote a single-line comment

The function takes numbers with the contract balance, the value of the incoming message, a cell with the original message, and a slice in_msg_body that contains only the body of the received message. We also use the impure keyword.

`impure` is a keyword that tells the compiler that its execution cannot be removed during optimizations.

For example, we need to specify impure if a function can modify contract storage, send messages, or generate exceptions.

Important: If impure is not specified and the result of the function call is not used, the FunC compiler is free to remove this function call.

To understand what a slice and a cell are, let's talk about data types in TON.

##### Types cell, slice, builder, integer in FunC

In our simple smart contract, we will use only four types:

-   Cell - A TVM cell consisting of 1023 bits of data and up to 4 references to other cells. The presence of references forms a so-called "cell tree."
-   Slice - A partial representation of a TVM cell used to read data from a cell.
-   Builder - A partially constructed cell containing up to 1023 bits of data and up to four references. We can only write new data to this type of cell and then convert it to a regular Cell.
-   Integer - a signed 257-bit integer.

You can read more about FunC types in the [documentation](https://docs.ton.org/develop/func/types).

In simple terms, a cell is a sealed cell, a slice is a cell from which data can be read, and a builder is a cell to which data can be written.

## Reading an Integer from the Message Body

To read an Integer from the received slice with the message body, add the following code:
`int n = in_msg_body~load_uint(32);`

The `recv_internal()` function now looks like this:

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    int n = in_msg_body~load_uint(32);
}
```

`load_uint` is a function from the [standard FunC library](https://docs.ton.org/develop/func/stdlib/). It reads and returns an unsigned integer of a specified size from the slice.

## Smart Contract Data

To add the received variable to `total` and save the value in the smart contract, let's consider how the functionality of storing persistent data/storage is implemented in TON.

> Note: Do not confuse this with TON Storage; storage in the previous sentence is a convenient analogy.

The TVM virtual machine is stack-based, but in addition to the stack, it has special "registers" that store, for example, the code of a smart contract, the global blockchain configuration, and the data of a smart contract.

To store persistent data, register `c4` is allocated with the Cell type.

You can learn more about registers in the [documentation](https://docs.ton.org/learn/tvm-instructions/tvm-overview#control-registers).

##### Retrieve Data from c4

To "retrieve" data from c4, we need two functions from the [standard FunC library](https://docs.ton.org/develop/func/stdlib/).

Namely:
`get_data` - retrieves a cell from register c4.
`begin_parse` - converts a cell into a slice.

Let's create a variable `ds` and put the received slice into it.

`slice ds = get_data().begin_parse();`

Also, let's read the 64-bit number from this slice into the numeric variable `total` for summation according to our task. (Using the already familiar `load_uint` function)

`int total = ds~load_uint(64);`

Now our function looks like this:

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    int n = in_msg_body~load_uint(32);

    slice ds = get_data().begin_parse();
    int total = ds~load_uint(64);
}
```

##### Summing

To perform the summation, we will use the addition operation `+` and the assignment `=`.

```func
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    int n = in_msg_body~load_uint(32);

    slice ds = get_data().begin_parse();
    int total = ds~load_uint(64);

    total += n;
}
```

> Like in many other programming languages, in FunC, you can combine the `+` and `=` operations into `+=`. The same goes for `-=`, `/=`, `*=`.

##### Saving the Value

To save the value of `total` in the persistent data of the contract, we need to perform four actions:

-   Create a Builder for the future data cell
-   Write the value to this builder
-   Convert the builder to a cell
-   Write the resulting cell to register c4

We will do this again using functions from the [standard FunC library](https://docs.ton.org/develop/func/stdlib/).

`set_data(begin_cell().store_uint(total, 64).end_cell());`

`begin_cell()` - creates a Builder for the future cell
`store_uint()` - writes the value of total
`end_cell()` - creates a Cell from the builder
`set_data()` - writes the cell to register c4

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

## Generating Exceptions

All that remains to be done in our `recv_internal()` function is to add a call to an exception if the body of the received message does not have enough bits for a 32-bit number.

To do this, we will use the built-in exceptions from the [FunC built-ins](https://docs.ton.org/develop/func/builtins).

Exceptions can be triggered by conditional primitives `throw_if` and `throw_unless`, as well as by unconditional `throw`.

Let's use `throw_if` and pass any error code. To determine the bit length, we will use `slice_bits()`.

```func
throw_if(35, in_msg_body.slice_bits() < 32);
```

By the way, in TVM (TON Virtual Machine), there are standard exception codes, which we will need in the tests. You can see them [here](https://docs.ton.org/learn/tvm-instructions/tvm-exit-codes).

Insert at the beginning of the function:

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

Any function in FunC follows the following pattern:

`[<forall declarator>] <return_type><function_name(<comma_separated_function_args>) <specifiers>`

Let's write a function `get_total()` that returns an Integer and has the method_id specifier (we'll talk about this a little later).

```func
int get_total() method_id {
    ;; code will be here
}
```

##### method_id

The `method_id` specifier allows you to call a function by its name. It is mandatory for get methods.

##### Retrieve Data from c4

To make the function return `total` stored in the contract, we need to retrieve the data from the register, which we have already done:

```func
int get_total() method_id {
    slice ds = get_data().begin_parse();
    int total = ds~load_uint(64);

    return total;
}
```

## The Entire Code of Our Smart Contract

```func
#include "imports/stdlib.fc";

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    throw_if(35, in_msg_body.slice_bits() < 32);

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

## Writing a Wrapper for the Contract in TypeScript

We want to be able to interact with our smart contract. To do this, we will write a so-called wrapper in TypeScript (a typed JavaScript).

Go to the wrappers directory of the project and open the Counter.ts file. Most of the wrapper is already present by default. Now we just need to add the part where the contract data for deployment is set and add two functions for interaction: sending numbers to the contract and calling the get_total method.

### Set Deployment Data

These lines are responsible for what we want to set in the contract data (cell c4):

```ts
export type CounterConfig = {};

export function counterConfigToCell(config: CounterConfig): Cell {
    return beginCell().endCell();
}
```

`CounterConfig` is an object to which we can add values that will be used to initialize the contract.
`counterConfigToCell` is a function that converts the object itself into a cell ready to be written to the contract data for deployment.

In our case, the contract data should contain only one 64-bit number. We don't need the CounterConfig, but we do need to update the function.

The function returns only one cell, into which we write the data for deploying the contract. Let's add a record of a 64-bit number to it:

```ts
return beginCell().storeUint(0, 64).endCell();
```

Now, when creating a contract, it will already have the number 0 in its data.

### Method for Sending Messages with Numbers

Below, in the same file, the Counter class is initialized, in which we can modify existing methods or add new ones to interact with the contract. By default, it already has methods for initializing the contract from either a config or the address of an already deployed contract, as well as a ready-made method for deployment.

Let's add a method that allows us to send a message to the contract to increase the total number.

> All wrapper methods that send messages must have the `send` prefix at the beginning.
> All wrapper methods that call get methods must have the `get` prefix at the beginning.

For convenience, we can copy the sendDeploy method, rename it to sendNumber, and then only change what is needed.

```ts
async sendNumber(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
        value,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body: beginCell().endCell(),
    });
}
```

This method takes provider and via objects, which determine where and from whom the message should be sent, respectively. It also takes a value number, which means how many Toncoins we want to attach to the sent message.

The provider.internal() function is called in the method body, which sends a message to our contract. It takes the via object we obtained earlier, as well as the parameters of the sent message. These parameters are what we need to change now.

As we remember, our smart contract expects only one 32-bit number from the received message. Let's add an argument to our method and change the body parameter:

```ts
async sendNumber(provider: ContractProvider, via: Sender, value: bigint, number: bigint) {
    await provider.internal(via, {
        value,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body: beginCell().storeUint(number, 32).endCell(),
    });
}
```

It is better to always use the bigint type for numbers in smart contract wrappers, as it supports very large numbers and is more accurate than number.

### Method for Calling get_total

Let's add a method that will call get_total on our contract:

```ts
async getTotal(provider: ContractProvider) {
    // code will be here
}
```

It should no longer take the via and value parameters, as no messages are sent when calling get methods.

Let's add a call to get_total in our method. To do this, we will use the `provider.get` function, which takes two parameters: the name of the get method and the arguments to pass to it. In our case, the name is "get_total", and the argument list is empty.

```ts
const result = (await provider.get('get_total', [])).stack;
```

Now let's return the received number from our getTotal function:

```ts
return result.readBigNumber();
```

### The Entire Wrapper Code

```ts
import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
} from 'ton-core';

export type CounterConfig = {};

export function counterConfigToCell(config: CounterConfig): Cell {
    return beginCell().storeUint(0, 64).endCell();
}

export class Counter implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

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

    async sendNumber(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        number: bigint
    ) {
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

## Deploying the Contract to the Test Network

To deploy to the test network, we will use the command-line interface [Blueprint](https://github.com/ton-community/blueprint/), which was automatically installed when creating the project.

`npx blueprint run`

Then follow the instructions. Choose the test network - testnet. You will then need to choose a method of wallet authorization for deployment. You can connect Tonkeeper or Tonhub, or choose the first option, TON Connect.
A QR code will appear in the console, which you need to scan from your wallet application on your phone. If you don't like this method, you can use one of the other options provided.

After successfully connecting the wallet, you may need to confirm the transaction from the application. If you did everything correctly, you will see a message in the console that the contract has been successfully deployed.

##### What to do if it says there is not enough TON?

You need to get them from the test faucet, the bot for this is [@testgiver_ton_bot](https://t.me/testgiver_ton_bot).

To check if TON has been received to your wallet in the test network, you can use this explorer: https://testnet.tonscan.org/

> Important: This is only about the test network

## Testing the Contract

##### Calling recv_internal()

To call recv_internal(), you need to send a message within the TON network. For this purpose, we created the `sendNumber` method in the wrapper.
To use this method and send a message from your wallet to the contract, write a small TypeScript script that sends a message to our contract using the wrapper.

##### Message Script

Create a file `sendNumber.ts` in the scripts folder and write the following code in it (most of which can be copied from the deployCounter.ts file in the same folder):

```ts
import { toNano } from 'ton-core';
import { Counter } from '../wrappers/Counter';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const counter = provider.open(
        Counter.createFromConfig({}, await compile('Counter'))
    );

    // code will be here
}
```

This code declares the only function `run`, in which we can interact with our smart contract. An object `counter` of the wrapper class is created, which we wrote earlier in this lesson.
Now let's add a call to the `sendNumber` method in the function:

```ts
await counter.sendNumber(provider.sender(), toNano('0.01'), 123n);
```

To run the script, execute the command `npx blueprint run` in the console, but this time, choose the desired script - `sendNumber`. Most likely, the wallet will already be connected since the deployment, so you won't need to go through the authorization process again.

If you see the message "**Sent transaction**" in the console, our message has been sent to the contract. Now let's check if the number in the contract data has been updated using the `getTotal` method.

#### get_total Script

Create another file in the scripts directory, for example `getTotal.ts`, and copy the same code into it, but this time use our getTotal() method from the wrapper.

```ts
import { toNano } from 'ton-core';
import { Counter } from '../wrappers/Counter';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const counter = provider.open(
        Counter.createFromConfig({}, await compile('Counter'))
    );

    console.log('Total:', await counter.getTotal());
}
```

Similarly, run the script using the `npx blueprint run` command, and after execution, you should see the message "**Total: 123n**" in the console.

## Congratulations, you have reached the end

##### Task

As you may have noticed, we did not test the exception handling. Modify the message in the wrapper so that the smart contract does it.

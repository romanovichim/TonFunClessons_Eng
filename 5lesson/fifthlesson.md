# Lesson 5 Remembering the Address and Identifying the Operation

## Introduction

In this lesson, we will write a smart contract that can perform different operations depending on the flag in the TON blockchain using the FunC language, and we will test it in the next lesson.

## Requirements

To complete this lesson, you only need to install [Node.js](https://nodejs.org). It is recommended to install one of the latest versions, such as 18.

You should also be able to create/deploy a project using Blueprint. You can learn how to do this in the [first lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/1lesson/firstlesson.md).

## Op - Identifying the Operation

Before we consider what kind of smart contract we will create in this lesson, I suggest studying the [recommendations](https://docs.ton.org/develop/smart-contracts/guidelines/internal-messages) on the body of a smart contract message.

In order to create a client-server-like architecture on smart contracts, it is recommended to start each message (strictly speaking, the message body) with a 32-bit flag `op`, which will identify the operation that the smart contract should perform. The contract itself, based on the value of this flag, should perform the necessary operation and, if necessary, send a response message, which will also include some `op`.

In this lesson, we will create a smart contract that performs various actions depending on the `op`.

## Smart Contract

The task of the smart contract will be to remember the address set by the manager and report it to anyone who requests it, in particular the following functionality:

-   When the contract receives a message from the Manager with `op` equal to 1 followed by some `query_id`, followed by `MsgAddress`, it should save the received address in storage.
-   When the contract receives an internal message from any address with `op` equal to 2 followed by `query_id`, it should respond to the sender with a message body containing:
    -   `op` equal to 3
    -   the same `query_id`
    -   Manager's address
    -   The address that was remembered since the last manager request (empty address `addr_none` if there has not been a manager request yet)
    -   The TON value attached to the message minus the processing fee.
-   When the smart contract receives any other message, it should throw an exception.

**Note**: I decided to take ideas for smart contracts from the [FunC contest1](https://github.com/ton-blockchain/func-contest1) tasks, as they are very well suited for getting acquainted with TON smart contract development.

## Smart Contract Structure

##### External Method

To allow our proxy to receive messages, we will use the external method `recv_internal()`, as in previous lessons.

```func
() recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body)  {

}
```

##### Inside the Method

Inside the method, we will take `op`, `query_id`, and the sender's address `sender_address` from the function arguments, and then build the logic around `op` using conditional statements.

```func
() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
 ;; take op, query_id, and the sender's address sender_address

  if (op == 1) {
    ;; here we will save the address received from the manager
  } elseif (op == 2) {
      ;; send a message
  } else {
      ;; here will be an exception
  }
}
```

## Helper Functions

Let's think about what functionality we can extract into functions.

-   Comparing addresses to check if the request with op equal to 1 came from the Manager.
-   Loading and saving the manager's address and the address we store in the contract's persistent data.
-   Parsing the sender's address from the incoming message.

##### Comparing Addresses

FunC supports defining functions in assembly (referring to Fift). This is done as follows - we define a function as a low-level TVM primitive. For the comparison function, it will look like this:

```func
int equal_slices (slice a, slice b) asm "SDEQ";
```

As you can see, the `asm` keyword is used.

You can see the list of possible primitives in the [documentation](https://docs.ton.org/learn/tvm-instructions/instructions).

##### Loading Addresses from Persistent Data

We will store addresses in slices, but based on the task, we will need to store two addresses: the Manager's address, for verification, and the address that the manager will send for storage. Therefore, we will return the slices in a tuple.

To "retrieve" the persistent data, we will need two functions from the [FunC standard library](https://docs.ton.org/develop/func/stdlib/).

Namely:
`get_data` - retrieves a cell from the persistent data.
`begin_parse` - converts the cell into a slice.

Let's pass this value to the variable `ds`:

```func
var ds = get_data().begin_parse()
```

Load the manager's address from the message using `load_msg_addr()` - which loads the only prefix from the slice that is a valid MsgAddress. We have two of them, so we "subtract" twice.

```func
return (ds~load_msg_addr(), ds~load_msg_addr());
```

In the end, we get the following function:

```func
(slice, slice) load_data () inline {
  var ds = get_data().begin_parse();
  return (ds~load_msg_addr(), ds~load_msg_addr());
}
```

##### Inline

In previous lessons, we have already used the `inline` specifier, which essentially inserts the code at each call site of the function. In this lesson, let's consider why this is necessary from a practical point of view.

As we know from the [documentation](https://docs.ton.org/develop/smart-contracts/fees), the transaction fee consists of:

-   storage_fees - the fee for space in the blockchain.
-   in_fwd_fees - the fee for importing messages (this is the case when processing `external` messages).
-   computation_fees - the fee for executing TVM instructions.
-   action_fees - the fee associated with processing a list of actions (e.g., sending messages).
-   out_fwd_fees - the fee for importing outgoing messages.

More details [here](https://docs.ton.org/develop/smart-contracts/fees).
The `inline` specifier allows you to save **computation_fee**.

By default, when you have a FunC function, it gets its own identifier stored in a separate id->function dictionary, and when you call it somewhere in the program, the function is looked up in the dictionary and then jumped to.

The `inline` specifier, on the other hand, puts the body of the function directly into the parent function's code.

Therefore, if a function is used only once or twice, it is often much cheaper to declare this function as `inline`, i.e., inline it, as a reference jump is much cheaper than a dictionary lookup and jump.

##### Saving Addresses to Persistent Data

Of course, in addition to unloading, we also need loading. Let's create a function that saves the manager's address and the address that the manager will send:

```func
() save_data (slice manager_address, slice memorized_address) impure inline {

}
```

Note that the function has the [specifier](https://docs.ton.org/develop/func/functions#specifiers) `impure`. We must specify the `impure` specifier if the function can modify the contract's storage. Otherwise, the FunC compiler may remove this function call.

To "save" the persistent data, we will need functions from the [FunC standard library](https://docs.ton.org/develop/func/stdlib/).

Namely:

`begin_cell()` - creates a Builder for the future cell.
`store_slice()` - stores a Slice in the Builder.
`end_cell()` - creates a Cell.

`set_data()` - writes the cell to the persistent data.

Assemble the cell:

```func
begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell()
```

Load it into the contract's persistent data:

```func
set_data(begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell());
```

In the end, we get the following function:

```func
() save_data (slice manager_address, slice memorized_address) impure inline {
    set_data(begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell());
}
```

##### Parsing the Sender's Address from the Incoming Message

Let's declare a function that allows us to extract the sender's address from the message cell. The function will return a slice, as we will take the address using `load_msg_addr()`, which loads the only prefix from the slice that is a valid MsgAddress and returns it as a slice.

```func
slice parse_sender_address (cell in_msg_full) inline {
  return sender_address;
}
```

Now, using the already familiar `begin_parse`, let's convert the cell into a slice.

```func
slice parse_sender_address (cell in_msg_full) inline {
  var cs = in_msg_full.begin_parse();
  return sender_address;
}
```

Start "reading" the cell using `load_uint`, a function from the [FunC standard library](https://docs.ton.org/develop/func/stdlib/) that loads an n-bit unsigned integer from the slice.

In this lesson, we will not go into detail about the flags, but you can read more about them in the [documentation](https://docs.ton.org/develop/smart-contracts/messages#message-layout).
And finally, take the address.

In the end, we get the following function:

```func
slice parse_sender_address (cell in_msg_full) inline {
  var cs = in_msg_full.begin_parse();
  var flags = cs~load_uint(4);
  slice sender_address = cs~load_msg_addr();
  return sender_address;
}
```

## Intermediate Result

At this point, we have the ready-made helper functions and the body of the main function of this smart contract `recv_internal()`.

```func
#include "imports/stdlib.fc";

int equal_slices (slice a, slice b) asm "SDEQ";

(slice, slice) load_data () inline {
  var ds = get_data().begin_parse();
  return (ds~load_msg_addr(), ds~load_msg_addr());
}

() save_data (slice manager_address, slice memorized_address) impure inline {
  set_data(begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell());
}

slice parse_sender_address (cell in_msg_full) inline {
  var cs = in_msg_full.begin_parse();
  var flags = cs~load_uint(4);
  slice sender_address = cs~load_msg_addr();
  return sender_address;
}

() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
  int op = in_msg_body~load_int(32);
  int query_id = in_msg_body~load_uint(64);
  var sender_address = parse_sender_address(in_msg_full);

  if (op == 1) {
    (slice manager_address, slice memorized_address) = load_data();
    throw_if(1001, ~ equal_slices(manager_address, sender_address));
    slice new_memorized_address = in_msg_body~load_msg_addr();
    save_data(manager_address, new_memorized_address);
  } elseif (op == 2) {
    (slice manager_address, slice memorized_address) = load_data();
    var msg = begin_cell()
        .store_uint(0x10, 6)
        .store_slice(sender_address)
        .store_grams(0)
        .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
        .store_uint(3, 32)
        .store_uint(query_id, 64)
        .store_slice(manager_address)
        .store_slice(memorized_address)
      .end_cell();
    send_raw_message(msg, 64);
  } else {
    throw(3);
  }
}
```

Now we just need to fill in `recv_internal()`.

## Filling in the External Method

##### Taking op, query_id, and the sender's address

We read op and query_id from the message body accordingly. According to the [recommendations](https://docs.ton.org/develop/smart-contracts/guidelines/internal-messages), these are 32-bit and 64-bit values.

Also, using the function `parse_sender_address()` that we wrote earlier, we take the sender's address.

```func
() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
int op = in_msg_body~load_int(32);
int query_id = in_msg_body~load_uint(64);
var sender_address = parse_sender_address(in_msg_full);

  if (op == 1) {
    ;; here we will save the address received from the manager
  } elseif (op == 2) {
    ;; send a message
  } else {
    ;; here will be an exception
  }
}
```

##### Flag op == 1

According to the task, when the flag is 1, we should receive the manager's address and the saved address, check if the sender's address is equal to the manager's address (only the manager can change the address), and save the new address that is stored in the message body.

Load the manager's address `manager_address` and the saved address `memorized_address` from the persistent data using the `load_data()` function we wrote earlier.

```func
(slice manager_address, slice memorized_address) = load_data();
```

Using the `equal_slices` function and the unary operator `~`, which is a bitwise NOT, check the equality of the addresses, throwing an exception if the addresses are not equal.

```func
throw_if(1001, ~ equal_slices(manager_address, sender_address));
```

Take the address using `load_msg_addr()` and save the addresses using the `save_data()` function we wrote earlier.

```func
slice new_memorized_address = in_msg_body~load_msg_addr();
save_data(manager_address, new_memorized_address);
```

##### Flag op == 2

According to the task, when the flag is 2, we should send a message with a body containing:

-   `op` equal to 3
-   the same `query_id`
-   Manager's address
-   The address that was remembered since the last manager request (empty address `addr_none` if there has not been a manager request yet)
-   The TON value attached to the message minus the processing fee.

Before sending the message, load the addresses stored in the contract.

```func
(slice manager_address, slice memorized_address) = load_data();
```

You can familiarize yourself with the complete message structure [here - message layout](https://docs.ton.org/develop/smart-contracts/messages#message-layout). But usually, we don't need to control each field, so we can use the short form from the [example](https://docs.ton.org/develop/smart-contracts/messages):

```func
var msg = begin_cell()
    .store_uint(0x10, 6)
    .store_slice(sender_address)
    .store_grams(0)
    .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    .store_uint(3, 32)
    .store_uint(query_id, 64)
    .store_slice(manager_address)
    .store_slice(memorized_address)
  .end_cell();
```

Send the message according to the conditions:

```func
send_raw_message(msg, 64);
```

##### Exception

Here it is simple, we use the regular `throw` from the [built-in FunC modules](https://docs.ton.org/develop/func/builtins#throwing-exceptions).

```func
throw(3);
```

## Complete Smart Contract Code

```func
#include "imports/stdlib.fc";

int equal_slices (slice a, slice b) asm "SDEQ";

(slice, slice) load_data () inline {
  var ds = get_data().begin_parse();
  return (ds~load_msg_addr(), ds~load_msg_addr());
}

() save_data (slice manager_address, slice memorized_address) impure inline {
  set_data(begin_cell().store_slice(manager_address).store_slice(memorized_address).end_cell());
}

slice parse_sender_address (cell in_msg_full) inline {
  var cs = in_msg_full.begin_parse();
  var flags = cs~load_uint(4);
  slice sender_address = cs~load_msg_addr();
  return sender_address;
}

() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
  int op = in_msg_body~load_int(32);
  int query_id = in_msg_body~load_uint(64);
  var sender_address = parse_sender_address(in_msg_full);

  if (op == 1) {
    (slice manager_address, slice memorized_address) = load_data();
    throw_if(1001, ~ equal_slices(manager_address, sender_address));
    slice new_memorized_address = in_msg_body~load_msg_addr();
    save_data(manager_address, new_memorized_address);
  } elseif (op == 2) {
    (slice manager_address, slice memorized_address) = load_data();
    var msg = begin_cell()
        .store_uint(0x10, 6)
        .store_slice(sender_address)
        .store_grams(0)
        .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
        .store_uint(3, 32)
        .store_uint(query_id, 64)
        .store_slice(manager_address)
        .store_slice(memorized_address)
      .end_cell();
    send_raw_message(msg, 64);
  } else {
    throw(3);
  }
}
```

## TypeScript Wrapper

To interact with our smart contract conveniently, let's write a TypeScript wrapper. The base for it is already provided by Blueprint.

### Contract Data Config

Open the file `wrappers/AddressSaver.ts` (the file name may be different depending on how you created the project).
Let's start with changes to the data config. Our contract contains two values in its data: the manager's address and the saved address. Let the saved address be empty by default (an empty address can be written as two zeros, i.e., uint2 with a value of 0). Add these values to the config:

```ts
export type AddressSaverConfig = {
    manager: Address;
};

export function addressSaverConfigToCell(config: AddressSaverConfig): Cell {
    return beginCell().storeAddress(config.manager).storeUint(0, 2).endCell();
}
```

Now let's move on to the `AddressSaver` class to add methods for calling the operations we need.

### Method for Calling op = 1

When calling the operation with code 1, we should put op=1, query_id, and the new address that we want to save in the contract in the message body. Let's name the method `sendChangeAddress` (I remind you that methods that send messages to the contract must have the `send` prefix).

```ts
async sendChangeAddress(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint, newAddress: Address) {
    await provider.internal(via, {
        value,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body: beginCell().storeUint(1, 32).storeUint(queryId, 64).storeAddress(newAddress).endCell(),
    });
}
```

### Method for Calling op = 2

This operation does not require any additional data except op=2 and query_id. Let's name the method `sendRequestAddress`.

```ts
async sendRequestAddress(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint) {
    await provider.internal(via, {
        value,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body: beginCell().storeUint(2, 32).storeUint(queryId, 64).endCell(),
    });
}
```

## Conclusion

We will write tests in the next lesson. I also wanted to say a special thank you to those who donate TON to support the project, it is very motivating and helps to release lessons faster.

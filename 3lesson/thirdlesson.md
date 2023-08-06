# Lesson 3 Proxy Smart Contract

## Introduction

In this lesson, we will write a proxy smart contract in the TON blockchain using the FunC language and test it in the next lesson.

## Requirements

To complete this lesson, you only need to install [Node.js](https://nodejs.org). It is recommended to install one of the latest versions, such as 18.

You should also be able to create/deploy a project using Blueprint. You can learn how to do this in the [first lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/1lesson/firstlesson.md).

## Smart Contract

The smart contract we will create should have the following functionality:

-   Forward all incoming messages to the contract owner
-   When forwarding, the sender's address should come first, followed by the original message body
-   The value of Toncoin attached to the forwarded message should be equal to the value of the incoming message minus fees
-   The owner's address is stored in the smart contract's storage
-   When a message is sent to the contract by the owner, it should not be forwarded

I decided to take ideas for smart contracts from the [FunC contest1](https://github.com/ton-blockchain/func-contest1) tasks, as they are very suitable for getting acquainted with smart contract development for TON.

## External Method

To enable our contract to receive messages, we will use the `recv_internal()` function, which will already be present in the FunC code file after creating the project.

    () recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body)  {

    }

## Sender's Address

According to the task, we need to take the sender's address. We will extract the address from the incoming message cell `in_msg_full`. Let's move the code for this action to a separate function.

    () recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
      slice sender_address = parse_sender_address(in_msg_full);
    }

##### Writing the Function

Let's write the code for the `parse_sender_address` function, which takes the sender's address from the message cell and break it down:

    slice parse_sender_address (cell in_msg_full) inline {
      var cs = in_msg_full.begin_parse();
      var flags = cs~load_uint(4);
      slice sender_address = cs~load_msg_addr();
      return sender_address;
    }

As you can see, the function has the `inline` specifier, which means that its code is actually inserted at each call site. This specifier is useful when a function is only called in a single place.

To extract the address, we need to convert the cell to a slice using `begin_parse`:

    var cs = in_msg_full.begin_parse();

Now we need to skip the first 4 bits in this slice, which are reserved for message flags. We can use the `load_uint` function from the [FunC standard library](https://docs.ton.org/develop/func/stdlib/), which loads an unsigned integer of size N bits from the slice.

    var flags = cs~load_uint(4);

In this lesson, we won't go into detail about the flags, but you can read more about them in the [documentation](https://docs.ton.org/develop/smart-contracts/messages#message-layout).

And finally, the address. We will use `load_msg_addr()`, which loads a prefix from the slice that is a valid `MsgAddress` (address).

    slice sender_address = cs~load_msg_addr();
    return sender_address;

## Recipient's Address

We will take the address from the contract's data. We have already discussed this in previous lessons.

We will use:
`get_data` - retrieves a cell from the contract's data.
`begin_parse` - converts the cell to a slice.
`load_msg_addr()` - loads a prefix from the slice that is a valid `MsgAddress`.

As a result, we get the following function:

    slice load_data () inline {
      var ds = get_data().begin_parse();
      return ds~load_msg_addr();
    }

We just need to call it:

    slice load_data () inline {
      var ds = get_data().begin_parse();
      return ds~load_msg_addr();
    }

    slice parse_sender_address (cell in_msg_full) inline {
      var cs = in_msg_full.begin_parse();
      var flags = cs~load_uint(4);
      slice sender_address = cs~load_msg_addr();
      return sender_address;
    }

    () recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
      slice sender_address = parse_sender_address(in_msg_full);
      slice owner_address = load_data();
    }

## Check Equality of Addresses

According to the task, the proxy should not forward a message if it comes from the owner. Therefore, we need to compare two addresses.

##### Comparison Function

Some functions are not declared in the standard library, so they have to be manually declared using [TVM instructions](https://docs.ton.org/learn/tvm-instructions/instructions).

FunC supports defining a function in assembly (referring to Fift). This is done by defining the function as a low-level TVM primitive. For the comparison function, it will look like this:

    int equal_slices (slice a, slice b) asm "SDEQ";

As you can see, the `asm` keyword is used.

##### Unary Operator

Now we will use our `equal_slices` function in an `if` statement:

    () recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
      slice sender_address = parse_sender_address(in_msg_full);
      slice owner_address = load_data();

      if  equal_slices(sender_address, owner_address) {

       }
    }

But the function checks for equality, how do we check for inequality? Here the unary operator `~` can help, which is the bitwise "not".

Now our code looks like this:

    int equal_slices (slice a, slice b) asm "SDEQ";

    slice load_data () inline {
      var ds = get_data().begin_parse();
      return ds~load_msg_addr();
    }

    slice parse_sender_address (cell in_msg_full) inline {
      var cs = in_msg_full.begin_parse();
      var flags = cs~load_uint(4);
      slice sender_address = cs~load_msg_addr();
      return sender_address;
    }

    () recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
      slice sender_address = parse_sender_address(in_msg_full);
      slice owner_address = load_data();

      if ~ equal_slices(sender_address, owner_address) {

       }
    }

## Sending a Message

Now we just need to fill in the body of the conditional statement according to the task, which is to send the incoming message.

##### Message Structure

You can familiarize yourself with the full message structure [here](https://docs.ton.org/develop/smart-contracts/messages#message-layout). But usually we don't need to control every field, so we can use the concise form from the [example](https://docs.ton.org/develop/smart-contracts/messages):

     var msg = begin_cell()
    	.store_uint(0x18, 6)
    	.store_slice(addr)
    	.store_coins(amount)
    	.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    	.store_slice(message_body)
      .end_cell();

As you can see, to build the message, we use functions from the [FunC standard library](https://docs.ton.org/develop/func/stdlib/). Specifically, the functions of the Builder primitives (partially constructed cells, as you may remember from the first lesson). Let's take a look:

`begin_cell()` - creates a Builder for the future cell
`end_cell()` - creates a cell
`store_uint` - stores a uint in the Builder
`store_slice` - stores a slice in the Builder
`store_coins` - here in the documentation it refers to `store_grams`, which is used to write the amount of Toncoin or other currencies. More details [here](https://docs.ton.org/develop/func/stdlib/#store_grams).

And let's also take a closer look at `store_ref`, which will be needed to send the address.

`store_ref` - Stores a reference to a cell in the Builder

Now that we have all the necessary information, let's assemble the message.

##### The Final Touch - Incoming Message Body

To send the body that came in `recv_internal` as part of the message, let's build a cell and make a reference to it in the message using `store_ref`.

      if ~ equal_slices(sender_address, owner_address) {
        cell msg_body_cell = begin_cell().store_slice(in_msg_body).end_cell();
      }

##### Assembling the Message

According to the task, we should send the address and the message body in the message. Therefore, we will change `.store_slice(message_body)` to `.store_slice(sender_address)` and `.store_ref(msg_body_cell)` in the _msg_ variable. We get:

      if ~ equal_slices(sender_address, owner_address) {
    	cell msg_body_cell = begin_cell().store_slice(in_msg_body).end_cell();

    	var msg = begin_cell()
            .store_uint(0x10, 6)
            .store_slice(owner_address)
            .store_grams(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_slice(sender_address)
            .store_ref(msg_body_cell)
        .end_cell();
       }

All that remains is to send our message.

##### Message Sending Mode (mode)

To send messages, we use `send_raw_message` from the [standard library](https://docs.ton.org/develop/func/stdlib/#send_raw_message).

We have already assembled the msg variable, now let's understand the `mode`. The description of each mode is in the [documentation](https://docs.ton.org/develop/func/stdlib/#send_raw_message). Let's consider an example to make it clearer.

Let's say the smart contract has a balance of 100 coins, and we receive an internal message with 60 coins and send a message with 10 coins. Let's assume the total fee is 3 for the example.

`mode = 0` - balance 100+60-10 = **150** coins, send 10-3 = **7** coins
`mode = 1` - balance 100+60-10-3 = **147** coins, send **10** coins
`mode = 64` - balance 100-10 = **90** coins, send 60+10-3 = **67** coins
`mode = 65` - balance 100-10-3 = **87** coins, send 60+10 = **70** coins
`mode = 128` - balance **0** coins, send 100+60-3 = **157** coins

The modes 1 and 65 mentioned above are `mode' = mode + 1`.

Since according to the task, the value of Toncoin attached to the message should be equal to the value of the incoming message minus processing fees, the mode `mode = 64` with `.store_grams(0)` suits us. Using the example, we get the following:

Let's assume the smart contract has a balance of 100 coins, and we receive an internal message with 60 coins and send a message with 0 (since `.store_grams(0)`), the total fee is 3.

`mode = 64` - balance (100 = 100 coins), send (60-3 = 57 coins)

Thus, our conditional statement will look like this:

       if ~ equal_slices(sender_address, owner_address) {
    	cell msg_body_cell = begin_cell().store_slice(in_msg_body).end_cell();

    	var msg = begin_cell()
    		  .store_uint(0x10, 6)
    		  .store_slice(owner_address)
    		  .store_grams(0)
    		  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    		  .store_slice(sender_address)
    		  .store_ref(msg_body_cell)
    		  .end_cell();
    	 send_raw_message(msg, 64);
       }

And the complete code of the smart contract:

    #include "imports/stdlib.fc";

    int equal_slices (slice a, slice b) asm "SDEQ";

    slice load_data () inline {
      var ds = get_data().begin_parse();
      return ds~load_msg_addr();
    }

    slice parse_sender_address (cell in_msg_full) inline {
      var cs = in_msg_full.begin_parse();
      var flags = cs~load_uint(4);
      slice sender_address = cs~load_msg_addr();
      return sender_address;
    }

    () recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
      slice sender_address = parse_sender_address(in_msg_full);
      slice owner_address = load_data();

      if ~ equal_slices(sender_address, owner_address) {
    	cell msg_body_cell = begin_cell().store_slice(in_msg_body).end_cell();

    	var msg = begin_cell()
    		  .store_uint(0x10, 6)
    		  .store_slice(owner_address)
    		  .store_grams(0)
    		  .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
    		  .store_slice(sender_address)
    		  .store_ref(msg_body_cell)
    		  .end_cell();
    	 send_raw_message(msg, 64);
       }
    }

## TypeScript Wrapper

To conveniently interact with our smart contract, let's write a TypeScript wrapper. The base for it is already provided by Blueprint.

Open the `wrappers/Proxy.ts` file (the file name may be different depending on how you created the project).
We only need to change the assembly of the contract's data from the config. Our contract contains a single value in its data - the owner's address. Let's add this value to the config:

```ts
export type ProxyConfig = {
    owner: Address;
};

export function proxyConfigToCell(config: ProxyConfig): Cell {
    return beginCell().storeAddress(config.owner).endCell();
}
```

Great! We don't need to change anything else except the data. The smart contract works with any messages, and we don't need to write a wrapper for them.

## Conclusion

In this lesson, we have implemented a simple proxy contract in FunC. We will test it in the next lesson!

For homework, try deploying the smart contract to the real TON network (or testnet) using a script, as we did in the first lesson, and then send simple transfers with different amounts and comments to it from your wallet.

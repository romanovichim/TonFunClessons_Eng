# Lesson 7 Hashmap or Dictionary

## Introduction

In this lesson, we will write a smart contract that can perform various operations with a Hashmap - a dictionary, on the TON blockchain using the FunC language, and test it in the next lesson.

## Requirements

To complete this lesson, you only need to install [Node.js](https://nodejs.org). It is recommended to install one of the latest versions, such as 18.

You should also be able to create/deploy a project using Blueprint. You can learn how to do this in the [first lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/1lesson/firstlesson.md).

## Hashmap or Dictionaries

A Hashmap is a data structure represented by a tree. Hashmap maps keys to values of any type, allowing for fast search and modification. In FunC, hashmaps are [represented by a cell](https://docs.ton.org/develop/func/stdlib/#dictionaries-primitives).

## Smart Contract

The task of the smart contract will be to add and remove data from the key/value storage of the Hashmap, with the following functionality:

-   When the smart contract receives a message with the following structure, it should add a new key/value entry to its data:
    -   32-bit unsigned `op` equal to 1
        -   64-bit unsigned `query_id`
        -   256-bit unsigned key
        -   64-bit `valid_until` unixtime
        -   remaining slice value
-   The message for removing outdated data has the following structure: - 32-bit unsigned `op` equal to 2 - 64-bit unsigned `query_id`
    When receiving such a message, the contract should remove all outdated entries from its data (with `valid_until` < now()). It should also check that there are no extra data in the message other than the 32-bit unsigned `op` and 64-bit unsigned `query_id`.
-   For all other internal messages, an error should be thrown.
-   A Get method `get_key` should be implemented, which takes a 256-bit unsigned key and should return an integer `valid_until` and a slice value for that key. If there is no entry for that key, an error should be thrown.
-   Important! We assume that the contract starts with an empty storage.

The contract skeleton is as follows:
```cpp
    #include "imports/stdlib.fc";

    () recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
    	int op = in_msg_body~load_uint(32);
    	int query_id = in_msg_body~load_uint(64);

    	cell data = get_data();
    	slice ds = data.begin_parse();
    	cell dic = ds.slice_bits() == 0 ? new_dict() : data;
    	if (op == 1) {
    	;; add new entry here
    	}
    	if (op == 2) {
    	;; delete here
    	}
    	throw (1001);
    }
```

# op = 1

When `op` is equal to one, we add a value to the hashmap. According to the task, we need to:

-   extract the key from the message body
-   set the value in the hashmap using the key and message body
-   save the hashmap
-   end the function execution to avoid the exception declared at the end of recv_internal()

##### Extract the key

Here, everything is the same as before, we use the `load_uint` function from the [FunC standard library](https://docs.ton.org/develop/func/stdlib/) to load an unsigned integer of n bits from the slice.

    	if (op == 1) {
    		int key = in_msg_body~load_uint(256);
    	}

##### Work with the hashmap

To add data, we will use `dict_set`, which sets the value associated with the key index key of n-bitness in the dict dictionary, in the slice, and returns the resulting dictionary.

```cpp
    if (op == 1) { ;; add new entry
    	int key = in_msg_body~load_uint(256);
    	dic~udict_set(256, key, in_msg_body);

    }
```
##### Save the dictionary

Using the `set_data()` function, we will write the cell with the hashmap to the permanent data.


   ```cpp
    
    if (op == 1) { ;; add new entry
    	int key = in_msg_body~load_uint(256);
    	dic~udict_set(256, key, in_msg_body);
    	set_data(dic);

    }


```

##### End the function execution

Here, it's simple, we use the `return` statement. The final code for `op`=1 is as follows:

```cpp
    if (op == 1) { ;; add new entry
    	int key = in_msg_body~load_uint(256);
    	dic~udict_set(256, key, in_msg_body);
    	set_data(dic);
    	return ();
    }

```

# op = 2

Here, our task is to remove all outdated entries from our data (with `valid_until` < `now()`). To iterate over the hashmap, we will use a loop. FunC has three [loops](https://docs.ton.org/develop/func/statements#loops): `repeat`, `until`, `while`.

Since we have already read `op` and `query_id`, we will check here that there is nothing in the in_msg_body slice using `end_parse()`.

`end_parse()` - Checks if the slice is empty. If not, throws an exception.

    if (op == 2) {
    	in_msg_body.end_parse();
    }

For our case, we will use the `until` loop.

    if (op == 2) {
    	do {

    	} until ();
    }

To check the condition `valid_until` < `now()` at each step, we need to obtain a minimum key from our hashmap. For this purpose, the [FunC standard library](https://docs.ton.org/develop/func/stdlib/#dict_set) provides the function `udict_get_next?`.

`udict_get_next?` - Computes the minimum key k in the dict dictionary that is greater than some specified value and returns k, the associated value, and a flag indicating success. If the dictionary is empty, returns (null, null, 0).

Therefore, we set the value from which we will take the minimum key before the loop, and inside the loop, we use the flag indicating success.

    if (op == 2) {
    	int key = -1;
    	do {
    		(key, slice cs, int f) = dic.udict_get_next?(256, key);

    	} until (~ f);
    }

Now, using a conditional statement, we will check the condition `valid_until` < `now()`. We subtract the value of `valid_until` from the `slice cs`.

    if (op == 2) {
    	int key = -1;
    	do {
    		(key, slice cs, int f) = dic.udict_get_next?(256, key);
    		if (f) {
    			int valid_until = cs~load_uint(64);
    			if (valid_until < now()) {
    					;; delete here
    			}
    		}
    	} until (~ f);
    }

To delete from the hashmap, we will use `udict_delete?`.

`udict_delete?` - Deletes the index with the key k from the dict dictionary. If the key is present, returns the modified dictionary (hashmap) and a success flag of -1. Otherwise, returns the original dictionary dict and 0.

We get:

    if (op == 2) {
    	int key = -1;
    	do {
    		(key, slice cs, int f) = dic.udict_get_next?(256, key);
    		if (f) {
    			int valid_until = cs~load_uint(64);
    			if (valid_until < now()) {
    				dic~udict_delete?(256, key);
    			}
    		}
    	} until (~ f);

    }

##### Save the dictionary

Using `dict_empty?`, we check if the hashmap has become empty after our manipulations in the loop.

If there are values, we save our hashmap to the permanent data. If not, we put an empty cell there using the combination of `begin_cell().end_cell()` functions.

    if (dic.dict_empty?()) {
    		set_data(begin_cell().end_cell());
    	} else {
    		set_data(dic);
    	}

##### End the function execution

Here, it's simple, we use the `return` statement. The final code for `op`=2 is as follows:

    if (op == 2) {
    	int key = -1;
    	do {
    		(key, slice cs, int f) = dic.udict_get_next?(256, key);
    		if (f) {
    			int valid_until = cs~load_uint(64);
    			if (valid_until < now()) {
    				dic~udict_delete?(256, key);
    			}
    		}
    	} until (~ f);

    	if (dic.dict_empty?()) {
    		set_data(begin_cell().end_cell());
    	} else {
    		set_data(dic);
    	}

    	return ();
    }

## Get Method

The `get_key` method should return `valid_until` and the data slice for the given key. According to the task, we need to:

-   retrieve the data from the permanent data
-   find the data by key
-   throw an error if the data does not exist
-   read `valid_until`
-   return the data

##### Retrieve the permanent data

To load the data, we will write a separate function `load_data()`, which checks if there is any data and returns either an empty dictionary `new_dict()` or the permanent data. We will check it using `slice_bits()`, which returns the number of bits of data in the slice.

    cell load_data() {
    	cell data = get_data();
    	slice ds = data.begin_parse();
    	if (ds.slice_bits() == 0) {
    		return new_dict();
    	} else {
    		return data;
    	}
    }

Now, we will call this function in the get method.

    (int, slice) get_key(int key) method_id {
    	cell dic = load_data();

    }

##### Find the data by key

To find the data by key, we will use the `udict_get?` function.

`udict_get?` - Looks up the key index in the dict dictionary. If successful, returns the found value as a slice, along with a success flag of -1. If unsuccessful, returns (null, 0).

We get:

    (int, slice) get_key(int key) method_id {
    	cell dic = load_data();
    	(slice payload, int success) = dic.udict_get?(256, key);

    }

##### Throw an error if the data does not exist

The `udict_get?` function returns a convenient flag, which we placed in `success`.
Using `throw_unless`, we will throw an exception.

    (int, slice) get_key(int key) method_id {
    	cell dic = load_data();
    	(slice payload, int success) = dic.udict_get?(256, key);
    	throw_unless(98, success);

    }

##### Read `valid_until` and return the data

Here, it's simple, we subtract `valid_until` from the `payload` variable and return both variables.

    (int, slice) get_key(int key) method_id {
    	cell dic = load_data();
    	(slice payload, int success) = dic.udict_get?(256, key);
    	throw_unless(98, success);

    	int valid_until = payload~load_uint(64);
    	return (valid_until, payload);
    }

## TypeScript Wrapper

To interact conveniently with our smart contract, let's write a TypeScript wrapper. The base for it is already provided by Blueprint.

### Contract Data Configuration

Open the file `wrappers/Hashmap.ts` (the filename may be different depending on how you created the project).
The data configuration remains empty, as intended.

```ts
export type HashmapConfig = {};

export function hashmapConfigToCell(config: HashmapConfig): Cell {
    return beginCell().endCell();
}
```

Now let's move on to the `Hashmap` class to add methods for calling the necessary operations.

### Method for calling op = 1

When calling an operation with code 1, we need to put op=1, query_id, key, valid_until, and the value itself in the message body. Let's name the method `sendSet`.

```ts
async sendSet(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    opts: {
        queryId: bigint;
        key: bigint;
        value: Slice;
        validUntil: bigint;
    }
) {
    await provider.internal(via, {
        value,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body: beginCell()
            .storeUint(1, 32)
            .storeUint(opts.queryId, 64)
            .storeUint(opts.key, 256)
            .storeUint(opts.validUntil, 64)
            .storeSlice(opts.value)
            .endCell(),
    });
}
```

### Method for calling op = 2

This operation does not require additional data other than op=2 and query_id. Let's name the method `sendClearOldValues`.

```ts
async sendClearOldValues(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    opts: {
        queryId: bigint;
    }
) {
    await provider.internal(via, {
        value,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body: beginCell().storeUint(2, 32).storeUint(opts.queryId, 64).endCell(),
    });
}
```

### Method for calling the getter get_key

This method will be slightly more complicated than the one we wrote in one of the early lessons because it should return two values. Such a type in TypeScript can be defined as an array `[bigint, Slice]`. And `Promise<>` is needed because the function is asynchronous (the `async` keyword before its name).

We call `provider.get` and store the result stack in the `result` constant. Then we can read the obtained values from there for returning from the function. With the first value, everything is simple - we use `readBigNumber()` to read the `bigint` (which was `int` in FunC). But with the second value, a problem arises: the library does not provide a separate method for reading a slice (something like `readSlice()`). Therefore, we have to use `peek()`, which reads the next value, ignoring its type, and explicitly specify to the compiler that it is `TupleItemSlice`, and then get the value from it.

```ts
async getByKey(provider: ContractProvider, key: bigint): Promise<[bigint, Slice]> {
    const result = (await provider.get('get_key', [{ type: 'int', value: key }])).stack;
    return [result.readBigNumber(), (result.peek() as TupleItemSlice).cell.asSlice()];
}
```

## Conclusion

I would like to say a special thank you to those who donate to support the project. It is very motivating and helps to release lessons faster. If you want to help the project (release lessons faster, translate all this into English, etc.), there are donation addresses at the bottom of the [main page](https://github.com/romanovichim/TonFunClessons_ru).

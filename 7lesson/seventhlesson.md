# Lesson 7 Hashmap or Dictionary
## Introduction

In this lesson, we will write a smart contract that can perform various operations with a Hashmap - a dictionary, in the test network The Open Network in the FUNC language, deploy it to the test network using [toncli](https://github.com/disintar/toncli), and we will test it in the next lesson.

## Requirements

To complete this tutorial, you need to install the [toncli](https://github.com/disintar/toncli/blob/master/INSTALLATION.md) command line interface .

And also be able to create/deploy a project using toncli, you can learn how to do it in [the first lesson](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/1lesson/firstlesson.md).

## Hashmap or dictionaries (dictionaries)

Hashmap is a data structure represented by a tree. Hashmap - maps keys to values ​​of arbitrary type, so that quick lookup and modification is possible. More details in [clause 3.3](https://ton-blockchain.github.io/docs/tvm.pdf). In FunC, hashmaps are [represented by a cell](https://ton.org/docs/#/func/stdlib?id=dictionaries-primitives).

## Smart contract

The task of the smart contract will be to add and remove data and key / value of the Hashmap storage in particular the following functionality **:
- When a smart contract receives a message with the structure described below, the contract must add a new record of the key/value type to its data:
- 32-bit unsigned `op` equal to 1
    - 64-bit unsigned `query_id`
    - 256-bit unsigned key
    - 64-bit `valid_until` unixtime
    - remaining slice value
- The message about deleting obsolete data has the following structure:
     - 32-bit unsigned `op` equal to 2
     - 64-bit unsigned `query_id`
Upon receiving such a message, the contract must remove all obsolete entries from its data (with `valid_until` < now()). And also check that there is no extra data in the message except for 32-bit unsigned `op` and 64-bit unsigned `query_id`
- For all other internal messages, an error should be thrown
- The Get method `get_key` must be implemented which accepts a 256-bit unsigned key and must return the integer `valid_until` and the value of the data slice for that key. If there is no entry for this key, an error should be thrown.
- Important! we assume that the contract starts with an empty store.

** I decided to take ideas for smart contracts from the [FunC contest1](https://github.com/ton-blockchain/func-contest1) tasks, as they are very well suited for getting acquainted with the development of smart contracts for TON.


## External method

## External method structure

In order for our proxy to receive messages, we will use the external method `recv_internal()`

    () recv_internal()  {

    }
	
##### External method arguments
According to the documentation of the [TON virtual machine - TVM](https://ton-blockchain.github.io/docs/tvm.pdf), when an event occurs on an account in one of the TON chains, it triggers a transaction.

Each transaction consists of up to 5 stages. Read more [here](https://ton.org/docs/#/smart-contracts/tvm_overview?id=transactions-and-phases).

We are interested in **Compute phase**. And to be more specific, what is "on the stack" during initialization. For normal message-triggered transactions, the initial state of the stack looks like this:

5 elements:
- Smart contract balance (in nanoTons)
- Incoming message balance (in nanotones)
- Cell with incoming message
- Incoming message body, slice type
- Function selector (for recv_internal it is 0)

As a result, we get the following code:

    () recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body)  {

    }
	
##### Get data from message body

According to the condition, depending on the `op`, the contract should work differently. Therefore, we subtract `op` and `query_id` from the body of the message.

	() recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
		int op = in_msg_body~load_uint(32);
		int query_id = in_msg_body~load_uint(64);
	 }
	 
You can read more about `op` and `query_id` in [lesson 5](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/5lesson/fifthlesson.md).

Also using conditional operators we build logic around `op` .

	() recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
		int op = in_msg_body~load_uint(32);
		int query_id = in_msg_body~load_uint(64);
		
		if (op == 1) {
		;; здесь будем добавлять новые значения
    	}
		if (op == 2) {
		;; здесь удалять
    	}
	 }

According to the task, all other internal messages should throw an error, so let's add an exception after the conditional statements.

	() recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
		int op = in_msg_body~load_uint(32);
		int query_id = in_msg_body~load_uint(64);
		
		if (op == 1) {
		;; здесь будем добавлять новые значения
    	}
		if (op == 2) {
		;; здесь удалять
    	}
		throw (1001);
	 }

Now we need to take the data from the `c4` register. In order to "get" the data from c4, we need two functions from the [FunC standard library](https://ton.org/docs/#/func/stdlib) .

Namely:
`get_data` - Gets a cell from the c4 register.
`begin_parse` - converts a cell into a slice

Pass this value to slice ds

	cell data = get_data();
	slice ds = data.begin_parse();

it is important to take into account the note in the task that the contract will start with an empty `c4`. Therefore, to take these variables from `c4` we use the conditional operator, the syntax is as follows:

	<condition> ? <consequence> : <alternative>

It will look like this:

	cell dic = ds.slice_bits() == 0 ? new_dict() : data;

The following functions from the FunC standard library are used here:

- `slice_bits()` - returns the number of data bits in the slice, check if c4 is empty or not
- `new_dict() ` - creates an empty dictionary, which is actually a null value. A special case of null().

The overall skeleton of the contract is as follows:

	() recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
		int op = in_msg_body~load_uint(32);
		int query_id = in_msg_body~load_uint(64);
		
		cell data = get_data();
		slice ds = data.begin_parse();
		cell dic = ds.slice_bits() == 0 ? new_dict() : data;
		if (op == 1) {
		;; здесь будем добавлять новые значения
    	}
		if (op == 2) {
		;; здесь удалять
    	}
		throw (1001);
	 }
	 
#op = 1

With `op` equal to one, we add the value to the hashmap. Accordingly, according to the assignment, we need:
  - get the key from the body of the message
  - set value to hashmap(dictionary) using key and message body
  - save hashmap(dictionary)
  - ends the execution of the function so that we do not fall into the exception declared at the end of recv_internal ()

##### Get the key

Here everything is as before, using the `load_uint` function from the [FunC standard library](https://ton.org/docs/#/func/stdlib) it loads an unsigned n-bit integer from a slice.

		if (op == 1) {
			int key = in_msg_body~load_uint(256);
    	}

##### Working with hashmap

To add data, we use `dict_set` , which sets the value associated with the key index key n bit depth in the dict dictionary to a slice and returns the resulting dictionary.

	if (op == 1) { ;; add new entry
		int key = in_msg_body~load_uint(256);
		dic~udict_set(256, key, in_msg_body);

	}
	
##### Save the dictionary

Using the `set_data()` function - write a cell with a hashmap to register c4.

	if (op == 1) { ;; add new entry
		int key = in_msg_body~load_uint(256);
		dic~udict_set(256, key, in_msg_body);
		set_data(dic);

	}

##### End function execution

Everything is simple here, the `return` operator will help us.

	if (op == 1) { ;; add new entry
		int key = in_msg_body~load_uint(256);
		dic~udict_set(256, key, in_msg_body);
		set_data(dic);
		return ();
	}

#op = 2

Here our task is to remove all obsolete records from our data (with `valid_until` < `now())`. In order to "pass" through the hashmap we will use a loop. FunC has three [loops](https://ton.org/docs/#/func/statements?id=loops): `repeat`,`until`,`while`.

Since we have already subtracted `op` and `query_id`, check here that there is nothing in slice in_msg_body with `end_parse()`

`end_parse()` - Checks if the slice is empty. If not, throws an exception

	if (op == 2) { 
		in_msg_body.end_parse();
	}

For our case, let's use a loop: `until`.

	if (op == 2) { 
		do {

		} until ();
	}
	
In order to check the `valid_until` < `now())` condition at each step, we need to get some minimum key of our hashmap. To do this, the [FunC standard library](https://ton.org/docs/#/func/stdlib?id=dict_set) has a function `udict_get_next?`.

`udict_get_next? ` - Calculates the minimum key k in the dictionary dict that is greater than some given value and returns k, the associated value, and a flag indicating success. If the dictionary is empty, returns (null, null, 0).

Accordingly, we set the value from before the loop, from which we will take the minimum key, and in the loop itself we will use a flag indicating success.

	if (op == 2) { 
		int key = -1;
		do {
			(key, slice cs, int f) = dic.udict_get_next?(256, key);

		} until (~ f);
	}
	
Now, using the conditional operator, we will check the condition `valid_until` < `now())`. The value of `valid_until` is subtracted from `slice cs`.

	if (op == 2) { 
		int key = -1;
		do {
			(key, slice cs, int f) = dic.udict_get_next?(256, key);
			if (f) {
				int valid_until = cs~load_uint(64);
				if (valid_until < now()) {
						;; здесь будем удалять
				}
			}
		} until (~ f);
	}
	
We will delete from the hashmap using `udict_delete?`.

`udict_delete?` Deletes the index with key k from the dict dictionary. If the key is present, returns the modified dictionary (hashmap) and success flag -1. Otherwise returns the original dict and 0.

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

Using `dict_empty?` we check if the hashmap has become empty after our manipulations in the loop.

If there are values, we save our hashmap in c4. If not, then put an empty cell c4, using a combination of functions `begin_cell().end_cell()`

	if (dic.dict_empty?()) {
			set_data(begin_cell().end_cell());
		} else {
			set_data(dic);
		}

##### End function execution

Everything is simple here, the `return` operator will help us. Final code `op`=2

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

## Get function

The `get_key` method by key should return `valid_until` and a slice with data for that key. Accordingly, according to the assignment, we need:

- get data from c4
- find data by key
- return an error if there is no data
- subtract `valid_until`
- return data

##### Get data from c4

To load data, we will write a separate load_data() function that will check if there is data and return either an empty `new_dict()` dictionary or data from c4. We will check with `slice_bits()` - which returns the number of data bits in the slice.

	cell load_data() {
		cell data = get_data();
		slice ds = data.begin_parse();
		if (ds.slice_bits() == 0) {
			return new_dict();
		} else {
			return data;
		}
	}
	
Now let's call the function in the get method.

	(int, slice) get_key(int key) method_id {
		cell dic = load_data();

	}

##### Looking for data by key

To search for data by key, take the `udict_get?` function.

`udict_get?` - Looks up the index of a key in the dict dictionary. If successful, returns the value found as a slice, along with the -1 flag to indicate success. Returns (null, 0) on failure.

We get:

	(int, slice) get_key(int key) method_id {
		cell dic = load_data();
		(slice payload, int success) = dic.udict_get?(256, key);

	}
	
##### Return an error if there is no data

The `udict_get?` function returns the convenience flag we put in success.
Using `throw_unless` we will return an exception.

	(int, slice) get_key(int key) method_id {
		cell dic = load_data();
		(slice payload, int success) = dic.udict_get?(256, key);
		throw_unless(98, success);

	}

##### Subtract valid_until and return data

Everything is simple here, subtract `valid_until` from the `payload` variable and return both variables.

	(int, slice) get_key(int key) method_id {
		cell dic = load_data();
		(slice payload, int success) = dic.udict_get?(256, key);
		throw_unless(98, success);

		int valid_until = payload~load_uint(64);
		return (valid_until, payload);
	}
	
## Conclusion

I wanted to say a special thank you to those who donate to support the project, it is very motivating and helps to release lessons faster. If you want to help the project (release lessons faster, translate it all into English, etc.), at the bottom of the [main page] (https://github.com/romanovichim/TonFunClessons_ru), there are addresses for donations.
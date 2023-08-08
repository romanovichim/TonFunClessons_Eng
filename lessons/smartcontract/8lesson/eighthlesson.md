# Lesson 8: Testing FunC for a Hashmap Smart Contract

## Introduction

In this lesson, we will write tests for the smart contract created in the seventh lesson on the TON blockchain and run them using [Blueprint](https://github.com/ton-community/blueprint).

## Requirements

To complete this lesson, you only need to install [Node.js](https://nodejs.org). It is recommended to install one of the latest versions, such as 18.

You should also complete the [seventh lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/7lesson/seventhlesson.md).

## Modifying `beforeEach` in tests for simplification

Open the file `tests/Hashmap.spec.ts`, which will contain our tests, and modify the `beforeEach` function, which is executed before each test.

Add the setting of the current time to it (change the value of `blockchain.now`). In addition, after a successful contract deployment, immediately try to set three test values in our hashmap using the previously written `sendSet` method.

From this point on, at the beginning of each test, the time will already be set to `500`, and three values will already be written (or not written if the smart contract is not functioning correctly).

Here is an example of the function:

```ts
beforeEach(async () => {
    blockchain = await Blockchain.create();

    blockchain.now = 500;

    deployer = await blockchain.treasury('deployer');

    hashmap = blockchain.openContract(
        Hashmap.createFromConfig(
            {
                manager: deployer.address,
            },
            code
        )
    );

    const deployResult = await hashmap.sendDeploy(
        deployer.getSender(),
        toNano('0.01')
    );

    expect(deployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: hashmap.address,
        deploy: true,
    });

    await hashmap.sendSet(deployer.getSender(), toNano('0.05'), {
        queryId: 123n,
        key: 1n,
        validUntil: 1000n,
        value: beginCell().storeUint(123, 16).endCell().asSlice(),
    });

    await hashmap.sendSet(deployer.getSender(), toNano('0.05'), {
        queryId: 123n,
        key: 2n,
        validUntil: 2000n,
        value: beginCell().storeUint(234, 16).endCell().asSlice(),
    });

    await hashmap.sendSet(deployer.getSender(), toNano('0.05'), {
        queryId: 123n,
        key: 3n,
        validUntil: 3000n,
        value: beginCell().storeUint(345, 16).endCell().asSlice(),
    });
});
```

## Testing value storage and retrieval

Remember that the values have already been written in `beforeEach`, so here we only need to check that the values have been written correctly.

To do this, we use the `getByKey` method we wrote and compare both the `validUntil` and `value` with the expected values (the ones we wrote in the contract).

Note that for comparing TON-specific types (such as Address or Slice), there are separate matchers. In this case, we used `toEqualSlice`, which compares two slices for equality in the test.

Repeat this procedure for all three written values, and the test is ready.

```ts
it('should store and retrieve values', async () => {
    let [validUntil, value] = await hashmap.getByKey(1n);
    expect(validUntil).toEqual(1000n);
    expect(value).toEqualSlice(
        beginCell().storeUint(123, 16).endCell().asSlice()
    );

    [validUntil, value] = await hashmap.getByKey(2n);
    expect(validUntil).toEqual(2000n);
    expect(value).toEqualSlice(
        beginCell().storeUint(234, 16).endCell().asSlice()
    );

    [validUntil, value] = await hashmap.getByKey(3n);
    expect(validUntil).toEqual(3000n);
    expect(value).toEqualSlice(
        beginCell().storeUint(345, 16).endCell().asSlice()
    );
});
```

## Testing for an error when the key does not exist

Get methods, like external messages, throw an error in the TypeScript program when they fail. Therefore, here we need to check that the `getByKey(123n)` call will result in an error. Since this method is asynchronous (called with `await`), the `await` itself should be inserted before `expect()`.

The presence of an error when calling a function can be checked using `.rejects.toThrow()`.

```ts
it('should throw on not found key', async () => {
    await expect(hashmap.getByKey(123n)).rejects.toThrow();
});
```

## Testing for the removal of old values

In this test, we will need to change the value of the current time `blockchain.now`.

First, let's try to call the value cleanup without changing the time. In this case, key `1` should be successfully found.

```ts
await hashmap.sendClearOldValues(deployer.getSender(), toNano('0.05'), {
    queryId: 123n,
});

let [validUntil, value] = await hashmap.getByKey(1n);
expect(validUntil).toEqual(1000n);
expect(value).toEqualSlice(beginCell().storeUint(123, 16).endCell().asSlice());
```

Next, set the time to 1001. Since `validUntil` for the first key is 1000, this key should disappear after the cleanup. At the same time, all remaining keys should remain in the contract and not change.

```ts
blockchain.now = 1001;

await hashmap.sendClearOldValues(deployer.getSender(), toNano('0.05'), {
    queryId: 123n,
});

await expect(hashmap.getByKey(1n)).rejects.toThrow();

[validUntil, value] = await hashmap.getByKey(2n);
expect(validUntil).toEqual(2000n);
expect(value).toEqualSlice(beginCell().storeUint(234, 16).endCell().asSlice());

[validUntil, value] = await hashmap.getByKey(3n);
expect(validUntil).toEqual(3000n);
expect(value).toEqualSlice(beginCell().storeUint(345, 16).endCell().asSlice());
```

Finally, set the time to 3001 so that all keys disappear after the cleanup. It no longer makes sense to check for the presence of the first key, as we have already checked it above.

```ts
blockchain.now = 3001;

await hashmap.sendClearOldValues(deployer.getSender(), toNano('0.05'), {
    queryId: 123n,
});

await expect(hashmap.getByKey(2n)).rejects.toThrow();
await expect(hashmap.getByKey(3n)).rejects.toThrow();
```

The complete code for this test:

```ts
it('should clear old values', async () => {
    await hashmap.sendClearOldValues(deployer.getSender(), toNano('0.05'), {
        queryId: 123n,
    });

    let [validUntil, value] = await hashmap.getByKey(1n);
    expect(validUntil).toEqual(1000n);
    expect(value).toEqualSlice(
        beginCell().storeUint(123, 16).endCell().asSlice()
    );

    blockchain.now = 1001;

    await hashmap.sendClearOldValues(deployer.getSender(), toNano('0.05'), {
        queryId: 123n,
    });

    await expect(hashmap.getByKey(1n)).rejects.toThrow();

    [validUntil, value] = await hashmap.getByKey(2n);
    expect(validUntil).toEqual(2000n);
    expect(value).toEqualSlice(
        beginCell().storeUint(234, 16).endCell().asSlice()
    );

    [validUntil, value] = await hashmap.getByKey(3n);
    expect(validUntil).toEqual(3000n);
    expect(value).toEqualSlice(
        beginCell().storeUint(345, 16).endCell().asSlice()
    );

    blockchain.now = 3001;

    await hashmap.sendClearOldValues(deployer.getSender(), toNano('0.05'), {
        queryId: 123n,
    });

    await expect(hashmap.getByKey(2n)).rejects.toThrow();
    await expect(hashmap.getByKey(3n)).rejects.toThrow();
});
```

## Testing for an error when the opcode is not found

To do this, we will use the `send` method of the `deployer` to send an arbitrary message. For example, we will send opcode = 123 and query_id = 123.

Such a transaction should end with `exitCode = 12`, as we specified in the contract. We already know how to perform such checks.

```ts
it('should throw on wrong opcode', async () => {
    const result = await deployer.send({
        to: hashmap.address,
        value: toNano('0.05'),
        body: beginCell().storeUint(123, 32).storeUint(123, 64).endCell(),
    });
    expect(result.transactions).toHaveTransaction({
        from: deployer.address,
        to: hashmap.address,
        exitCode: 12,
    });
});
```

## Testing for an error with an incorrect query

As we remember, op = 2 in our contract causes an error when there is extra data in the body of the message. This is ensured by calling `end_parse()`.

To check this error, as in the previous test, we will use the `send` method and send a message with opcode = 2, but also add extra data to the end of the body.

Such a transaction should end unsuccessfully, so we add the `success: false` flag to the `toHaveTransaction` matcher.

```ts
it('should throw on bad query', async () => {
    const result = await deployer.send({
        to: hashmap.address,
        value: toNano('0.05'),
        body: beginCell()
            .storeUint(2, 32)
            .storeUint(123, 64)
            .storeStringTail('This string should not be here!')
            .endCell(),
    });
    expect(result.transactions).toHaveTransaction({
        from: deployer.address,
        to: hashmap.address,
        success: false,
    });
});
```

## Running the tests

Run the tests with the command `npx blueprint test`, and you should see the following:

```bash
 PASS  tests/Hashmap.spec.ts
  Hashmap
    ✓ should store and retrieve values (173 ms)
    ✓ should throw on not found key (80 ms)
    ✓ should clear old values (95 ms)
    ✓ should throw on wrong opcode (73 ms)
    ✓ should throw on bad query (129 ms)
```

If any of the tests did not pass, review the code and text of this lesson again. Also, compare your smart contract code with the code from the previous lesson.

## Conclusion

I would like to say a special thank you to those who donate to support the project. It is very motivating and helps to release lessons faster. If you want to help the project (release lessons faster, translate everything into English, etc.), there are donation addresses at the bottom of the [main page](https://github.com/romanovichim/TonFunClessons_ru).

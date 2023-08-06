# Lesson 2: Testing FunC for a Smart Contract

## Introduction

In this lesson, we will write tests for the smart contract created in the first lesson on the TON blockchain and run them using [Blueprint](https://github.com/ton-community/blueprint).

## Requirements

To complete this lesson, you only need to install [Node.js](https://nodejs.org) (preferably version 18 or higher) and complete the [first lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/1lesson/firstlesson.md).

## Tests for the First Smart Contract

For our first smart contract, we will write the following tests:

-   Call `recv_internal()` with different numbers and check the `get_total` method.
-   Check for an error when the number does not meet the bitness condition.

## Test Structure in Blueprint

The [Sandbox](https://github.com/ton-community/sandbox) library is used for testing smart contracts in Blueprint projects. It is installed by default in all projects created through Blueprint.

The tests are located in the `tests/` folder. For each smart contract in the project (there can be multiple), a separate file is created. In our case, there should be only one file named `Counter.spec.ts` in this folder. It already contains everything needed to test our smart contract, including the first test that checks if the contract is deployed successfully. We just need to add new tests.

### Important Note

If you run the tests using the `npx blueprint test` command in the current directory, you will see an error in the only test called "should deploy". In most cases, this test should pass immediately. However, our contract simply throws an error because the deployed message does not contain a 32-bit number (we intentionally added this error in the first lesson when there was no number).

To fix this and ignore the error during deployment, find the code fragment that checks the success of deployment. Remove the `success` check from it. It should look like this:

```ts
expect(deployResult.transactions).toHaveTransaction({
    from: deployer.address,
    to: counter.address,
    deploy: true,
});
```

Now, if you run the `npx blueprint test` command in the terminal, you will see the following:

```
 PASS  tests/Counter.spec.ts
  Counter
    ✓ should deploy (123 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        1.085 s, estimated 2 s
Ran all test suites.
✨  Done in 2.47s.
```

This means that the test passed successfully.

## Testing the `recv_internal()` and `get_total()` Calls

Let's write the first test and go through its code.

After the standard test `it('should deploy', ...)`, write the following:

```ts
it('should update the number', async () => {
    // code will be here
});
```

The string "should update the number" can be anything. It is just an explanation for ourselves of what the test is about.

Now let's write the test code:

```ts
it('should update the number', async () => {
    const caller = await blockchain.treasury('caller');

    await counter.sendNumber(caller.getSender(), toNano('0.01'), 10n);
    expect(await counter.getTotal()).toEqual(10n);

    await counter.sendNumber(caller.getSender(), toNano('0.01'), 5n);
    expect(await counter.getTotal()).toEqual(15n);

    await counter.sendNumber(caller.getSender(), toNano('0.01'), 1000n);
    expect(await counter.getTotal()).toEqual(1015n);
});
```

### Explanation

`const caller = await blockchain.treasury('caller');` - here we create a new Treasury, which already has a million coins for all necessary checks in the Sandbox. We can use it to send messages to the contract. Essentially, it is just a wallet with a balance for testing.

`await counter.sendNumber(caller.getSender(), toNano('0.01'), 10n);` - we send a message with the number `10` using the wrapper method we wrote in the first lesson. We use `caller` as the sender, which was created above.

`expect(await counter.getTotal()).toEqual(10n);` - we check (using the `expect` function) that the result of the `getTotal()` method will be equal to `10`. If it is not the case, the test will be marked as failed, and we will see in the terminal where the check failed. If everything is fine and the result matches, the code will continue to execute.

In the next lines, we simply send numbers to the same contract and compare the result with `getTotal()`. After sending `5`, our sum should be `15`, and if we send `1000`, it should be `1015`. If the FunC code of the contract is written correctly, the test should pass.

Run the tests using the `npx blueprint test` command, and if you have done everything correctly, you will get the following result:

```
 PASS  tests/Counter.spec.ts
  Counter
    ✓ should deploy (126 ms)
    ✓ should update the number (79 ms)
```

The checkmark means that our new test passed successfully.

## Testing the Exception

Let's write another test and go through its code.

```ts
it('should throw error when number is not 32 bits', async () => {
    const caller = await blockchain.treasury('caller');

    const result = await counter.sendDeploy(caller.getSender(), toNano('0.01'));
    expect(result.transactions).toHaveTransaction({
        from: caller.address,
        to: counter.address,
        success: false,
        exitCode: 35,
    });
});
```

### Explanation

`const caller = await blockchain.treasury('caller');` - here we create a new Treasury, which already has a million coins for all necessary checks in the Sandbox. We can use it to send messages to the contract. Essentially, it is just a wallet with a balance for testing.

`const result = await counter.sendDeploy(caller.getSender(), toNano('0.01'));` - we send an empty message without a number (this was used for deployment, so for simplicity, we use the ready-made `sendDeploy` function).

`expect(result.transactions).toHaveTransaction({ ... })` - we check (using the `expect` function) that among the transactions processed as a result of calling the contract, there will be a transaction with error `35`.

> The error code `35` is what we specified in the smart contract in the `throw_if` function.

Run the tests using the `npx blueprint test` command, and if you have done everything correctly, you will get the following result:

```
 PASS  tests/Counter.spec.ts
  Counter
    ✓ should deploy (127 ms)
    ✓ should update the number (79 ms)
    ✓ should throw error when number is not 32 bits (53 ms)
```

The checkmark means that our new test passed successfully.

### That's it!

You have completed the second lesson and successfully implemented tests for the smart contract.

P.S. If you have any questions, feel free to ask [here](https://t.me/ton_learn).

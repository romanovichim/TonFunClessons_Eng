# Lesson 2: FunC Tests for the Smart Contract
## Introduction

In this lesson, we will write tests for the smart contract created in the first lesson in the test network of The Open Network using FUNC language and execute them using [Blueprint](https://github.com/ton-community/blueprint).

## Requirements

To go through this lesson, it is enough to install [Node.js](https://nodejs.org) (preferably version 18 or higher) and complete the [first lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/1lesson/firstlesson.md).

## Tests for the first smart contract

For our first smart contract, we will write the following tests:

- We will call recv_internal() with different numbers and check the get_total method.
- We will check for an error call when the number does not meet the bit condition.

## Structure of tests in Blueprint

For testing smart contracts in Blueprint projects, the [Sandbox](https://github.com/ton-community/sandbox) library is used. It is installed by default in all projects created through Blueprint.

The tests themselves are located in the `tests/` folder. A separate file is created for each smart contract of the project (there can be several). In our case, there should only be one file `Counter.spec.ts` in this folder. It already contains everything necessary for testing our smart contract, and even the first test is written, which checks that the contract is successfully deployed. All that remains is to add new tests.

### Important point

If you run the tests with the command `npx blueprint test` in the current position, you will see an error in the only test called "should deploy". In most cases, this test should be successful immediately. But our contract simply calls an error because there is no 32-bit number in the message received during deployment (in the first lesson, we specifically added a call to such an error in the absence of a number).

To fix this and ignore the error during deployment - find the piece of code that checks the success of the deployment. From it, you need to remove the check for `success`. It should look like this:
```ts
expect(deployResult.transactions).toHaveTransaction({
    from: deployer.address,
    to: counter.address,
    deploy: true,
});
```

Now, if you execute the command `npx blueprint test` in the terminal, you will see the following:
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

This means the test has been successful.

## Testing the recv_internal() and get_total() calls

Let's write the first test and break down its code.

After the standard test `it('should deploy', ...)` we will write a new one:

```ts
it('should update the number', async () => {
    // code will be here
});
```

The line "should update the number" can be anything. It's just an explanation for us about what the essence of the test is.

Now let's write the test code itself:

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

### Let's break it down

`const caller = await blockchain.treasury('caller');` - here we create a new Treasury, which already has a million coins on Sandbox for all the necessary checks. From it, we will be able to send messages to the contract. Essentially, this is just a wallet with a balance for tests.

`await counter.sendNumber(caller.getSender(), toNano('0.01'), 10n);` - we send a message with the number `10` using the method from the wrapper we wrote in the first lesson. As the sender, we use the `caller` we created earlier.

`expect(await counter.getTotal()).toEqual(10n);` - we check (with the expect function) that the result of the getTotal() get-method will be equal to `10`. If not, the test will be marked as failed, and we will see in the terminal exactly where the check did not pass. If everything is good and the result matches, the code will just continue to execute.

In the following lines, we simply send numbers to the same contract and compare the result of getTotal(). After sending `5`, our sum should already be `15`, and if we send `1000` more, it will be `1015`. If the FunC contract code is written correctly, the test should be marked as passed.

We run the tests with the command `npx blueprint test`, and if you did everything without errors, the following result will be obtained:
```
 PASS  tests/Counter.spec.ts
  Counter
    ✓ should deploy (126 ms)
    ✓ should update the number (79 ms)
```

The check mark means that our new test has been successfully passed.

## Testing the Exception

Let's write another test and break down its code.

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

### Let's break it down

`const caller = await blockchain.treasury('caller');` - here we create a new Treasury, which already has a million coins on Sandbox for all the necessary checks. From it, we will be able to send messages to the contract. Essentially, this is just a wallet with a balance for tests.

`const result = await counter.sendDeploy(caller.get

Sender(), toNano('0.01'));` - we send an empty message without a number (this is the kind that was used for deployment, so for simplicity we use the ready-made sendDeploy function).

`expect(result.transactions).toHaveTransaction({ ... })` - we check (with the expect function) that among the transactions that were processed as a result of the contract call, there will be a transaction with error `35`.

We run the tests with the command `npx blueprint test`, and if you did everything without errors, the following result will be obtained:
```
 PASS  tests/Counter.spec.ts
  Counter
    ✓ should deploy (127 ms)
    ✓ should update the number (79 ms)
    ✓ should throw error when number is not 32 bits (53 ms)
```

The check mark means that our new test has been successfully passed.

### That's all!

You have completed the second lesson and successfully implemented tests for the smart contract.

P.S. If there are any questions, I suggest you ask [here](https://t.me/ton_learn)

# Lesson 4 Tests for FunC for Proxy Smart Contract

## Introduction

In this lesson, we will write tests for the smart contract created in the third lesson on the TON blockchain and run them using [Blueprint](https://github.com/ton-community/blueprint).

## Requirements

To complete this lesson, you only need to install [Node.js](https://nodejs.org). It is preferable to install one of the latest versions, such as 18.

You should also complete the [third lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/3lesson/thirdlesson.md).

## Tests for the Proxy Smart Contract

For our proxy smart contract, we will write the following tests:

-   When a message is sent to the contract from the owner, it should not be forwarded
-   The remaining conditions from the [third lesson](https://github.com/romanovichim/TonFunClessons_ru/blob/main/3lesson/thirdlesson.md) should be met

## Testing the Proxy Contract Call by its Owner

Open the `tests/Proxy.spec.ts` file, which already contains the base for our tests. For convenience, we will move the declaration of `deployer` outside the `beforeEach` function so that it can be accessed from all tests. We also need to add the contract configuration parameters to the contract config during deployment. It should look something like this:

```ts
let blockchain: Blockchain;
let proxy: SandboxContract<Proxy>;
let deployer: SandboxContract<TreasuryContract>;

beforeEach(async () => {
    blockchain = await Blockchain.create();

    deployer = await blockchain.treasury('deployer');

    proxy = blockchain.openContract(
        Proxy.createFromConfig(
            {
                owner: deployer.address,
            },
            code
        )
    );

    const deployResult = await proxy.sendDeploy(
        deployer.getSender(),
        toNano('0.01')
    );

    expect(deployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: proxy.address,
        deploy: true,
    });
});
```

Now let's write the first test for the proxy contract and explain its code.

```ts
it('should not forward from owner', async () => {
    const result = await deployer.send({
        to: proxy.address,
        value: toNano('1'),
    });
    expect(result.transactions).not.toHaveTransaction({
        from: proxy.address,
        to: deployer.address,
    });
});
```

First, we send a message from the `deployer` wallet to the `proxy` with a value of `1 TON`.

As we remember, our contract should not forward messages from the owner to itself. Therefore, the condition for passing the test should be the **absence** of such a transaction. This check can be implemented by adding `.not` before `.toHaveTransaction`.

> Note: the test conditions (the `expect` keyword) work through the **Jest** library. Its syntax is quite simple, and in many cases, you can guess how to check something by simply writing it in English. The names of all functions clearly reflect their purpose. For example, `toEqual` checks if two values are equal, and `toBeLessThan` checks if one value is less than another.

We expect that as a result of executing the entire chain of actions, there should be no transaction from `proxy` to `deployer`.

## Testing the Proxy Contract Call by Another Wallet

Let's write the second test for the proxy contract and explain its code.

```ts
it('should forward from another wallet', async () => {
    let user = await blockchain.treasury('user');
    const result = await user.send({
        to: proxy.address,
        value: toNano('1'),
        body: beginCell().storeStringTail('Hello, world!').endCell(),
    });
    expect(result.transactions).toHaveTransaction({
        from: proxy.address,
        to: deployer.address,
        body: beginCell()
            .storeAddress(user.address)
            .storeRef(beginCell().storeStringTail('Hello, world!').endCell())
            .endCell(),
        value: (x) => (x ? toNano('0.99') <= x && x <= toNano('1') : false),
    });
});
```

First, we create a new wallet, just like the `deployer` is created in the code above:

```ts
let user = await blockchain.treasury('user');
```

Then we send a message from `user` to `proxy` with a value of `1 TON` and a comment `Hello, world!`.

Now our contract should forward this message to the owner. Therefore, we check that it is indeed there using `.toHaveTransaction` without using `.not`. We also use the `body` and `value` parameters for more precise checking.

The `body` should contain a cell that contains the address of the sender of the original message (i.e., `user.address`), and then the original message body should be stored in the ref. Therefore, we check that `body` is equal to

```
beginCell().storeAddress(user.address)
    .storeRef(beginCell().storeStringTail('Hello, world!').endCell())
.endCell()
```

For the `value` check, an unusual construction is used. Let's examine it in more detail:

```ts
value: (x) => (x ? toNano('0.99') <= x && x <= toNano('1') : false);
```

"Matchers" from `.toHaveTransaction` can accept either the expected value itself or a function that performs a more complex check and returns a boolean value with the result of this check.
In our case, we do not know the exact amount that the proxy contract will send to the owner, as we use mode 64 in the contract for sending, and this means that the fees will be deducted from the message amount. Therefore, we want to check that the message amount is approximately equal to 1.
To do this, we write a so-called "arrow function," which does not need to be declared in advance. This function takes a value `x` and returns `true` if it is greater than or equal to `0.99 TON` and less than or equal to `1 TON`. We also use a ternary expression to check that `x` is not `undefined` so that we can check its value, and otherwise return `false`.

## Running the Tests

Execute the command `npx blueprint test` in the terminal. The result should be something like this:

```
 PASS  tests/Proxy.spec.ts
  Proxy
    ✓ should deploy (145 ms)
    ✓ should not forward from owner (63 ms)
    ✓ should forward from another wallet (66 ms)
```

If any of the tests did not pass, review the code and the text of this lesson again. Also, compare your smart contract code with the code from the previous lesson.

## Conclusion

In this lesson, we successfully tested our proxy contract and made sure that it works as intended.

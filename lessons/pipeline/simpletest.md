# Smart Contract Pipeline Part2 - Tests for our smart contract in pipeline 

## Introduction

In the [first part](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/lessons/pipeline/simplesmartcontract.md), we created a project and wrote a simple smart contract, it's time for tests.

## Let's start working on tests

For tests, we need a testing framework, in our case it will be [jest](https://jestjs.io), we also need to emulate the operation of the blockchain, for this we will use [ton-community/sandbox](https://github.com/ton-community/sandbox). Install:

```bash
yarn add @ton-community/sandbox jest ts-jest @types/jest ton --dev
```
To use the jest framework, you need a configuration file. Let's create a file `jets.config.js` and add there:
```js
	/** @type {import('ts-jest').JestConfigWithTsJest} */
	module.exports = {
	  preset: 'ts-jest',
	  testEnvironment: 'node',
	};
```
Let's create a folder for tests - folder `tests`. And inside we will create a file `main.spec.ts`.
Let's check if we installed everything correctly by running a primitive test, add the following code to the `main.spec.ts` file:
```ts
describe("test tests", () => {
	it("test of test", async() => {});
});
```
And run it with the `yarn jest` command, you should see that the tests are passed. For the convenience of running tests, we will modernize the `package.json` file.

	{
	  "name": "third",
	  "version": "1.0.0",
	  "main": "index.js",
	  "license": "MIT",
	  "devDependencies": {
		"@swc/core": "^1.3.59",
		"@ton-community/func-js": "^0.6.2",
		"@ton-community/sandbox": "^0.11.0",
		"@types/jest": "^29.5.1",
		"@types/node": "^20.2.1",
		"jest": "^29.5.0",
		"ton": "^13.5.0",
		"ton-core": "^0.49.1",
		"ton-crypto": "^3.2.0",
		"ts-jest": "^29.1.0",
		"ts-node": "^10.9.1",
		"typescript": "^5.0.4"
	  },
	  "scripts": {
		"compile": "ts-node ./scripts/compile.ts",
		"test": "yarn jest"
	  }
	}

Now we import the compiled contract and `Cell` from `ton-core` into the `main.spec.ts` file so that the contract can be opened:
```ts
import { Cell } from "ton-core";
import { hex } from "../build/main.compiled.json";

describe("test tests", () => {
	it("test of test", async() => {});
});
```
Get the cell with the code in the test:
```ts
import { Cell } from "ton-core";
import { hex } from "../build/main.compiled.json";


describe("test tests", () => {
	it("test of test", async() => {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];


	});
});
```
Let's move on to using `@ton-community/sandbox`. The first thing to do is to use the local version of the blockchain.
```ts
import { Cell } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";

describe("test tests", () => {
	it("test of test", async() => {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];

		const blockchain = await Blockchain.create();
	});
});
```
For convenience of interaction with the contract, wrappers are used. The simplest wrapper describes the deployment of the contract (namely, what initial data, as well as its methods, or interaction with them).

Create a `wrappers` folder and create a `MainContract.ts` wrapper in it and immediately import the contract type and `ton-core` inside it:
```ts
import { Contract } from "ton-core";
```
We create a class of our contract by implementing `Contract`:
```ts
import { Contract } from "ton-core";

export class MainContract implements Contract {

}
```
When creating a class object, a constructor is called, let's write it, and also import the necessary types - address and cell.
```ts
import { Address,Cell,Contract } from "ton-core";

export class MainContract implements Contract {
	constructor(
		readonly address: Address,
		readonly init?: { code: Cell, data: Cell }
	){}
}
```
To understand why the constructor is the way it is, I advise you to start from [here](https://docs.ton.org/develop/howto/step-by-step).

The most important thing to know now is that the `data` is the data that will be in the c4 register when the contract is initialized.

For convenience, we will take the data for the contract from the config, so we will create a static class for this.
```ts
import { Address,beginCell,Cell,Contract, contractAddress } from "ton-core";

export class MainContract implements Contract {
	constructor(
		readonly address: Address,
		readonly init?: { code: Cell, data: Cell }
	){}

	static createFromConfig(config: any, code: Cell, workchain = 0){
		const data = beginCell().endCell();
		const init = { code,data };
		const address = contractAddress(workchain, init);

		return new MainContract(address,init);
	}
}
```
In order to deploy a smart contract, you need the smart contract code and its initial data, we will put all this in the config, for the convenience of tests and deployment.

We return to the `main.spec.ts` file. Now we have the code and the wrapper, let's use the `openContract` function from sandbox to open the contract using the config.
```ts
import { Cell, Address  } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";

describe("test tests", () => {
	it("test of test", async() => {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];

		const blockchain = await Blockchain.create();

		const myContract = blockchain.openContract(
			await MainContract.createFromConfig({}, codeCell)
		);
	});
});
```

Config is empty for now, we'll come back to it later. We will also import the `Address` from the `ton-core`, we will need it for tests. In order to test the contract, we need an entity that will allow us to send messages, in the `sandbox` this is `treasury`.
```ts
import { Cell, Address } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";

describe("test tests", () => {
	it("test of test", async() => {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];

		const blockchain = await Blockchain.create();

		const myContract = blockchain.openContract(
			await MainContract.createFromConfig({}, codeCell)
		);

		const senderWallet = await blockchain.treasury("sender");
	});
});
```
So for tests we need to send internal messages. Therefore, it is necessary to modify our wrapper. Let's add `sendInternalMessage` to the  `MainContract.ts`.
```ts
import { Address,beginCell,Cell,Contract, contractAddress, ContractProvider, Sender, SendMode } from "ton-core";

export class MainContract implements Contract {
	constructor(
		readonly address: Address,
		readonly init?: { code: Cell, data: Cell }
	){}

	static createFromConfig(config: any, code: Cell, workchain = 0){
		const data = beginCell().endCell();
		const init = { code,data };
		const address = contractAddress(workchain, init);

		return new MainContract(address,init);
	}

	async sendInternalMessage(
		provider: ContractProvider,
		sender: Sender,
		value: bigint,
	){
		await provider.internal(sender,{
		value,
			sendMode: SendMode.PAY_GAS_SEPARATELY,
			body: beginCell().endCell(),
		});
	}
}
```
Go back to the test file  `main.spec.ts` and use the method we just wrote in the wrapper:
```ts
import { Cell, Address, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";
import { send } from "process";

describe("test tests", () => {
	it("test of test", async() => {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];

		const blockchain = await Blockchain.create();

		const myContract = blockchain.openContract(
			await MainContract.createFromConfig({}, codeCell)
		);

		const senderWallet = await blockchain.treasury("sender");

		myContract.sendInternalMessage(senderWallet.getSender(),toNano("0.05"));
	});
});
```
In the wrapper, you could see that the TON value that needs to be sent is of the bigint type, so the tests themselves use the convenient `toNano` function, which translates the human-readable number into `bigInt`.  To check if sending a message worked correctly, you need to call the `getMethod`, as in the case of sending a message, you first need to work with the wrapper Add it to `MainContract.ts`:
```ts
import { Address,beginCell,Cell,Contract, contractAddress, ContractProvider, Sender, SendMode } from "ton-core";

export class MainContract implements Contract {
	constructor(
		readonly address: Address,
		readonly init?: { code: Cell, data: Cell }
	){}

	static createFromConfig(config: any, code: Cell, workchain = 0){
		const data = beginCell().endCell();
		const init = { code,data };
		const address = contractAddress(workchain, init);

		return new MainContract(address,init);
	}

	async sendInternalMessage(
		provider: ContractProvider,
		sender: Sender,
		value: bigint,
	){
		await provider.internal(sender,{
			value,
			sendMode: SendMode.PAY_GAS_SEPARATELY,
			body: beginCell().endCell(),
		});
	}

	async getData(provider: ContractProvider) {
		const { stack } = await provider.get("get_sender", []);
		return {
			recent_sender: stack.readAddress(),
			number: stack.readNumber(),
		};
	}
}
```

Finally, we have done all the preparatory steps for the tests and now we can do them, for convenience we will install `test-utils`. This library will makes us able to use cutsom matches for our Jest test framework.
```bash
yarn add @ton-community/test-utils
```

We import the utilities into a file with tests and also pass the result of sending a message to a variable.

```ts
import { Cell, Address, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";
import { send } from "process";
import "@ton-community/test-utils";

describe("test tests", () => {
	it("test of test", async() => {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];

		const blockchain = await Blockchain.create();

		const myContract = blockchain.openContract(
			await MainContract.createFromConfig({}, codeCell)
		);

		const senderWallet = await blockchain.treasury("sender");

		const sentMessageResult = await myContract.sendInternalMessage(senderWallet.getSender(),toNano("0.05"));
	});
});
```
Here we will add the first test, we will check that the transaction with our message has passed.

```ts
import { Cell, Address, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";
import { send } from "process";
import "@ton-community/test-utils";

describe("test tests", () => {
	it("test of test", async() => {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];

		const blockchain = await Blockchain.create();

		const myContract = blockchain.openContract(
			await MainContract.createFromConfig({}, codeCell)
		);

		const senderWallet = await blockchain.treasury("sender");

		const sentMessageResult = await myContract.sendInternalMessage(senderWallet.getSender(),toNano("0.05"));

		expect(sentMessageResult.transactions).toHaveTransaction({
			from: senderWallet.address,
			to: myContract.address,
			success: true,
		});

	});
});
```
Next, we call the get method and check that the correct address is returned in accordance with the logic of the contract.
```ts
import { Cell, Address, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";
import { send } from "process";
import "@ton-community/test-utils";

describe("test tests", () => {
	it("test of test", async() => {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];

		const blockchain = await Blockchain.create();

		const myContract = blockchain.openContract(
			await MainContract.createFromConfig({}, codeCell)
		);

		const senderWallet = await blockchain.treasury("sender");

		const sentMessageResult = await myContract.sendInternalMessage(senderWallet.getSender(),toNano("0.05"));

		expect(sentMessageResult.transactions).toHaveTransaction({
			from: senderWallet.address,
			to: myContract.address,
			success: true,
		});

		const getData = await myContract.getData();

		expect(getData.recent_sender.toString()).toBe(senderWallet.address.toString());

	});
});
```
Run the tests by writing in the console: `yarn test`. If you did everything right, you should see:

	Pass
	Test Suites: 1 passed, 1 total
	Tests:       1 passed, 1 total

It remains to check the unity, which we also saved, we will check with `toEqual()`:
```ts
import { Cell, Address, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";
import { send } from "process";
import "@ton-community/test-utils";

describe("test tests", () => {
	it("test of test", async() => {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];

		const blockchain = await Blockchain.create();

		const myContract = blockchain.openContract(
			await MainContract.createFromConfig({}, codeCell)
		);

		const senderWallet = await blockchain.treasury("sender");

		const sentMessageResult = await myContract.sendInternalMessage(senderWallet.getSender(),toNano("0.05"));

		expect(sentMessageResult.transactions).toHaveTransaction({
			from: senderWallet.address,
			to: myContract.address,
			success: true,
		});

		const getData = await myContract.getData();

		expect(getData.recent_sender.toString()).toBe(senderWallet.address.toString());
		expect(getData.number).toEqual(1); 
	});
});
```
## Conclusion

The tests have been passed and we need to deploy the contract to the network, in the next tutorial we will make a convenient deployment system.
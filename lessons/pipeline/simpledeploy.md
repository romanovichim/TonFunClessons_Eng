# Smart Contract Pipeline Part3 - Convenient deployment to the test network

## Introduction

In this tutorial, we will make a convenient deployment of our contract to the test network, for this we will generate a link for the deployment, which we will present in the form of a QR code, we will scan the code with a wallet and thus the deployment will take place.

The question may arise, what is the link for deployment - to deploy a smart contract, you need to send a message with data about the contract, we will do it in the following way, we will form a [deeplink](https://github.com/tonkeeper/wallet-api) for the Tonkeeper wallet into this deeplink we will transfer all the data for deployment and then from the link it will be possible make a QR, which, when scanned by a wallet, will deploy a contract, transferring all the information to the blockchain.

## Deploy script

Let's create a separate file for deploying to testnet `deploy.ts`. 

### StateInit

[StateInit](https://docs.ton.org/develop/data-formats/msg-tlb#stateinit-tl-b) serves to delivery inital data to contract and used in contract deployment.
 
At the top level, to deploy to the testnet or mainnet, we need to send a `StateInit` message to the network. `StateInit` consists of a cell with a code and a cell with data, and the smart contract address is roughly equal to: `hash(initial code, initial state)`.

Let's collect the `StateInit` and send a message for deployment.

In the `deploy.ts` file, create the `deployContract()` function:

	async function deployContract() {
	}

	deployContract()

Сделаем импорт нужных доп функций из `ton-core`, а также нашего смарт-контракта в `hex` формате:

	import { Cell, StateInit, beginCell, contractAddress, storeStateInit, toNano } from "ton-core";
	import { hex } from "../build/main.compiled.json";

	async function deployContract() {
	}

	deployContract()

We will get the cell with the code from the `hex` representation of the contract, there will be no starting data - we create an empty cell. Теперь у нас готовы данные для формирования `StateInit`


	import { Cell, StateInit, beginCell, contractAddress, storeStateInit, toNano } from "ton-core";
	import { hex } from "../build/main.compiled.json";

	async function deployContract() {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];
		const dataCell = new Cell();   

		const stateInit: StateInit = {
			code: codeCell,
			data: dataCell,
		};
	}

	deployContract()

Now we need to build `StateInit` by first creating `Builder`(Data bits and references to other cells can be stored in a builder, and then the builder can be finalized to a new cell.) , but we use the helper functions from `ton-core` `storeStateInit`, we get:

	import { Cell, StateInit, beginCell, contractAddress, storeStateInit, toNano } from "ton-core";
	import { hex } from "../build/main.compiled.json";

	async function deployContract() {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];
		const dataCell = new Cell();   

		const stateInit: StateInit = {
			code: codeCell,
			data: dataCell,
		};
	
		const stateInitBuilder = beginCell();
		storeStateInit(stateInit)(stateInitBuilder);
		const stateInitCell = stateInitBuilder.endCell();

	}

	deployContract()

Above, we said that you can get the address from the source data, let's do it with the help of `contractAddress`:

	import { Cell, StateInit, beginCell, contractAddress, storeStateInit, toNano } from "ton-core";
	import { hex } from "../build/main.compiled.json";

	async function deployContract() {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];
		const dataCell = new Cell();   

		const stateInit: StateInit = {
			code: codeCell,
			data: dataCell,
		};

		const stateInitBuilder = beginCell();
		storeStateInit(stateInit)(stateInitBuilder);
		const stateInitCell = stateInitBuilder.endCell();

		const address = contractAddress(0, {
			code: codeCell,
			data: dataCell,
		});

	}

	deployContract()

### QR code

Let's start forming a string for deploying a contract:

Install the library for convenient string generation

	yarn add qs @types/qs --dev

And a library for generating a QR code.

	yarn add qrcode-terminal @types/qrcode-terminal --dev
 
To send a message, we need to use deeplink [/transfer](https://github.com/tonkeeper/wallet-api#payment-urls):

```
ton://transfer/<address>
ton://transfer/<address>?amount=<nanocoins>
ton://transfer/<address>?text=<url-encoded-utf8-text>
ton://transfer/<address>?bin=<url-encoded-base64-boc>
ton://transfer/<address>?bin=<url-encoded-base64-boc>&init=<url-encoded-base64-boc>

https://app.tonkeeper.com/transfer/<address>
https://app.tonkeeper.com/transfer/<address>?amount=<nanocoins>
https://app.tonkeeper.com/transfer/<address>?text=<url-encoded-utf8-text>
https://app.tonkeeper.com/transfer/<address>?bin=<url-encoded-base64-boc>
https://app.tonkeeper.com/transfer/<address>?bin=<url-encoded-base64-boc>&init=<url-encoded-base64-boc>
```
 
Using the qs library, we will collect the following line:
 
		 let deployLink =
			'https://app.tonkeeper.com/transfer/' +
			address.toString({
				testOnly: true,
			}) +
			"?" +
			qs.stringify({
				text: "Deploy contract by QR",
				amount: toNano("0.1").toString(10),
				init: stateInitCell.toBoc({idx: false}).toString("base64"),
			});

Now QR code:

		qrcode.generate(deployLink, {small: true }, (qr) => {
			console.log(qr);
		});
 
At the end, we will generate a link to the blockchain explorer in the test network, for our convenience - after the deployment, we will see that the contract is ready.

Final code:

	import { Cell, StateInit, beginCell, contractAddress, storeStateInit, toNano } from "ton-core";
	import { hex } from "../build/main.compiled.json";
	import qs from "qs";
	import qrcode from "qrcode-terminal";

	async function deployContract() {
		const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];
		const dataCell = new Cell();   

		const stateInit: StateInit = {
			code: codeCell,
			data: dataCell,
		};

		const stateInitBuilder = beginCell();
		storeStateInit(stateInit)(stateInitBuilder);
		const stateInitCell = stateInitBuilder.endCell();

		const address = contractAddress(0, {
			code: codeCell,
			data: dataCell,
		});


		let deployLink =
			'https://app.tonkeeper.com/transfer/' +
			address.toString({
				testOnly: true,
			}) +
			"?" +
			qs.stringify({
				text: "Deploy contract by QR",
				amount: toNano("0.1").toString(10),
				init: stateInitCell.toBoc({idx: false}).toString("base64"),
			});

		qrcode.generate(deployLink, {small: true }, (qr) => {
			console.log(qr);
		});

		let scanAddr = 
			'https://testnet.tonscan.org/address/' +
			address.toString({
				testOnly: true,
			})

		console.log(scanAddr);

	}

	deployContract()

Upgrade the file `package.json` by adding `"deploy": "yarn compile && ts-node ./scripts/deploy.ts"` to scripts:

	{
	  "name": "test_folder",
	  "version": "1.0.0",
	  "main": "index.js",
	  "license": "MIT",
	  "devDependencies": {
		"@swc/core": "^1.3.63",
		"@ton-community/func-js": "^0.6.2",
		"@ton-community/sandbox": "^0.11.0",
		"@types/jest": "^29.5.2",
		"@types/node": "^20.3.1",
		"@types/qrcode-terminal": "^0.12.0",
		"@types/qs": "^6.9.7",
		"jest": "^29.5.0",
		"qrcode-terminal": "^0.12.0",
		"qs": "^6.11.2",
		"ton": "^13.5.0",
		"ton-core": "^0.49.1",
		"ton-crypto": "^3.2.0",
		"ts-jest": "^29.1.0",
		"ts-node": "^10.9.1",
		"typescript": "^5.1.3"
	  },
	  "scripts": {
		"compile": "ts-node ./scripts/compile.ts",
		"test": "yarn jest",
		"deploy": "yarn compile && ts-node ./scripts/deploy.ts"
	  },
	  "dependencies": {
		"@ton-community/test-utils": "^0.2.0"
	  }
	}

It remains to run it all:
1. in the console we type the command yarn deploy
2. scan the QR code in the Tonkeeper switched to the test network
3. confirm the transaction
4. look in the explorer that the contract is deployed

## Conclusion

Thank you for your attention, in the next two tutorials we will pay attention to the messages



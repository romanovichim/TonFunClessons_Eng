# Chatbot Smart Contract Testing

In this tutorial, we will write tests for the chatbot smart contract. The main task is to learn how to look at transactions in `@ton-community/sandbox` under a magnifying glass, and also to figure out how to do tests in the test network or, in other words, onchain tests.

Let's start with the usual tests.

## Check if there is a transaction

Since we are using the draft of the previous tutorial as a template, we already have a test framework, open the `main.spec.ts` file and remove from there everything related to the GET method:

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
We see that at the moment, it is checked whether the transaction has been sent to our smart contract. This is due to the `sentMessageResult.transactions` object. Let's take a close look at it and see what we can test based on this object.

If we just print this object to the console, it will consist of a lot of raw information, for convenience we will use `flattenTransaction` from `@ton-community/test-utils`:
``` ts
import { Cell, Address, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";
import { send } from "process";
import "@ton-community/test-utils";
import { flattenTransaction } from "@ton-community/test-utils";



describe("msg test", () => {
	it("test", async() => {
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

		const arr = sentMessageResult.transactions.map(tx => flattenTransaction(tx));
		console.log(arr)


	});
});
```     
What you see in the console can be used for tests, let's check that the message our chatbot sent is equal to reply.

Let's assemble the message, in accordance with what we collected in the smart contract.

```ts
	let reply = beginCell().storeUint(0, 32).storeStringTail("reply").endCell();
``` 
Now, using messages, check that there is such a transaction:
```ts
import { Cell, Address, toNano, beginCell } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";
import { send } from "process";
import "@ton-community/test-utils";
import { flattenTransaction } from "@ton-community/test-utils";



describe("msg test", () => {
	it("test", async() => {
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

		//const arr = sentMessageResult.transactions.map(tx => flattenTransaction(tx));

		let reply = beginCell().storeUint(0, 32).storeStringTail("reply").endCell();

		expect(sentMessageResult.transactions).toHaveTransaction({
			body: reply,
			from: myContract.address,
			to: senderWallet.address
		});

	});
});
``` 
Run the tests with the `yarn test` command and see that everything works. Thus, in tests we can collect objects the same as in a smart contract and check that the transaction was.

## Onchain tests

Sometimes a situation may arise that you need to run your smart contracts on the test network (a situation where there are a lot of contracts). Let's try this with our example.

In the `scripts` folder we will make the `onchain.ts` file, for ease of launch, add to `package.json` `"onchain": "ts-node ./scripts/onchain.ts"`:


	  "scripts": {
		"compile": "ts-node ./scripts/compile.ts",
		"test": "yarn jest",
		"deploy": "yarn compile && ts-node ./scripts/deploy.ts",
		"onchain": "ts-node ./scripts/onchain.ts"
	  },

Первое, что нам понадобиться для тестов, это адрес смарт-контракта, соберем его:

```ts
import { Cell, beginCell, contractAddress, toNano} from "ton-core";
import { hex } from "../build/main.compiled.json";
import { TonClient } from "ton";

async function onchainScript() {
	const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];
	const dataCell = new Cell();

	const address = contractAddress(0,{
		code: codeCell,
		data: dataCell,
	});

	console.log("Address: ",address)

}

onchainScript();
``` 
The test for the test network will offer us to deploy a transaction via a QR code into our smart contract and check every 10 seconds if the answer has appeared on the network.

> Of course, this is a simplification for an example, the essence is just to show the logic.

Let's collect a QR code, by which we will conduct a transaction through Tonkeeper. For our example, it is important that the amount of TON is sufficient so as not to throw an exception written in the contract.
```ts
import { Cell, beginCell, contractAddress, toNano} from "ton-core";
import { hex } from "../build/main.compiled.json";
import { TonClient } from "ton";
import qs from "qs";
import qrcode from "qrcode-terminal";

async function onchainScript() {
	const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];
	const dataCell = new Cell();

	const address = contractAddress(0,{
		code: codeCell,
		data: dataCell,
	});

	console.log("Address: ",address)

	let transactionLink =
	'https://app.tonkeeper.com/transfer/' +
	address.toString({
		testOnly: true,
	}) +
	"?" +
	qs.stringify({
		text: "Sent simple in",
		amount: toNano("0.6").toString(10),
	});

	console.log("Transaction link:",transactionLink);


	qrcode.generate(transactionLink, {small: true }, (qr) => {
		console.log(qr);
	});

}

onchainScript();
``` 
In order to receive data from the test network, we need some kind of data source. Data can be obtained via ADNL from Liteservers, but we will talk about ADNL in the following tutorials. In this tutorial, we will use the TON Center API.

```ts
	const API_URL = "https://testnet.toncenter.com/api/v2"
``` 
We will make requests through the Http client [axios](https://axios-http.com/ru/docs/intro), install: `yarn add axios`.

Among the Toncenter methods, we need getTransactions with the limit 1 parameter, i.e. we will take the last transaction. Let's write two helper functions for requesting information:

```ts
// axios http client // yarn add axios
async function getData(url: string): Promise<any> {
	try {
	  const config: AxiosRequestConfig = {
		url: url,
		method: "get",
	  };
	  const response: AxiosResponse = await axios(config);
	  //console.log(response)
	  return response.data.result;
	} catch (error) {
	  console.error(error);
	  throw error;
	}
  }

async function getTransactions(address: String) {
  var transactions;
  try {
	transactions = await getData(
	  `${API_URL}/getTransactions?address=${address}&limit=1`
	);
  } catch (e) {
	console.error(e);
  }
  return transactions;
}
``` 

Now we need a function that will call the API at intervals, for this there is a convenient method [SetInterval](https://developer.mozilla.org/docs/Web/API/setInterval):
```ts
import { Cell, beginCell, contractAddress, toNano} from "ton-core";
import { hex } from "../build/main.compiled.json";
import { TonClient } from "ton";
import qs from "qs";
import qrcode from "qrcode-terminal";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";


const API_URL = "https://testnet.toncenter.com/api/v2"

	// axios http client // yarn add axios
async function getData(url: string): Promise<any> {
	try {
	  const config: AxiosRequestConfig = {
		url: url,
		method: "get",
	  };
	  const response: AxiosResponse = await axios(config);
	  //console.log(response)
	  return response.data.result;
	} catch (error) {
	  console.error(error);
	  throw error;
	}
  }

async function getTransactions(address: String) {
  var transactions;
  try {
	transactions = await getData(
	  `${API_URL}/getTransactions?address=${address}&limit=1`
	);
  } catch (e) {
	console.error(e);
  }
  return transactions;
}

async function onchainScript() {
	const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];
	const dataCell = new Cell();

	const address = contractAddress(0,{
		code: codeCell,
		data: dataCell,
	});


	console.log("Address: ",address)

	let transactionLink =
	'https://app.tonkeeper.com/transfer/' +
	address.toString({
		testOnly: true,
	}) +
	"?" +
	qs.stringify({
		text: "Sent simple in",
		amount: toNano("0.6").toString(10),
		//bin: beginCell().storeUint(1,32).endCell().toBoc({idx: false}).toString("base64"),
	});

	console.log("Transaction link:",transactionLink);


	qrcode.generate(transactionLink, {small: true }, (qr) => {
		console.log(qr);
	});

	setInterval(async () => {
		const txes = await getTransactions(address.toString());
		if(txes[0].in_msg.source === "EQCj2gVRdFS0qOZnUFXdMliONgSANYXfQUDMsjd8fbTW-RuC") {

		}

	},10000)


}

onchainScript();
``` 
It is important to note here that the API returns transactions, not messages, so we need to check that IN received the address of our wallet (here I just hardcoded it) and the message (which we put under the QR), and output the message of the first message in OUT. We also display the date, we get:

```ts
import { Cell, beginCell, contractAddress, toNano} from "ton-core";
import { hex } from "../build/main.compiled.json";
import { TonClient } from "ton";
import qs from "qs";
import qrcode from "qrcode-terminal";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";


const API_URL = "https://testnet.toncenter.com/api/v2"

	// axios http client // yarn add axios
async function getData(url: string): Promise<any> {
	try {
	  const config: AxiosRequestConfig = {
		url: url,
		method: "get",
	  };
	  const response: AxiosResponse = await axios(config);
	  //console.log(response)
	  return response.data.result;
	} catch (error) {
	  console.error(error);
	  throw error;
	}
  }

async function getTransactions(address: String) {
  var transactions;
  try {
	transactions = await getData(
	  `${API_URL}/getTransactions?address=${address}&limit=1`
	);
  } catch (e) {
	console.error(e);
  }
  return transactions;
}

async function onchainScript() {
	const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];
	const dataCell = new Cell();

	const address = contractAddress(0,{
		code: codeCell,
		data: dataCell,
	});


	console.log("Address: ",address)

	let transactionLink =
	'https://app.tonkeeper.com/transfer/' +
	address.toString({
		testOnly: true,
	}) +
	"?" +
	qs.stringify({
		text: "Sent simple in",
		amount: toNano("0.6").toString(10),
		//bin: beginCell().storeUint(1,32).endCell().toBoc({idx: false}).toString("base64"),
	});

	console.log("Transaction link:",transactionLink);


		qrcode.generate(transactionLink, {small: true }, (qr) => {
			console.log(qr);
		});

		setInterval(async () => {
			const txes = await getTransactions(address.toString());
			if(txes[0].in_msg.source === "EQCj2gVRdFS0qOZnUFXdMliONgSANYXfQUDMsjd8fbTW-RuC") {

            	console.log("Last tx: " + new Date(txes[0].utime * 1000))
            	console.log("IN from: "+ txes[0].in_msg.source+" with msg: "+ txes[0].in_msg.message)
            	console.log("OUT from: "+ txes[0].out_msgs[0].source +" with msg: "+ txes[0].out_msgs[0].message)
			}

		},10000)


	}

	onchainScript();
```

We launch the `yarn onchain` command, scan the QR, send the transaction and wait for our transaction to arrive.

## Conclusion

I hope you enjoyed the pipeline series. I will be grateful to the asterisk on the repository.
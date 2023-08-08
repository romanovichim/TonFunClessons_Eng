# ADNL Intro

When creating Web3 / blockchain applications, the task arises of obtaining data from the blockchain, for example, to view the last transactions of an account or pull the contract method into the Get method.

For this task, you can use intermediary services that either index the blockchain and give you aggregated information, or are a proxy service that passes your requests through itself. But the use of an intermediary may carry risks, errors or deliberate misrepresentation of facts, may lead to fraud.

TON has network protocols through which you can receive information, roughly speaking, without an intermediary. One such protocol is ADNL. In this tutorial, we will connect to Lightservers and get account information via ANDL.

ADNL is an overlay, peer-to-peer, unreliable (small-size) datagram protocol running on top of a UDP in IPv4 (in the future, IPv6), with an optional TCP fallback if UDP is not available.

Using ANDL, you can receive data from the TON blockchain without intermediaries

## Introduction

Each participant has a 256-bit ADNL Address. The ADNL Protocol allows you to send (unreliable) and receive datagrams using only ADNL Addresses. IP Addresses and Ports are hidden by the ADNL Protocol.

To establish a connection, the handshake mechanism is used. The client connects to the server using TCP and sends an ADNL handshake packet, which contains a server abstract address, a client public key and encrypted AES-CTR session parameters, which are determined by the client.

To connect to Lightclients, we need a list of them:
- Mainnet: https://ton.org/global.config.json
- Testnet: https://ton.org/testnet-global.config.json

[More](https://docs.ton.org/learn/networking/low-level-adnl) about the protocol.


### Install libraries

For requests to TON, we need `typescript` and modules for working with TON.
To work with Typescript we need:
- Node.js is the environment in which you will run the TypeScript compiler.
- The TypeScript Compiler is a Node.js module that compiles TypeScript to JavaScript.

> We will not dive deep into Node.js, instructions for installing it are [here] (https://nodejs.org/en/download/):

For the convenience of working with modules, let's create a `package.json` file using the `npm` package manager:
1. In the console, go to your project folder (where we will write scripts)
2. Enter in the console

		npm init

3. Answer the questions in the console and make sure the `package.json` file is created

Now install `typescript`. At the command line, enter the following command:

	npm install typescript
		
Once installed, you can enter the following command to check the current version of the TypeScript compiler:

	tsc --v

We will also install the ts-node package to execute TypeScript in the console and the REPL for node.js.

	npm install  ts-node
		
Install the module to work with TON:

	npm install ton ton-core ton-crypto
		
And of course:

	npm install ton-lite-client
		
## Connecting

`ton-lite-client` we will use to connect via ADNL to light servers. Let's create an `example.ts` file, import the libraries, and define the `main` function:


	import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
	import { Address} from "ton-core";

	async function main() {

	}

	main()

The library uses the [Round-robin](https://en.wikipedia.org/wiki/Round-robin_scheduling) mechanism to distribute tasks/requests between light servers. Accordingly, we can throw several lighters to which we will connect, but for simplicity of the example, we will take one and add it to the `engines` array.

Let's go to https://ton.org/global.config.json and take the data on the light server.

	import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
	import { Address} from "ton-core";

	let server = {
		"ip": -2018145068,
		"port": 13206,
		"id": {
			"@type": "pub.ed25519",
			"key": "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw="
		}
	}

	async function main() {
		const engines: LiteEngine[] = [];

	}

	main()

IP must be represented in a different format, for this we will write an auxiliary function `intToIP` and place the object in the `engine` array.

	import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
	import { Address} from "ton-core";

	function intToIP(int: number) {
		var part1 = int & 255;
		var part2 = ((int >> 8) & 255);
		var part3 = ((int >> 16) & 255);
		var part4 = ((int >> 24) & 255);

		return part4 + "." + part3 + "." + part2 + "." + part1;
	}

	let server = {
		"ip": -2018145068,
		"port": 13206,
		"id": {
			"@type": "pub.ed25519",
			"key": "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw="
		}
	}

	async function main() {
		const engines: LiteEngine[] = [];
		engines.push(new LiteSingleEngine({
			host: `tcp://${intToIP(server.ip)}:${server.port}`,
			publicKey: Buffer.from(server.id.key, 'base64'),
		}));
		const engine: LiteEngine = new LiteRoundRobinEngine(engines);

	}

	main()
	
With `engine` we can initialize the connection:

	import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
	import { Address} from "ton-core";

	function intToIP(int: number) {
		var part1 = int & 255;
		var part2 = ((int >> 8) & 255);
		var part3 = ((int >> 16) & 255);
		var part4 = ((int >> 24) & 255);

		return part4 + "." + part3 + "." + part2 + "." + part1;
	}

	let server = {
		"ip": -2018145068,
		"port": 13206,
		"id": {
			"@type": "pub.ed25519",
			"key": "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw="
		}
	}

	async function main() {
		const engines: LiteEngine[] = [];
		engines.push(new LiteSingleEngine({
			host: `tcp://${intToIP(server.ip)}:${server.port}`,
			publicKey: Buffer.from(server.id.key, 'base64'),
		}));
		const engine: LiteEngine = new LiteRoundRobinEngine(engines);
		const client = new LiteClient({ engine });


	}

	main()


Now, since we already know how to generate TL packets for the Lite API, we can request information about the current block of the TON masterchain. The masterchain block is used in many further queries as an input parameter to indicate the state (moment) in which we need information.

In this tutorial, our task will be to get the current information about the account, which means we need the last block, we will get it via `getMasterchainInfo()`:

	import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
	import { Address} from "ton-core";

	function intToIP(int: number) {
		var part1 = int & 255;
		var part2 = ((int >> 8) & 255);
		var part3 = ((int >> 16) & 255);
		var part4 = ((int >> 24) & 255);

		return part4 + "." + part3 + "." + part2 + "." + part1;
	}

	let server = {
		"ip": -2018145068,
		"port": 13206,
		"id": {
			"@type": "pub.ed25519",
			"key": "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw="
		}
	}

	async function main() {
		const engines: LiteEngine[] = [];
		engines.push(new LiteSingleEngine({
			host: `tcp://${intToIP(server.ip)}:${server.port}`,
			publicKey: Buffer.from(server.id.key, 'base64'),
		}));
		const engine: LiteEngine = new LiteRoundRobinEngine(engines);
		const client = new LiteClient({ engine });
		const master = await client.getMasterchainInfo()
		console.log('master', master.;last)

	}

	main()
	
Now we will get information about the account, take the account that we will use the smart contract of the Getgems marketplace:

	import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
	import { Address} from "ton-core";

	function intToIP(int: number) {
		var part1 = int & 255;
		var part2 = ((int >> 8) & 255);
		var part3 = ((int >> 16) & 255);
		var part4 = ((int >> 24) & 255);

		return part4 + "." + part3 + "." + part2 + "." + part1;
	}

	let server = {
		"ip": -2018145068,
		"port": 13206,
		"id": {
			"@type": "pub.ed25519",
			"key": "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw="
		}
	}

	async function main() {
		const engines: LiteEngine[] = [];
		engines.push(new LiteSingleEngine({
			host: `tcp://${intToIP(server.ip)}:${server.port}`,
			publicKey: Buffer.from(server.id.key, 'base64'),
		}));
		const engine: LiteEngine = new LiteRoundRobinEngine(engines);
		const client = new LiteClient({ engine });
		//console.log('get master info')
		const master = await client.getMasterchainInfo()
		//console.log('master', master)

		const address = Address.parse('EQCjk1hh952vWaE9bRguFkAhDAL5jj3xj9p0uPWrFBq_GEMS');
		const accountState = await client.getAccountState(address, master.last)

		console.log('state', accountState)	

	}

	main()
	
	
Run the script with the `ts-node example.ts` command. Now in the console we see information about the account in the last block on the network. The most interesting for us in the future will be lastTx, thanks to this field it will be possible to get the latest transactions, but this will be in the following tutorials.






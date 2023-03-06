# Requests to the TON blockchain using JS: How to fetch NFT data

Often Web3 applications or Dapps look architecturally like a Frontend that invokes smart contract methods. Accordingly, you need to be able to make requests for JS in the blockchain. There are few JS examples in TON, so I decided to make a small visual tutorial.

## Introduction

Web 3 applications are often built around the standards that exist in the blockchain, in TON these are NFT and Jetton. For the NFT standard, a common task is to obtain the NFT addresses of a particular collection. Therefore, in this tutorial:

  - we get data about the NFT collection
  - get NFT address by index
 
and all this in JS.

### Install libraries

For requests to TON, we need `typescript` and modules for working with TON.
To work with Typescript we need:
- Node.js is the environment in which you will run the TypeScript compiler.
- The TypeScript Compiler is a Node.js module that compiles TypeScript to JavaScript.

> We will not dive deep into Node.js, instructions for installing it are [here](https://nodejs.org/en/download/):

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

	npm install ts-node

It remains to install modules for working with TON:

	npm install ton ton-core ton-crypto

Alright, now we can start scripting.

## Get information about the Collection

To get information about the NFT collection, we need to call the GET method of the collection's smart contract, for this we need:
- use a certain API service that interacts with Light servers of the TON blockchain
- call the required GET method through this client
- convert the received data into a readable form

In this tutorial, we will use [toncenter API](https://github.com/toncenter/ton-http-api), for the request we will use the js client, libraries [ton.js](https://www.npmjs.com /package/ton).

Let's create a `collection.ts` script. Import client from library:

	import { TonClient } from 'ton';
	
And connect to toncenter:

	import { TonClient } from 'ton';

	export const toncenter = new TonClient({
		endpoint: 'https://toncenter.com/api/v2/jsonRPC',
	});
	
> For simplicity of the example, we do not use an API key, so we will be limited to one request per minute, you can use the bot https://t.me/tonapibot to create a key

Now let's look at the [NFT collection standard on TON](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md) in order to understand which GET method to call . The standard shows that we need the `get_collection_data()` function, which will return us:

- `next_item_index` is the number of currently deployed NFT items in the collection.
- `collection_content` - the contents of the collection in the format corresponding to the [TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md) standard.
- `owner_address` - address of the owner of the collection, zero address if there is no owner.

Let's use the syntactic sugar `async/await` and call this method for some collection in TON:

	import { TonClient } from 'ton';

	export const toncenter = new TonClient({
		endpoint: 'https://toncenter.com/api/v2/jsonRPC',
	});

	export const nftCollectionAddress = Address.parse('UQApA79Qt8VEOeTfHu9yKRPdJ_dADvspqh5BqV87PgWD998f');

	(async () => {
		let { stack } = await toncenter.callGetMethod(
			nftCollectionAddress, 
			'get_collection_data'
		);

	})().catch(e => console.error(e));
	
To convert the data into a readable form, we will use the `ton-core` library:

	import { Address } from 'ton-core';
	
Let's convert nextItemIndex to a string, subtract the cell with content, and convert the address:

	import { TonClient } from 'ton';
	import { Address } from 'ton-core';

	export const toncenter = new TonClient({
		endpoint: 'https://toncenter.com/api/v2/jsonRPC',
	});

	export const nftCollectionAddress = Address.parse('UQApA79Qt8VEOeTfHu9yKRPdJ_dADvspqh5BqV87PgWD998f');

	(async () => {
		let { stack } = await toncenter.callGetMethod(
			nftCollectionAddress, 
			'get_collection_data'
		);
		let nextItemIndex = stack.readBigNumber();
		let contentRoot = stack.readCell();
		let owner = stack.readAddress();

		console.log('nextItemIndex', nextItemIndex.toString());
		console.log('contentRoot', contentRoot);
		console.log('owner', owner);
	})().catch(e => console.error(e));
	
Run the script with `ts-node`. You should get the following:

![collection](./img/1.png)

## Get the address of the Collection element by index

Now we will solve the problem of getting the address by index, we will again call the GET method of the smart contract of the collection. According to the standard, the `get_nft_address_by_index(int index)` method, which returns `slice address`, is suitable for this task.

This method takes an `int index` parameter and at first glance it looks like you just need to pass a value with type `int` to the smart contract. This is of course true, but since the TON virtual machine uses registers, the value with the `int` type will need to be passed in a tuple. To do this, the `ton.js` library has a `TupleBuilder` .

	import { TupleBuilder } from 'ton';

Write the value 0 to the tuple:

	import { TonClient } from 'ton';
	import { Address } from 'ton-core';
	import { TupleBuilder } from 'ton';

	export const toncenter = new TonClient({
		endpoint: 'https://toncenter.com/api/v2/jsonRPC',
	});

	export const nftCollectionAddress = Address.parse('EQDvRFMYLdxmvY3Tk-cfWMLqDnXF_EclO2Fp4wwj33WhlNFT');

	(async () => {
		let args = new TupleBuilder();
		args.writeNumber(0);


	})().catch(e => console.error(e));

It remains to make a request and convert the address using `readAddress()`:

	import { TonClient } from 'ton';
	import { Address } from 'ton-core';
	import { TupleBuilder } from 'ton';

	export const toncenter = new TonClient({
		endpoint: 'https://toncenter.com/api/v2/jsonRPC',
	});

	export const nftCollectionAddress = Address.parse('EQDvRFMYLdxmvY3Tk-cfWMLqDnXF_EclO2Fp4wwj33WhlNFT');

	(async () => {
		let args = new TupleBuilder();
		args.writeNumber(0);

		let { stack } = await toncenter.callGetMethod(
			nftCollectionAddress, 
			'get_nft_address_by_index',
			args.build(),
		);
		let nftAddress = stack.readAddress();

		console.log('nftAddress', nftAddress.toString());
	})().catch(e => console.error(e));

Run the script with `ts-node`. You should get the following:

![address](./img/2.png)

## Conclusion

I publish similar analyzes and tutorials in the telegram channel https://t.me/ton_learn, I will be glad for your subscription.

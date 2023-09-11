# Collect recent transactions

A common task in TON is to receive transactions of any account. In this tutorial, we will see how to get account transactions using ADNL

## Logical transaction time

The `ton-lite-client` library has a `getAccountTransactions` function to get account transactions, the problem is that the filter is based on the logical time of the transaction. Accordingly, in order to get the latest transactions, you first need to get it. We do this with `getAccountState()`:

```ts
import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
import { Address, Cell, loadTransaction,parseTuple, TupleReader, beginCell  } from "ton-core";
import { Buffer } from 'buffer';

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

	//transactions
	const address = Address.parse('EQCjk1hh952vWaE9bRguFkAhDAL5jj3xj9p0uPWrFBq_GEMS');
	const accountState = await client.getAccountState(address, master.last)
	if (!accountState.lastTx) {
		return
	}

}

main()
```
It's simple - we take the last block, and from it we get information about the account. From this information, we will get the logical time of the last transaction and using the auxiliary function `bigIntToBuffer()` we will present the hash in the format we need further:

```ts
let lastTxLt = accountState.lastTx.lt.toString()
let lastTxHash = bigIntToBuffer(accountState.lastTx.hash)
```
We call the method and get a cell with transactions:

```ts
let lastTxLt = accountState.lastTx.lt.toString()
let lastTxHash = bigIntToBuffer(accountState.lastTx.hash)
	
let limit = 16 as number 
const temp = await client.getAccountTransactions(address,lastTxLt,lastTxHash,limit)
```
Let's use the `loadTransction` function from `ton-core` and use logical time to represent transactions in a convenient form:

```ts
let lastTxLt = accountState.lastTx.lt.toString()
let lastTxHash = bigIntToBuffer(accountState.lastTx.hash)
	
let limit = 16 as number 
const temp = await client.getAccountTransactions(address,lastTxLt,lastTxHash,limit)
	
console.log(temp);
	
const cell = Cell.fromBoc(temp.transactions)
const ltToHash: Map<string, Buffer> = new Map()
	ltToHash.set(lastTxLt, lastTxHash)

const transactions = cell.map((c) => {
	const tx = loadTransaction(c.beginParse())
	ltToHash.set(tx.prevTransactionLt.toString(), bigIntToBuffer(tx.prevTransactionHash))
	return tx
})
```
## Loops and Transactions

Now we can loop through the transactions. Let's do this - we will get the information and present it in a convenient form, the information is as follows:

```ts
export interface PlainTransaction {
  address: string // raw
  lt: string // bigint
  hash: string // base64
  data: string // base64

  prevLt: string
  prevHash: string
}
```
We present it in a convenient way:

```ts
let lastTxLt = accountState.lastTx.lt.toString()
let lastTxHash = bigIntToBuffer(accountState.lastTx.hash)
	
let limit = 16 as number 
const temp = await client.getAccountTransactions(address,lastTxLt,lastTxHash,limit)
	
console.log(temp);
	
const cell = Cell.fromBoc(temp.transactions)
const ltToHash: Map<string, Buffer> = new Map()
	ltToHash.set(lastTxLt, lastTxHash)

const transactions = cell.map((c) => {
	const tx = loadTransaction(c.beginParse())
	ltToHash.set(tx.prevTransactionLt.toString(), bigIntToBuffer(tx.prevTransactionHash))
	return tx
})
	
const txes = transactions.map((tx, i): PlainTransaction => {
	const lt = tx.lt.toString()
	const hash = ltToHash.get(lt)

	if (!hash) {
		throw new Error('Tx hash not found')
	}

	return Object.freeze({
		address: address.toString(),
		lt,
		hash: hash.toString('hex'),
		data: cell[i].toBoc().toString('base64'),
		prevLt: tx.prevTransactionLt.toString(),
		prevHash: bigIntToBuffer(tx.prevTransactionHash).toString('hex'),
	})
})
```
Next, let's look at information about transactions, but in order to view the message sent with the transaction, we need one more helper function:

```ts
export function msgToStr(msg: Cell | undefined){
  if (!msg) {
	return
  }
  const body = msg.asSlice()
  if (body.remainingBits < 32) {
	return undefined
  }
  const opcode = body.loadUint(32)
  if (opcode !== 0) {
	return 'OP: 0x' + opcode.toString(16)
  }
  if (body.remainingBits < 8 || body.remainingBits % 8 !== 0) {
	return undefined
  }
  //console.log('body.remainingBits', body.remainingBits)
  return body.loadBuffer(body.remainingBits / 8).toString('utf-8')
}
```
## Make it readable

For example, let's get information on transactions and present them in a convenient, readable form:

```ts
import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
import { Address, Cell, loadTransaction,parseTuple, TupleReader, beginCell  } from "ton-core";
import { Buffer } from 'buffer';

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

//for transaction
export function bigIntToBuffer(data: bigint | undefined) {
  if (!data) {
	return Buffer.from([])
  }
  const hexStr = data.toString(16)
  const pad = hexStr.padStart(64)
  const hashHex = Buffer.from(pad, 'hex')

  return hashHex
}

export interface PlainTransaction {
  address: string // raw
  lt: string // bigint
  hash: string // base64
  data: string // base64

  prevLt: string
  prevHash: string
}



export function msgToStr(msg: Cell | undefined){
  if (!msg) {
	return
  }
  const body = msg.asSlice()
  if (body.remainingBits < 32) {
	return undefined
  }
  const opcode = body.loadUint(32)
  if (opcode !== 0) {
	return 'OP: 0x' + opcode.toString(16)
  }
  if (body.remainingBits < 8 || body.remainingBits % 8 !== 0) {
	return undefined
  }
  //console.log('body.remainingBits', body.remainingBits)
  return body.loadBuffer(body.remainingBits / 8).toString('utf-8')
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


	//transactions
	const address = Address.parse('EQCjk1hh952vWaE9bRguFkAhDAL5jj3xj9p0uPWrFBq_GEMS');
	const accountState = await client.getAccountState(address, master.last)
	if (!accountState.lastTx) {
		return
	}

	let lastTxLt = accountState.lastTx.lt.toString()
	let lastTxHash = bigIntToBuffer(accountState.lastTx.hash)

	let limit = 16 as number 
	const temp = await client.getAccountTransactions(address,lastTxLt,lastTxHash,limit)

	console.log(temp);

	const cell = Cell.fromBoc(temp.transactions)
	const ltToHash: Map<string, Buffer> = new Map()
		ltToHash.set(lastTxLt, lastTxHash)

	const transactions = cell.map((c) => {
		const tx = loadTransaction(c.beginParse())
		ltToHash.set(tx.prevTransactionLt.toString(), bigIntToBuffer(tx.prevTransactionHash))
		return tx
	})

	const txes = transactions.map((tx, i): PlainTransaction => {
		const lt = tx.lt.toString()
		const hash = ltToHash.get(lt)

		if (!hash) {
			throw new Error('Tx hash not found')
		}

		return Object.freeze({
			address: address.toString(),
			lt,
			hash: hash.toString('hex'),
			data: cell[i].toBoc().toString('base64'),
			prevLt: tx.prevTransactionLt.toString(),
			prevHash: bigIntToBuffer(tx.prevTransactionHash).toString('hex'),
		})
	})


	for (const transaction of txes) {
		const txCell = Cell.fromBoc(Buffer.from(transaction.data, 'base64'))[0]
		const data = loadTransaction(txCell.asSlice())
		console.log("Type: ",data.inMessage?.info.type); //external and internal
		console.log("Addr: ",data.inMessage?.info.src);  // from who tx
		console.log("Msg: ", msgToStr(data.inMessage?.body));
		console.log("Date",new Date(data.now*1000));
	}		

	/*
	const lastTx = txes.at(-1)
		if (lastTx) {
		  const lastTxData = loadTransaction(
			Cell.fromBoc(Buffer.from(lastTx.data, 'base64'))[0].asSlice()
		  )

		  lastTxLt = lastTxData.prevTransactionLt.toString()
		  lastTxHash = bigIntToBuffer(lastTxData.prevTransactionHash)
		}
	*/
	//console.log(txes);

}

main()
```
At the end you can see a commented piece of code, you may need it if you want to pull out more than 16 transactions at a time, since the `getAccountTransactions` function pulls out a maximum of 16, which means you need to call it in a loop and get the logical time of the last transaction each time if you want more than 16 transactions.

## Conclusion

This article is the last in the cycle about ADNL, I hope you liked it and you will put an asterisk on the repository. More useful articles about TON [here](https://t.me/ton_learn).

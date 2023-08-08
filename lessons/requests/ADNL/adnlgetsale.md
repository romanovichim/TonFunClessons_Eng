# Get method via ADNL

## Introduction

A common task in TON is to get data from smart contracts via Get methods. In this tutorial, we will get the data about the NFT collection through the Get method of the collection smart contract. We will also talk about the logic of selling NFTs in TON and how to get information about the sale correctly.

## Introduction

Since the collection smart contract is a standard, we can look at the method signature. `get_collection_data()` returns:

- `next_item_index` is the number of currently deployed NFT items in the collection.
- `collection_content` - collection content in TEP-64 format.
- `owner_address` - address of the owner of the collection, zero address if there is no owner.

In order to make a request, you need the last block, we analyzed how to get it in the previous tutorial:

	import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
	import { Address} from "ton-core";

	async function main() {
		const engines: LiteEngine[] = [];
		engines.push(new LiteSingleEngine({
			host: `tcp://${intToIP(server.ip)}:${server.port}`,
			publicKey: Buffer.from(server.id.key, 'base64'),
		}));
		const engine: LiteEngine = new LiteRoundRobinEngine(engines);
		const client = new LiteClient({ engine });
		const master = await client.getMasterchainInfo()

	}
	
Take the address of any collection in TON, for example `EQAo92DYMokxghKcq-CkCGSk_MgXY5Fo1SPW20gkvZl75iCN` and call its Get method using the resulting block:

	let executed = await client.runMethod(Address.parse(addrStr), 'get_collection_data', Buffer.alloc(0), master.last);
	if (!executed.result) {
		return
	}
	
Get methods can take parameters, since there are no parameters in the standard `get_collection_data` method, we pass `Buffer.alloc(0)` - an object of zero size.

In response, we will receive a stack that needs to be parsed, it will look like this:

	// collection
	const addrStr="EQAo92DYMokxghKcq-CkCGSk_MgXY5Fo1SPW20gkvZl75iCN";
	let executed = await client.runMethod(Address.parse(addrStr), 'get_collection_data', Buffer.alloc(0), master.last);
	if (!executed.result) {
		return
	}
	let resultTuple = parseTuple(Cell.fromBoc(Buffer.from(executed.result, 'base64'))[0])
	let parsed = new TupleReader(resultTuple);
	
Now we can start reading data, such as the index of the next element in the collection:

	let next_item_index = parsed.readBigNumber();
	
As well as the address of the owner and the cell with the content:

	let collection_content = parsed.readCell();
	let owner_address = parsed.readAddress();
	
If you output data to the console, you will see the value, address and cell, the cell contains content, the storage of this content is also described by the standard, data storage is described here in the `Content representation` paragraph, the data is here.

The most common data representation is `Offchain snake format`, let's parse it:

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

		//int 0x46495850,    ;; fix price sale ("FIXP")
		//int is_complete 
		//int created_at
		//slice marketplace_address
		//slice nft_address
		//slice nft_owner_address
		//int full_price
		//slice marketplace_fee_address
		//int marketplace_fee
		//slice royalty_address
		//int royalty_amount


	const OFF_CHAIN_CONTENT_PREFIX = 0x01

	export function flattenSnakeCell(cell: Cell) {
	  let c: Cell | null = cell

	  let res = Buffer.alloc(0)

	  while (c) {
		const cs = c.beginParse()
		if (cs.remainingBits === 0) {
		  return res
		}
		if (cs.remainingBits % 8 !== 0) {
		  throw Error('Number remaining of bits is not multiply of 8')
		}

		const data = cs.loadBuffer(cs.remainingBits / 8)
		res = Buffer.concat([res, data])
		c = c.refs && c.refs[0]
	  }

	  return res
	}

	export function decodeOffChainContent(content: Cell) {
	  const data = flattenSnakeCell(content)

	  const prefix = data[0]
	  if (prefix !== OFF_CHAIN_CONTENT_PREFIX) {
		throw new Error(`Unknown content prefix: ${prefix.toString(16)}`)
	  }
	  return data.slice(1).toString()
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


		//GET METHOD

		// collection
		const addrStr="EQAo92DYMokxghKcq-CkCGSk_MgXY5Fo1SPW20gkvZl75iCN";
		let executed = await client.runMethod(Address.parse(addrStr), 'get_collection_data', Buffer.alloc(0), master.last);
		if (!executed.result) {
			return
		}
		let resultTuple = parseTuple(Cell.fromBoc(Buffer.from(executed.result, 'base64'))[0])
		let parsed = new TupleReader(resultTuple);
		//(int next_item_index, cell collection_content, slice owner_address)
		//console.log(parsed);
		let next_item_index = parsed.readBigNumber();
		let collection_content = parsed.readCell();
		let owner_address = parsed.readAddress();
		console.log("Content link: " ,decodeOffChainContent(collection_content));
		console.log("Owner Address: ", owner_address);

	}

	main()
	
The `decodeOffChainContent()` function checks by prefix that this is off-chain content storage and 'parses' the cell, turning it into the link we need.

## Sales information - data collection logic

Understanding how smart contracts work, you can get almost any information from the network. In TON, the actor model, respectively, in order to understand where to get information, you need to understand the chain of smart contracts.

Let's imagine a certain task and try to consider the chain. Let's say we want to analyze the latest sales occurring on the NFT marketplace. Then, roughly understanding how NFT sales in TON work (analysis of smart contracts here), we:

consider the NFT element available to us and analyze how the transfer of ownership of this element occurs using the explorer
consider a marketplace smart contract or other smart contract that receives sales messages - this will give us a list of recent sales
let's analyze what types of smart contracts implement sales - you can sell by auction, simply putting it up for sale or, for example, making an offer to sell to the owner of the NFT
let's look at each type of GET methods, i.e. what information is returned by smart sales contracts
from GET methods we will get information about NFT, which means we will have to get information about specific elements, for this we need to understand how the standard works
Let's try to go this way for the Getgems marketplace, take some NFT and, moving from it, try to find the information we need.

We find on the marketplace some NFT that has already been sold:

https://tonscan.org/address/EQCSfecskd3PuZJ_eBa1VogJ-okmoIaUOpnWTDdqNpe2OPl7

Let's look at the transaction history, we see that there is a transaction from the collection - i.e. NFT deployment and there is a smart contract for sale:

https://tonscan.org/address/EQCd205E1KdajfW29w7BRyWhiOZwZSPbirMathS8CaTEO83e

If we consider the sales smart contract, it becomes clear that, according to its logic, the last transaction goes to the marketplace smart contract, namely here:

https://tonscan.org/address/EQCjk1hh952vWaE9bRguFkAhDAL5jj3xj9p0uPWrFBq_GEMS

Now we have a hypothesis that if we take the transactions of this smart contract, we will be able to receive information about sales, but we remember that sales are different, by climbing the smart contract of the marketplace, we will find:

Sales example: https://tonscan.org/address/EQCd205E1KdajfW29w7BRyWhiOZwZSPbirMathS8CaTEO83e
Sales proposals, example: https://tonscan.org/address/EQBikL59x3fXgG4CYXTZBiCHiBhLOHp1cYKL4bBqTRL-5ywu
Auction sales example: https://tonscan.org/address/EQBLQRjs7unG_ruz3Ismly_3_aXFD_wthmbTSUtdh6te4B1e
Let's explore the Get methods of smart contract data by looking at the Contract tab in the explorer. We see that for regular sales and auctions, there is a get_nft_data() method.

For sales:

	(int, int, int, slice, slice, slice, int, slice, int, slice, int) get_sale_data() method_id {
		var (
			is_complete,
			created_at,
			marketplace_address,
			nft_address,
			nft_owner_address,
			full_price,
			fees_cell
		) = load_data();

		var (
			marketplace_fee_address,
			marketplace_fee,
			royalty_address,
			royalty_amount
		) = load_fees(fees_cell);

		return (
			0x46495850,    ;; fix price sale ("FIXP")
			is_complete == 1,
			created_at,
			marketplace_address,
			nft_address,
			nft_owner_address,
			full_price,
			marketplace_fee_address,
			marketplace_fee,
			royalty_address,
			royalty_amount
		);
	}
For auctions:

	; 1  2    3    4      5      6      7    8      9    10     11   12   13     14   15   16   17   18   19   20
	(int, int, int, slice, slice, slice, int, slice, int, slice, int, int, slice, int, int, int, int, int, int, int) get_sale_data() method_id {
		init_data();

		var (
				mp_fee_addr,
				mp_fee_factor,
				mp_fee_base,
				royalty_fee_addr,
				royalty_fee_factor,
				royalty_fee_base
		) = get_fees();

		return (
				0x415543, ;; 1 nft aucion ("AUC")
				end?, ;; 2
				end_time, ;; 3
				mp_addr, ;; 4
				nft_addr, ;; 5
				nft_owner, ;; 6
				last_bid, ;; 7
				last_member, ;; 8
				min_step, ;; 9
				mp_fee_addr, ;; 10
				mp_fee_factor, mp_fee_base, ;; 11, 12
				royalty_fee_addr, ;; 13
				royalty_fee_factor, royalty_fee_base, ;; 14, 15
				max_bid, ;; 16
				min_bid, ;; 17
				created_at?, ;; 18
				last_bid_at, ;; 19
				is_canceled? ;; 20
		);
	}
Notice the first variables that return the same methods, which means that in order to get information about which item was sold, we will need to make the same request for these two types. For offers, the situation is different, there is a `get_offer_data()` method.

	(int, int, int, int, slice, slice, slice, int, slice, int, int, slice, int, int, int) get_offer_data() method_id {
		var (
				is_complete,
				created_at, finish_at,
				marketplace_address,
				nft_address,
				offer_owner_address,
				full_price,
				fees_cell,
				can_deploy
		) = load_data();

		var (
				marketplace_fee_address,
				marketplace_factor, marketplace_base,
				royalty_address,
				royalty_factor, royalty_base
		) = load_fees(fees_cell);

		int royalty_amount = get_percent(full_price, royalty_factor, royalty_base);
		int marketplace_fee = get_percent(full_price, marketplace_factor, marketplace_base);
		int profit_price = full_price - royalty_amount - marketplace_fee;

		return (
				0x4f46464552,    ;; offer ("OFFER")
				is_complete == 1,
				created_at, finish_at,
				marketplace_address,
				nft_address,
				offer_owner_address,
				full_price,
				marketplace_fee_address,
				marketplace_factor, marketplace_base,
				royalty_address,
				royalty_factor, royalty_base,
				profit_price
		);
	}
From these methods, we can get the address of the collection, the address of the element, and the price at which the sale took place. Now, having studied the standards, we can get information about the items that were sold.

It will look like this, first we make a request to the `get_nft_data()` element, we get the individual cell content and the element index. Now we go to the smart contract of the collection, there we need the `get_nft_content(int index, cell individual_content)` method, which will return the cell with the content to us.

## Conclusion

We know how to make Get-requests and get content through ADNL, it remains only to learn how to get transactions - we will do this in the next tutorial.
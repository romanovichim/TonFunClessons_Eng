import TonWeb from "tonweb";
import { beginCell, Cell, Address, loadTransaction,toNano} from "ton";
import {API_KEY} from "./env"





const init = async () => {
    const providerUrl = 'https://testnet.toncenter.com/api/v2/jsonRPC'; // TON HTTP API url. Use this url for testnet
    const apiKey = API_KEY; // Obtain your API key in https://t.me/tontestnetapibot for high rate limits
    const tonweb = new TonWeb(new TonWeb.HttpProvider(providerUrl, {apiKey})); // Initialize TON SDK

	const router_addr = 'EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt'

	
	const txs = await tonweb.getTransactions(router_addr,10);
	
	for (let r of txs) {
		let loaded_tx =loadTransaction(Cell.fromBoc(Buffer.from(r.data, 'base64'))[0].beginParse());
		let slice = loaded_tx.inMessage!.body.beginParse();
		let in_op =  slice.loadUint(32).toString(16);
		if(in_op=="f93bb43f"){
			console.log(in_op); // op+code
			console.log(slice.loadUint(64)); // query_id .skip(64); // skip query_id
			console.log("Owner address",slice.loadAddress()); // owner
			console.log(slice.loadUint(32)); //exitcode
			let ref_coins_data = slice.loadRef().beginParse();
			let amount0_out = ref_coins_data.loadCoins()
			let token0_address =  ref_coins_data.loadAddress()
			console.log("amount0_out",amount0_out)
			console.log("token0_address",token0_address)
			let amount1_out = ref_coins_data.loadCoins()
			let token1_address =  ref_coins_data.loadAddress()
			console.log("amount1_out",amount1_out)
			console.log("token1_address",token1_address)
		}
		
	}
	

	
}

init();


















/*

const init = async () => {
    const providerUrl = 'https://testnet.toncenter.com/api/v2/jsonRPC'; // TON HTTP API url. Use this url for testnet
    const apiKey = API_KEY; // Obtain your API key in https://t.me/tontestnetapibot for high rate limits
    const tonweb = new TonWeb(new TonWeb.HttpProvider(providerUrl, {apiKey})); // Initialize TON SDK

	const router_addr = 'EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt'


	const txs = await tonweb.getTransactions(router_addr,10);
	
	for (let r of txs) {
		let loaded_tx =loadTransaction(Cell.fromBoc(Buffer.from(r.data, 'base64'))[0].beginParse());
		let slice = loaded_tx.inMessage!.body.beginParse();
		let in_op =  slice.loadUint(32).toString(16);
		
		
	}
	
}

init();

*/










/*

const init = async () => {
    const providerUrl = 'https://testnet.toncenter.com/api/v2/jsonRPC'; // TON HTTP API url. Use this url for testnet
    const apiKey = API_KEY; // Obtain your API key in https://t.me/tontestnetapibot for high rate limits
    const tonweb = new TonWeb(new TonWeb.HttpProvider(providerUrl, {apiKey})); // Initialize TON SDK

	const router_addr = 'EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt'


	const txs = await tonweb.getTransactions(router_addr,10);
	
	for (let r of txs) {
		let loaded_tx =loadTransaction(Cell.fromBoc(Buffer.from(r.data, 'base64'))[0].beginParse());
		let slice = loaded_tx.inMessage!.body.beginParse();
		let in_op =  slice.loadUint(32).toString(16);
		
		if(in_op=="f93bb43f"){
			console.log(in_op); // op+code
			console.log(slice.loadUint(64)); // query_id .skip(64); // skip query_id
			console.log("Owner address",slice.loadAddress()); // owner
			console.log(slice.loadUint(32)); //exitcode
			let ref_coins_data = slice.loadRef().beginParse();
			let amount0_out = ref_coins_data.loadCoins()
			let token0_address =  ref_coins_data.loadAddress()
			console.log("amount0_out",amount0_out)
			console.log("token0_address",token0_address)
			let amount1_out = ref_coins_data.loadCoins()
			let token1_address =  ref_coins_data.loadAddress()
			console.log("amount1_out",amount1_out)
			console.log("token1_address",token1_address)
		}
		
	}
	
}

init();

*/
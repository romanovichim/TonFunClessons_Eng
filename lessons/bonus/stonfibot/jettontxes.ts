import TonWeb from "tonweb";
import { beginCell, Cell, Address, loadTransaction,toNano} from "ton";

const init = async () => {
    const providerUrl = 'https://testnet.toncenter.com/api/v2/jsonRPC'; // TON HTTP API url. Use this url for testnet
    const apiKey = ''; // Obtain your API key in https://t.me/tontestnetapibot for high rate limits
    const tonweb = new TonWeb(new TonWeb.HttpProvider(providerUrl, {apiKey})); // Initialize TON SDK

	const router_addr = 'EQCdC2b1GG1saybYxCwRfEqr4WlOexsQIcYcfMYObk_47wBm'


	const txs = await tonweb.getTransactions(router_addr,2);
	
	for (let r of txs) {
		let loaded_tx =loadTransaction(Cell.fromBoc(Buffer.from(r.data, 'base64'))[0].beginParse());
		console.log('Lt: ', loaded_tx.now);
		console.log('Addr from: ',loaded_tx.inMessage!.info.src); //src = source
		let slice = loaded_tx.inMessage!.body.beginParse();
		let in_op =  slice.loadUint(32).toString(16);

		if(in_op == "f8a7ea5"){
			console.log(in_op); // op+code
			console.log(slice.loadUint(64)); // query_id .skip(64); // skip query_id
			console.log(slice.loadCoins()); 
				
		}


	}
	
}

init();

















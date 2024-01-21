import { CronJob } from 'cron';
import TonWeb from "tonweb";
import { beginCell, Cell, Address, loadTransaction,toNano} from "ton";
const nacl = require("tweetnacl");
import { Router, ROUTER_REVISION, ROUTER_REVISION_ADDRESS } from '@ston-fi/sdk';



import {API_KEY} from "./env"


//let start: number = Date.now();

let start: number = Math.floor(Date.now() / 1000);
console.log('Start time', start)


console.log('Before job instantiation');
const job = new CronJob('*/5 * * * * *',async function () {
	try {
		console.log('job tick');
		//addr for copy
		const copyAddr = 'EQDTW0aiqvAw3bVhI4_A2ilxfT3wdH2RolB7rBFg9d06nVf3';
		
		// Take swap from pay_to
		const providerUrl = 'https://testnet.toncenter.com/api/v2/jsonRPC'; // TON HTTP API url. Use this url for testnet
		const apiKey = API_KEY; // Obtain your API key in https://t.me/tontestnetapibot for high rate limits
		const tonweb = new TonWeb(new TonWeb.HttpProvider(providerUrl, {apiKey})); // Initialize TON SDK

		const router_addr = 'EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt'

		const txs = await tonweb.getTransactions(router_addr,10);

		for (let r of txs) {
			let loaded_tx = loadTransaction(Cell.fromBoc(Buffer.from(r.data, 'base64'))[0].beginParse());
		// new swaps
			
			if (loaded_tx.now > start){
				console.log('tx time:', loaded_tx.now )
				let slice = loaded_tx.inMessage!.body.beginParse();
				let in_op =  slice.loadUint(32).toString(16);
				let payto_q_id = slice.loadUint(64);
				let payto_owner = slice.loadAddress(); 
				if(in_op == "f93bb43f"){
					if(payto_owner.toString()==copyAddr){
						console.log("swap found: ");
						let payto_owner_exit_code =slice.loadUint(32); //exitcode
						let ref_coins_data = slice.loadRef().beginParse();
						let amount0_out = ref_coins_data.loadCoins()
						let token0_address =  ref_coins_data.loadAddress()
						console.log("amount0_out",amount0_out)
						console.log("token0_address",token0_address)
						let amount1_out = ref_coins_data.loadCoins()
						let token1_address =  ref_coins_data.loadAddress()
						console.log("amount1_out",amount1_out)
						console.log("token1_address",token1_address)
						
						
						
						// check than swap is TON to Jetton, not Jetton to Jetton
						if (token0_address.toString() == 'EQCdC2b1GG1saybYxCwRfEqr4WlOexsQIcYcfMYObk_47wBm' && token1_address.toString() == 'EQA5Q513nGufKW9D7Rn_Wt9nyl7_NWJp03rpbapEcc8sn5XV' ){
								const jet_txs = await tonweb.getTransactions('EQCdC2b1GG1saybYxCwRfEqr4WlOexsQIcYcfMYObk_47wBm',2);
								//console.log(jet_txs);
								for (let j of jet_txs) {
									let loaded_jet_tx = loadTransaction(Cell.fromBoc(Buffer.from(j.data, 'base64'))[0].beginParse());
									let jet_slice = loaded_jet_tx.inMessage!.body.beginParse();
									let jet_in_op = jet_slice.loadUint(32).toString(16);
									
									if(jet_in_op == "f8a7ea5"){
										let jet_qid = jet_slice.loadUint(64); // query_id .skip(64); // skip query_id
										let ton_amount = jet_slice.loadCoins(); 
										console.log('we are here');
										// NOw we have all the information lets create out swap payload		
										
										// Swap start
									
										const seed = tonweb.utils.base64ToBytes(''); // A's private (secret) key
										const keyPair = nacl.sign.keyPair.fromSeed(
											seed 	
										);
										console.log(keyPair)
										
										let wallet = tonweb.wallet.create({publicKey: keyPair.publicKey, wc: 0}); // create interface to wallet smart contract (wallet v3 by default) wc: 0 - workchain 
										const WALLET_ADDRESS = 'EQAN5TlewSIWUyCOT1bP4C3T3ICXzfHoyMrNc2-hWE8IuzrL'; // ! replace with your address
										const JETTON0 = 'EQDB8JYMzpiOxjCx7leP5nYkchF72PdbWT1LV7ym1uAedINh'; // Address from swap
										const PROXY_TON = 'EQAcOvXSnnOhCdLYc6up2ECYwtNNTzlmOlidBeCs5cFPVwuG'; // ProxyTON testnet
										
										const provider = new TonWeb.HttpProvider(providerUrl, {apiKey});
										const router = new Router(provider, {
											revision: 'V1',
											address: 'EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt',
										});

										  const tonToJettonTxParams = await router.buildSwapProxyTonTxParams({
											// address of the wallet that holds TON you want to swap
											userWalletAddress: WALLET_ADDRESS,
											proxyTonAddress: PROXY_TON,
											// amount of the TON you want to swap - WE CHANGE IT HERE
											//offerAmount: new TonWeb.utils.BN('1000000000'),
											offerAmount: ton_amount,
											// address of the jetton you want to receive
											askJettonAddress: JETTON0,
											// minimal amount of the jetton you want to receive as a result of the swap.
											// If the amount of the jetton you want to receive is less than minAskAmount
											// the transaction will bounce
											minAskAmount: new TonWeb.utils.BN(1),
											// query id to identify your transaction in the blockchain (optional)
											queryId: 12345,
											// address of the wallet to receive the referral fee (optional)
											referralAddress: undefined,
										  });

										  // to execute the transaction you need to send transaction to the blockchain
										  // (replace with your wallet implementation, logging is used for demonstration purposes)
										  console.log('Swap payload:');
										  console.log({
											to: tonToJettonTxParams.to,
											amount: tonToJettonTxParams.gasAmount,
											payload: tonToJettonTxParams.payload,
										  });
										
										  
										
										  const seqno = await wallet.methods.seqno().call(); 
										
										  if(seqno !== undefined) {
										
											  // Отправить транзакцию е
											  const transfer = await wallet.methods.transfer({
												secretKey: keyPair.secretKey,
												toAddress: tonToJettonTxParams.to,
												amount: tonToJettonTxParams.gasAmount, 
												seqno: seqno,
												payload: tonToJettonTxParams.payload,
												sendMode: 3,
											});
											  
											  const transferSended = await transfer.send();  // send transfer query to blockchain

											  console.log('swap finished');
											  // change time
											  start =  loaded_tx.now
											  console.log('swap finished and job ended');
										  }


									
										// Swap end
										
									}
								}	
						}
						
						
					}
				}
			}
		}
		
		
	}
	catch (e) {
		console.log((e as Error).message);
	}
	
});
console.log('After job instantiation');
job.start();



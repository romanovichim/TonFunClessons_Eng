import TonWeb from "tonweb";
const nacl = require("tweetnacl");
import {API_KEY} from "./env"

//https://github.com/ston-fi/sdk
import { Router, ROUTER_REVISION, ROUTER_REVISION_ADDRESS } from '@ston-fi/sdk';

function newSeed() {
    return nacl.sign.keyPair().secretKey.slice(0, 32);
}


const init = async () => {
    const providerUrl = 'https://testnet.toncenter.com/api/v2/jsonRPC'; // TON HTTP API url. Use this url for testnet
    const apiKey = API_KEY; // Obtain your API key in https://t.me/tontestnetapibot for high rate limits
	
	const provider = new TonWeb.HttpProvider(providerUrl, {apiKey});
    const tonweb = new TonWeb(provider); // Initialize TON SDK
	
	const seed = tonweb.utils.base64ToBytes(''); // A's private (secret) key
	const keyPair = nacl.sign.keyPair.fromSeed(
		seed 	
	);
	
	let wallet = tonweb.wallet.create({publicKey: keyPair.publicKey, wc: 0}); // create interface to wallet smart contract (wallet v3 by default) wc: 0 - workchain 
	
	const WALLET_ADDRESS = 'EQDTW0aiqvAw3bVhI4_A2ilxfT3wdH2RolB7rBFg9d06nVf3'; // ! replace with your address
	const JETTON0 = 'EQDB8JYMzpiOxjCx7leP5nYkchF72PdbWT1LV7ym1uAedINh'; // STON testnet - STONT
	const PROXY_TON = 'EQAcOvXSnnOhCdLYc6up2ECYwtNNTzlmOlidBeCs5cFPVwuG'; // ProxyTON testnet
	
	
    const router = new Router(provider, {
		revision: 'V1',
		address: 'EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt',
	});
	

		// 1 TON = 10^9 nanoton; 1 nanoton = 0.000000001 TON;
	// So 0.5 TON is 500 000 000 nanoton
	// 1 TON is 1 000 000 000 nanoton
	
	// Because TON is not a jetton, to be able to swap TON to jetton
	  // you need to use special SDK method to build transaction to swap TON to jetton
	  // using proxy jetton contract.

	  // transaction to swap 1.0 TON to JETTON0 but not less than 1 nano JETTON0
	  const tonToJettonTxParams = await router.buildSwapProxyTonTxParams({
		// address of the wallet that holds TON you want to swap
		userWalletAddress: WALLET_ADDRESS,
		proxyTonAddress: PROXY_TON,
		// amount of the TON you want to swap
		offerAmount: new TonWeb.utils.BN('500000000'),
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
	  
		  console.log('finish');
	  }
	

	  	
	  
}

init();



/*
	// 1 TON = 10^9 nanoton; 1 nanoton = 0.000000001 TON;
	// So 0.5 TON is 500 000 000 nanoton
	// 1 TON is 1 000 000 000 nanoton
	
	// Because TON is not a jetton, to be able to swap TON to jetton
	  // you need to use special SDK method to build transaction to swap TON to jetton
	  // using proxy jetton contract.

	  // transaction to swap 1.0 TON to JETTON0 but not less than 1 nano JETTON0
	  const tonToJettonTxParams = await router.buildSwapProxyTonTxParams({
		// address of the wallet that holds TON you want to swap
		userWalletAddress: WALLET_ADDRESS,
		proxyTonAddress: PROXY_TON,
		// amount of the TON you want to swap
		offerAmount: new TonWeb.utils.BN('500000000'),
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

*/







/*

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

	console.log('finish');
}

*/
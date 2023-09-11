# Ton Connect React ui send transaction

In the previous part, we made a simple site with authorization through TonConnect, let's add the functionality of sending a transaction.

## Let's get started

To send a transaction through tonConnectUI, you need to use the sendTransaction method, and it seems that the tutorial could end there:
```ts
const transaction = {
	validUntil: Date.now() + 1000000,
	messages: [
		{
			address: "0:412410771DA82CBA306A55FA9E0D43C9D245E38133CB58F1457DFB8D5CD8892F",
			amount: "20000000",
			stateInit: "base64bocblahblahblah==" // just for instance. Replace with your transaction initState or remove
		},
		{
			address: "0:E69F10CC84877ABF539F83F879291E5CA169451BA7BCE91A37A5CED3AB8080D3",
			amount: "60000000",
			payload: "base64bocblahblahblah==" // just for instance. Replace with your transaction payload or remove
		}
	]
}

try {
	const result = await tonConnectUI.sendTransaction(transaction);

	// you can use signed boc to find the transaction 
	const someTxData = await myAppExplorerService.getTransaction(result.boc);
	alert('Transaction was sent successfully', someTxData);
} catch (e) {
	console.error(e);
}
```
But in practice, the task of sending a transaction is wider:
- the transaction must be sent to the contract, data about it
- there are a lot of transactions, some convenient abstraction is needed for sending
- with the transaction, you need to send a payload, which needs to be determined in a convenient way

For the example in this tutorial, we will use the contract from the previous tutorial.

## Use the wrapper

Create a contract folder in `src` and copy the `ContractWrapper.ts` file into it from the previous lesson.
```ts
import { Address,beginCell,Cell,Contract, contractAddress, ContractProvider, Sender, SendMode } from "ton-core";

export class MainContract implements Contract {
	constructor(
		readonly address: Address,
		readonly init?: { code: Cell, data: Cell }
	){}

	static createFromConfig(config: any, code: Cell, workchain = 0){
		const data = beginCell().endCell();
		const init = { code,data };
		const address = contractAddress(workchain, init);

		return new MainContract(address,init);
	}

	async sendInternalMessage(
		provider: ContractProvider,
		sender: Sender,
		value: bigint,
	){
		await provider.internal(sender,{
			value,
			sendMode: SendMode.PAY_GAS_SEPARATELY,
			body: beginCell().endCell(),
		});
	}

	async getData(provider: ContractProvider) {
		const { stack } = await provider.get("get_sender", []);
		return {
			recent_sender: stack.readAddress(),
			number: stack.readNumber(),
		};
	}

}
```
Let's create a folder for custom hooks `hooks` and create the first custom hook `useInit` in it in the file `useInit.ts`:
```ts
import {useEffect, useState} from 'react';

export function useInit<T>(

){

}
```
Let's add the top-level logic for processing the contract initialization state to it:
```ts
import {useEffect, useState} from 'react';

export function useInit<T>(
  func: () => Promise<T>,
  deps: any[] = []
){
  const [state, setState] = useState<T | undefined>();
  useEffect(()=>{
	(async () => {
		setState(await func());
	})();
  },deps);


  return state;
}
```
To receive data from the blockchain, you need a connection point, for simplicity we will use api toncenter in this case, we will do this in a separate hook `useTonClient.ts`
```ts
import { TonClient } from "ton";
import { useInit } from "./useInit";

export function useTonClient() {
	return useInit(
		async () =>
			new TonClient({
				endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
			})
	);
}
```
Finally, we move on to the hook that will interact with our contract, create `useContractWrapper.ts` and immediately import the hooks we created and some additional functions from the libraries we have already installed there.
```ts
import {useEffect, useState} from 'react';
import { Address, OpenedContract} from 'ton-core';
import { useInit } from './useInit';
import { MainContract } from '../contracts/ContractWrapper';
import { useTonClient } from './useTonClient';

export function useContractWrapper() {

}
```
To work with the contract, you need a connection, let's create it using the `useTonClient()` hook and also describe the contract data:
```ts
import {useEffect, useState} from 'react';
import { Address, OpenedContract} from 'ton-core';
import { useInit } from './useInit';
import { MainContract } from '../contracts/ContractWrapper';
import { useTonClient } from './useTonClient';

export function useContractWrapper() {
	const client = useTonClient();

	const [contractData, setContractData] = useState<null | {
		recent_sender: Address;
		number: number;
	}>();

}
```
We open the contract and get the data using the Get method
```ts
import {useEffect, useState} from 'react';
import { Address, OpenedContract} from 'ton-core';
import { useInit } from './useInit';
import { MainContract } from '../contracts/ContractWrapper';
import { useTonClient } from './useTonClient';

export function useContractWrapper() {
	const client = useTonClient();

	const [contractData, setContractData] = useState<null | {
		recent_sender: Address;
		number: number;
	}>();

	const mainContract = useInit( async () => {
		if (!client) return;
		const contract = new MainContract(
			Address.parse("kQACwi82x8jaITAtniyEzho5_H1gamQ1xQ20As_1fboIfJ4h")
		);
		return client.open(contract) as OpenedContract<MainContract>;
	},[client]);

	useEffect( () => {
		async function getValue() {
			if(!mainContract) return;
			setContractData(null);
			const instack = await mainContract.getData();
			setContractData({
				recent_sender: instack.recent_sender,
				number: instack.number,
			});
		}
		getValue();
	}, [mainContract]);

}
```
It remains only to return the contract data and its address:
```ts
import {useEffect, useState} from 'react';
import { Address, OpenedContract} from 'ton-core';
import { useInit } from './useInit';
import { MainContract } from '../contracts/ContractWrapper';
import { useTonClient } from './useTonClient';

export function useContractWrapper() {
	const client = useTonClient();

	const [contractData, setContractData] = useState<null | {
		recent_sender: Address;
		number: number;
	}>();

	const mainContract = useInit( async () => {
		if (!client) return;
		const contract = new MainContract(
			Address.parse("kQACwi82x8jaITAtniyEzho5_H1gamQ1xQ20As_1fboIfJ4h")
		);
		return client.open(contract) as OpenedContract<MainContract>;
	},[client]);

	useEffect( () => {
		async function getValue() {
			if(!mainContract) return;
			setContractData(null);
			const instack = await mainContract.getData();
			setContractData({
				recent_sender: instack.recent_sender,
				number: instack.number,
			});
		}
		getValue();
	}, [mainContract]);

	return {
		contract_address: mainContract?.address.toString(),
		...contractData,
	};
}
```
Now go to the `App.ts` file and import the `useContractWrapper` hook
```ts
import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react'
import { useContractWrapper } from './hooks/useContractWrapper'

function App() {
  return (
	<>
	  <TonConnectButton/>
	</>

  )
}

export default App;
```

Let's call the hook and display the information, remembering to cast the sender's address to the string.
```ts
import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react'
import { useContractWrapper } from './hooks/useContractWrapper'

function App() {
  const {
	recent_sender,
	number,
	contract_address,
  } = useContractWrapper();

  return (
	<>
	  <TonConnectButton/>
	  <div>
	  <b>Contract Address:</b>
	  <div>{contract_address}</div>
	  <b>Last Sender Address</b>
	  <div>{recent_sender?.toString()}</div>
	  <b>Check num</b>
	  <div>{number}</div>
	  </div>
	</>

  )
}

export default App;
```
Run the application with the `yarn dev` command. Make sure you can see the smart contract data.

## Sending a transaction

Suppose you are making an application with a large number of transactions in different contracts, in this case it would be convenient to make one hook for sending transactions, into which the parameters would simply be thrown. Despite the fact that our example is simple, we will do just that, we create a `useConnection.ts` hook:
```ts
import { useTonConnectUI } from "@tonconnect/ui-react";
import { Sender, SenderArguments} from "ton-core";

export function useConnection(): {} {
	const [useTonConnectUI] = useTonConnectUI();

}
```
It will assume a call with arguments for a transaction and return a sender object (sending a transaction) and connected (whether the user's wallet is connected -
then for the convenience of forming the logic ui).
```ts
import { useTonConnectUI } from "@tonconnect/ui-react";
import { Sender, SenderArguments} from "ton-core";

export function useConnection(): { sender: Sender; connected: boolean} {
	const [TonConnectUI] = useTonConnectUI();

	return {
		sender: {
		  send: async (args: SenderArguments) => {
			TonConnectUI.sendTransaction({
			  messages: [
				{
				  address: args.to.toString(),
				  amount: args.value.toString(),
				  payload: args.body?.toBoc().toString("base64"),
				},
			  ],
			  validUntil: Date.now() + 6 * 60 * 1000, 
			});
		  },
		},
		connected: TonConnectUI.connected,
	  };

}
```
The validUntil field is required for security, so that when a connection is intercepted, someone cannot resend it.

Now we need to modify the `useContractWrapper.ts` hook to send a transaction, as well as update information every 5 seconds (the time of updating the TON blockchain).

Import useConnection.ts and use it:
```ts
import {useEffect, useState} from 'react';
import { Address, OpenedContract} from 'ton-core';
import { useInit } from './useInit';
import { MainContract } from '../contracts/ContractWrapper';
import { useTonClient } from './useTonClient';
import { useConnection } from './useConnection';

export function useContractWrapper() {
	const client = useTonClient();
	const connection = useConnection();

	const [contractData, setContractData] = useState<null | {
		recent_sender: Address;
		number: number;
	}>();

	const mainContract = useInit( async () => {
		if (!client) return;
		const contract = new MainContract(
			Address.parse("kQACwi82x8jaITAtniyEzho5_H1gamQ1xQ20As_1fboIfJ4h")
		);
		return client.open(contract) as OpenedContract<MainContract>;
	},[client]);

	useEffect( () => {
		async function getValue() {
			if(!mainContract) return;
			setContractData(null);
			const instack = await mainContract.getData();
			setContractData({
				recent_sender: instack.recent_sender,
				number: instack.number,
			});
		}
		getValue();
	}, [mainContract]);

	return {
		contract_address: mainContract?.address.toString(),
		...contractData,
	};
}
```
To update every 5 seconds, let's add the `sleep()` function and add it and getting data from the Get method to the `useEffect` hook:
```ts
import {useEffect, useState} from 'react';
import { Address, OpenedContract} from 'ton-core';
import { useInit } from './useInit';
import { MainContract } from '../contracts/ContractWrapper';
import { useTonClient } from './useTonClient';
import { useConnection } from './useConnection';

export function useContractWrapper() {
	const client = useTonClient();
	const connection = useConnection();

	const sleep =(time: number) =>
		new Promise((resolve) => setTimeout(resolve, time));


	const [contractData, setContractData] = useState<null | {
		recent_sender: Address;
		number: number;
	}>();

	const mainContract = useInit( async () => {
		if (!client) return;
		const contract = new MainContract(
			Address.parse("kQACwi82x8jaITAtniyEzho5_H1gamQ1xQ20As_1fboIfJ4h")
		);
		return client.open(contract) as OpenedContract<MainContract>;
	},[client]);

	useEffect( () => {
		async function getValue() {
			if(!mainContract) return;
			setContractData(null);
			const instack = await mainContract.getData();
			setContractData({
				recent_sender: instack.recent_sender,
				number: instack.number,
			});
			await sleep(5000);
			getValue();
		}
		getValue();
	}, [mainContract]);

	return {
		contract_address: mainContract?.address.toString(),
		...contractData,
	};
}
```
It remains to add the function of sending an internal message to `return`.
```ts
import {useEffect, useState} from 'react';
import { Address, OpenedContract, toNano} from 'ton-core';
import { useInit } from './useInit';
import { MainContract } from '../contracts/ContractWrapper';
import { useTonClient } from './useTonClient';
import { useConnection } from './useConnection';

export function useContractWrapper() {
	const client = useTonClient();
	const connection = useConnection();

	const sleep =(time: number) =>
		new Promise((resolve) => setTimeout(resolve, time));


	const [contractData, setContractData] = useState<null | {
		recent_sender: Address;
		number: number;
	}>();

	const mainContract = useInit( async () => {
		if (!client) return;
		const contract = new MainContract(
			Address.parse("kQACwi82x8jaITAtniyEzho5_H1gamQ1xQ20As_1fboIfJ4h")
		);
		return client.open(contract) as OpenedContract<MainContract>;
	},[client]);

	useEffect( () => {
		async function getValue() {
			if(!mainContract) return;
			setContractData(null);
			const instack = await mainContract.getData();
			setContractData({
				recent_sender: instack.recent_sender,
				number: instack.number,
			});
			await sleep(5000);
			getValue();
		}
		getValue();
	}, [mainContract]);

	return {
		contract_address: mainContract?.address.toString(),
		...contractData,
		sendInternalMessage: () => {
			return mainContract?.sendInternalMessage(connection.sender, toNano("0.05"));
		}
	};
}
```
Let's add sending a transaction to the UI, go to the `App.tsx` file and add a connection:
```ts
import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react'
import { useContractWrapper } from './hooks/useContractWrapper'
import { useConnection } from './hooks/useConnection';

function App() {
  const {
	recent_sender,
	number,
	contract_address,
  } = useContractWrapper();

  const { connected } = useConnection();


  return (
	<>
	  <TonConnectButton/>
	  <div>
	  <b>Contract Address:</b>
	  <div>{contract_address}</div>
	  <b>Last Sender Address</b>
	  <div>{recent_sender?.toString()}</div>
	  <b>Check num</b>
	  <div>{number}</div>
	  </div>
	</>

  )
}

export default App;
```
The connection will allow displaying a link to send a transaction:
```ts
import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react'
import { useContractWrapper } from './hooks/useContractWrapper'
import { useConnection } from './hooks/useConnection';

function App() {
  const {
	recent_sender,
	number,
	contract_address,
	sendInternalMessage,
  } = useContractWrapper();

  const { connected } = useConnection();


  return (
	<>
	  <TonConnectButton/>
	  <div>
	  <b>Contract Address:</b>
	  <div>{contract_address}</div>
	  <b>Last Sender Address</b>
	  <div>{recent_sender?.toString()}</div>
	  <b>Check num</b>
	  <div>{number}</div>

	  {connected && (
		<a
		  onClick={()=>{
			sendInternalMessage();
		  }}
		>
		  Send internal Message
		</a>
	  )}


	  </div>
	</>

  )
}

export default App;
```
Check sending transaction - `yarn dev`

## Conclusion

I write similar tutorials and analyzes on the TON network in my channel - https://t.me/ton_learn . I will be glad to your subscription.



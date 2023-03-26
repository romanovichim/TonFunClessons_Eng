## Introduction

An important part of decentralized applications is authorization using a crypto wallet. In this tutorial, we will step by step collect authorization for the TON blockchain using [tonconnect/sdk](https://github.com/ton-connect/sdk).

The task of the tutorial was to build a simple one-page application (website) with a button that implements authorization using the [Tonkeeper](https://tonkeeper.com/) wallet. For simplicity, many things that can be improved in terms of code optimization are omitted.

Also, we will not dwell on styles, since the goal is to parse an example that is convenient for future extension to suit your needs.

## Functional requirements

In our example, we implement:
- an authorization button that, when pressed, will give a QR code, or a link to authorization through Tonkeeper wallet
- the link will be given when the user enters our application from the phone, or opens it directly in the browser inside the wallet
- in all other cases (opening the application in the Desktop) we will show the QR code
- displaying the wallet address from which the user logged in
- displaying the network (test or main) in the header after authorization
- wallet disconnect from the application

It will look like this:

1) click on the authorization button

![1 test](./img/1_1.PNG)

2) scan the QR code in the application

![2 test](./img/1_3.jpg)

3) we will see the address of our wallet and the label of the test network

![3 test](./img/1_2.PNG)

Also in the tutorial, we will see how you can get a list of different wallets integrated into [tonconnect/sdk](https://github.com/ton-connect/sdk) so that the user can log in not only with tonkeeper.

## Install Vite
Before you begin, you must have Node and npm installed on your system. Our first step is to use the `vite` command to create a new application. This can be done with the `npm init` command without installing additional software. Open a terminal in a folder of your choice and run the following command.

	npm init vite@latest vite-tonconnect -- --template react-ts
	
Now let's go to the folder

	cd vite-tonconnect

And run the command

	 npm install 
	
Let's test that we did everything right:

	npm run dev	
	
Should see something like this:

![vite test](./img/1_4.PNG)
	 
## Install libraries

Install the libraries necessary to work with the TON blockchain:

	npm i ton ton-core ton-crypto

For authorization, you need the `tonconnect` library:
 
	npm i @tonconnect/sdk

To add a pinch of beauty, you will need the following libraries:

	npm and antd sass

To log in using TonConnect, you will need to use Tonkeeper, we will scan the QR code in our application and confirm it in the wallet. This means that you need a library to create qr codes:

	npm i react-qr-code

When authorizing, we will encounter the need to read the values of asynchronous selectors (to get a list of wallets), so we will install the `recoil` library:

	npm i recoil

If you call the ton libraries right now (for example, convert the address and display it to the user), then you will see the Buffer is not defined error. To get around this problem, install the library.

	npm i node-stdlib-browser vite-plugin-node-stdlib-browser

And add to the Vite configuration file `vite.config.ts` `nodePolyfills()` in plugins.

	import { defineConfig } from 'vite'
	import react from '@vitejs/plugin-react'
	import nodePolyfills from 'vite-plugin-node-stdlib-browser'

	// https://vitejs.dev/config/
	export default defineConfig({
	  plugins: [react(),nodePolyfills()],
	})

## Writing helper functions

In accordance with the functional requirements, we need helper functions:
- check if the device is mobile
- check if the device is a desktop
- auxiliary function of opening a link for a redirect after authorization

In the `src` folder we will create a `utils.ts` file in which we will add the `isMobile()` and `isDesktop()` functions. By the window property, `innerWidth` we will determine the device:

	export function isMobile(): boolean {
		return window.innerWidth <= 500;
	}

	export function isDesktop(): boolean {
		return window.innerWidth >= 1050;
	}

To open a link, use the [open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) method of the `window` interface:

	export function openLink(href: string, target = '_self') {
		window.open(href, target, 'noreferrer noopener');
	}

`noreferrer noopener` - needed for security purposes to prevent malicious links from intercepting a new opened tab, since the `JavaScript window.opener` object allows the newly opened tab to control the parent window.
 
## Connect TonConnect

The first thing to do is to create a connection, for this we will create a file in the `src` folder `connector.ts`. And let's import `TonConnect`:

import { TonConnect } from '@tonconnect/sdk';

To establish a connection, you need to call `new TonConnect()` and pass your application parameters there, when the user uses the wallet for authorization, he will see data about your application and will understand where he connects. Parameters or otherwise metadata has the following fields:

	{
	  "url": "<app-url>",                        // required
	  "name": "<app-name>",                      // required
	  "iconUrl": "<app-icon-url>",               // required
	  "termsOfUseUrl": "<terms-of-use-url>",     // optional
	  "privacyPolicyUrl": "<privacy-policy-url>" // optional
	}

The best practice is to place the manifest with metadata in the root of your application, but you can also place it on the github. For example, I will attach a link to the github from the repository with an example:

	const dappMetadata = {
		manifestUrl:
			'https://gist.githubusercontent.com/siandreev/75f1a2ccf2f3b4e2771f6089aeb06d7f/raw/d4986344010ec7a2d1cc8a2a9baa57de37aaccb8/gistfile1.txt',
	};
	
After the formation of metadata, it remains to call the connection, we get

	import { TonConnect } from '@tonconnect/sdk';

	const dappMetadata = {
		manifestUrl:
			'https://gist.githubusercontent.com/siandreev/75f1a2ccf2f3b4e2771f6089aeb06d7f/raw/d4986344010ec7a2d1cc8a2a9baa57de37aaccb8/gistfile1.txt',
	};

	export const connector = new TonConnect(dappMetadata);

If the user has previously connected their wallet, the connector will reconnect

For a convenient UX, you need to handle the situation when the user has previously connected the wallet and again entered your application. Let's make sure that in such a situation the connection is immediately restored.

To do this, we will use the [useEffect hook](https://legacy.reactjs.org/docs/hooks-effect.html), in the hook we will call `connector.restoreConnection()`. We will do this in the `App.tsx` file:

	import React, { useEffect } from 'react';
	import reactLogo from './assets/react.svg'
	import viteLogo from '/vite.svg'
	import './App.css'

	import { connector } from '../src/connector';

	function App() {
	  useEffect(() => {
			connector.restoreConnection();
		}, []);

	  return (
		<div>Auth will be here</div>
	  )
	}

	export default App


> I immediately imported styles, I will not dwell on them, since this tutorial covers exactly authorization

## Create custom hooks

For the authorization button, it will be convenient to use a few custom hooks. Let's create a separate hooks folder for them in which we will have four scripts:
- `useTonWallet.ts`
- `useTonWalletConnectionError.ts`
- `useSlicedAddress.ts`
- `useForceUpdate.ts`

Let's go through each of them.

#### useTonWallet

For the authorization button to work, you need to subscribe to connection status changes, we will do this using `connector.onStatusChange()`:

	import { Wallet } from '@tonconnect/sdk';
	import { useEffect, useState } from 'react';
	import { connector } from '../connector';

	export function useTonWallet() {
		const [wallet, setWallet] = useState<Wallet | null>(connector.wallet);

		useEffect(() => connector.onStatusChange(setWallet, console.error), []);

		return wallet;
	}

#### useTonWalletConnectionError

We will also handle errors using `connector.onStatusChange()`. We will separately handle the `UserRejectsError` error registered in `tonconnect/sdk`, it occurs when the user rejects the action in the wallet.

	import { UserRejectsError } from '@tonconnect/sdk';
	import { useCallback, useEffect } from 'react';
	import { connector } from '../connector';

	export function useTonWalletConnectionError(callback: () => void) {
		const errorsHandler = useCallback(
			(error: unknown) => {
				if (typeof error === 'object' && error instanceof UserRejectsError) {
					callback();
				}
			},
			[callback],
		);

		const emptyCallback = useCallback(() => {}, []);

		useEffect(() => connector.onStatusChange(emptyCallback, errorsHandler), [emptyCallback, errorsHandler]);
	}

#### useSlicedAddress

A convenient UX pattern for wallets is to display the user's wallet address after authorization. In TON Connect, addresses are transmitted in `0:<hex>` format (raw format), the so-called friendly format would be convenient for the user, so let's make a handler. Read more about address formats in TON [here](https://docs.ton.org/learn/overviews/addresses).

	import { CHAIN } from '@tonconnect/sdk';
	import { useMemo } from 'react';
	import { Address } from 'ton';


	export function useSlicedAddress(address: string | null | undefined, chain?: CHAIN) {
		return useMemo(() => {
			if (!address) {
				return '';
			}

			const userFriendlyAddress = Address.parseRaw(address).toString({ testOnly: chain === CHAIN.TESTNET });

			return userFriendlyAddress.slice(0, 4) + '...' + userFriendlyAddress.slice(-3);

		}, [address]);
	}

> I also note that this takes into account the option that the wallet can be in the test network

#### useForceUpdate

In most cases, React automatically handles components for re-rendering. The reason for this may be based on when the props or state were updated. However, our component (authorization button) depends on a third party - the user confirms the authorization action in their wallet, so it's important for us to force a refresh of the component, since React may not detect changes.

	import { useState } from 'react';

	export function useForceUpdate() {
		const [_, setValue] = useState(0);
		return () => setValue((value) => value + 1);
	}

## Get the list of wallets

Despite the fact that in this example we will use only the Tonkeeper wallet, TONConnect can offer the user a list of wallets to choose from. To do this, you need to get them.

Let's create a `state` folder in `src` and a `wallets-list.ts` file in it. In order to get a list of wallets from the connection, we use `connector.getWallets() `. In this tutorial, we will use `recoil` to manage states.

Let's create a selector:

	import { isWalletInfoInjected } from '@tonconnect/sdk';
	import { selector } from 'recoil';
	import { connector } from '../../src/connector';

	export const walletsListQuery = selector({
		key: 'walletsList',
		get: async () => {
			const walletsList = await connector.getWallets();
			
		},
	});

Also, when working with decentralized applications, situations may arise when we open an offer in the browser of a wallet and of course in this case it makes no sense to offer a list of wallets, it is better to immediately give the right one, for such a situation in `tonconnect/sdk` there is `isWalletInfoInjected`, thanks to which we can immediately get the desired wallet:

	import { isWalletInfoInjected } from '@tonconnect/sdk';
	import { selector } from 'recoil';
	import { connector } from '../../src/connector';

	export const walletsListQuery = selector({
		key: 'walletsList',
		get: async () => {
			const walletsList = await connector.getWallets();

			const embeddedWallet = walletsList.filter(isWalletInfoInjected).find((wallet) => wallet.embedded);

			return {
				walletsList,
				embeddedWallet,
			};
		},
	});

## Authorization button component

Finally, let's move on to the authorization button itself. Let's import the scripts that we wrote before, and also don't forget everything we need for layout:

	import { DownOutlined } from '@ant-design/icons';
	import { Button, Dropdown, Menu, Modal, notification, Space } from 'antd';
	import React, { useCallback, useEffect, useState } from 'react';
	import QRCode from 'react-qr-code';
	import { useRecoilValueLoadable } from 'recoil';
	import { addReturnStrategy, connector } from '../../../src/connector';
	import { useForceUpdate } from '../../../src/hooks/useForceUpdate';
	import { useSlicedAddress } from '../../../src/hooks/useSlicedAddress';
	import { useTonWallet } from '../../../src/hooks/useTonWallet';
	import { useTonWalletConnectionError } from '../../../src/hooks/useTonWalletConnectionError';
	import { walletsListQuery } from '../../../src/state/wallets-list';
	import { isDesktop, isMobile, openLink } from '../../../src/utils';
	import './style.scss';

You may have noticed that in the previous steps, there was no mention of disconnecting the wallet from the application (disconnect). According to the logic of our example, after authorization, the user is shown the address of the connected wallet, when you click on the button, a drop-down menu with an option will appear. Let's do this with `Menu` from the `antd` library.

	const menu = (
		<Menu
			onClick={() => connector.disconnect()}
			items={[
				{
					label: 'Disconnect',
					key: '1',
				},
			]}
		/>
	);

It's time for the component itself, in fact, authorization is just getting an authorization link and displaying it to the user (either a link or a QR code), so our most important hook is processing the link:

	export function AuthButton() {
		const [modalUniversalLink, setModalUniversalLink] = useState('');

		return (
			<>
				<div className="auth-button">

				</div>

			</>
		);
	}

This hook will allow you to set the value of the authorization link. If the user is not authorized, he needs to display a button that starts the authorization process, if authorized, display an address button that will allow you to disable the wallet. To do this, you need to understand whether the wallet is connected, the hook that we wrote before `useTonWallet()` will help us with this. It's so important to remember that our component receives change information from a third party, which means we need to force the component to update:

	export function AuthButton() {
		const [modalUniversalLink, setModalUniversalLink] = useState('');
		const forceUpdate = useForceUpdate();
		const wallet = useTonWallet();
		
		return (
			<>
				<div className="auth-button">
					{wallet ? (
					<Dropdown overlay={menu}>
						<Button shape="round" type="primary">
							<Space>
								{address}
								<DownOutlined />
							</Space>
						</Button>
					</Dropdown>
				) : (
					<Button shape="round" type="primary" onClick={handleButtonClick}>
						Connect Wallet
					</Button>
				)}
				</div>
			</>
		);
	}

Here we will process errors and get a list of wallets, and also immediately convert the address:

	export function AuthButton() {
		const [modalUniversalLink, setModalUniversalLink] = useState('');
		const forceUpdate = useForceUpdate();
		const wallet = useTonWallet();
		const onConnectErrorCallback = useCallback(() => {
			setModalUniversalLink('');
			notification.error({
				message: 'Connection was rejected',
				description: 'Please approve connection to the dApp in your wallet.',
			});
		}, []);
		useTonWalletConnectionError(onConnectErrorCallback);

		const walletsList = useRecoilValueLoadable(walletsListQuery);

		const address = useSlicedAddress(wallet?.account.address, wallet?.account.chain);

		return (
			<>
				<div className="auth-button">
					{wallet ? (
						<Dropdown overlay={menu}>
							<Button shape="round" type="primary">
								<Space>
									{"hi"}
									<DownOutlined />
								</Space>
							</Button>
						</Dropdown>
					) : (
						<Button shape="round" type="primary" onClick={handleButtonClick}>
							Connect Wallet
						</Button>
					)}
				</div>

			</>
		);
	}

Let's process the keystroke, the first thing to check is whether the list of wallets has loaded, if not, we'll wait:

		const handleButtonClick = useCallback(async () => {
			
			if (!(walletsList.state === 'hasValue')) {
				setTimeout(handleButtonClick, 200);
			}

		}, [walletsList]);

When getting a list of wallets, we checked the case when we open an application inside a wallet, it's time to use this variable. If this is not a desktop and the application is open inside the wallet, we will use this particular wallet to connect:

	const handleButtonClick = useCallback(async () => {
		if (!(walletsList.state === 'hasValue')) {
			setTimeout(handleButtonClick, 200);
		}

		if (!isDesktop() && walletsList.contents.embeddedWallet) {
			connector.connect({ jsBridgeKey: walletsList.contents.embeddedWallet.jsBridgeKey });
			return;
		}


	}, [walletsList]);

It's time to get that very link for authorization, take the first one from the list of wallets - this is Tonkeeper and get the link using `connector.connect()`:

	const handleButtonClick = useCallback(async () => {
		if (!(walletsList.state === 'hasValue')) {
			setTimeout(handleButtonClick, 200);
		}

		if (!isDesktop() && walletsList.contents.embeddedWallet) {
			connector.connect({ jsBridgeKey: walletsList.contents.embeddedWallet.jsBridgeKey });
			return;
		}

		const tonkeeperConnectionSource = {
			universalLink: walletsList.contents.walletsList[0].universalLink,
			bridgeUrl: walletsList.contents.walletsList[0].bridgeUrl,
		};

		const universalLink = connector.connect(tonkeeperConnectionSource);

	}, [walletsList]);

Now it remains to deal with mobile devices, it is not convenient to offer a QR code, so we will immediately throw a link, in other cases we will send a link for authorization under the QR code. The helper function that we wrote earlier will help us with this:

		const handleButtonClick = useCallback(async () => {
			// Use loading screen/UI instead (while wallets list is loading)
			if (!(walletsList.state === 'hasValue')) {
				setTimeout(handleButtonClick, 200);
			}

			if (!isDesktop() && walletsList.contents.embeddedWallet) {
				connector.connect({ jsBridgeKey: walletsList.contents.embeddedWallet.jsBridgeKey });
				return;
			}

			const tonkeeperConnectionSource = {
				universalLink: walletsList.contents.walletsList[0].universalLink,
				bridgeUrl: walletsList.contents.walletsList[0].bridgeUrl,
			};

			const universalLink = connector.connect(tonkeeperConnectionSource);

			if (isMobile()) {
				openLink(addReturnStrategy(universalLink, 'none'), '_blank');
			} else {
				setModalUniversalLink(universalLink);
			}
		}, [walletsList]);

It remains to add a modal and here is the final `AuthButton.tsx` component:

	import { DownOutlined } from '@ant-design/icons';
	import { Button, Dropdown, Menu, Modal, notification, Space } from 'antd';
	import React, { useCallback, useEffect, useState } from 'react';
	import QRCode from 'react-qr-code';
	import { useRecoilValueLoadable } from 'recoil';
	import { addReturnStrategy, connector } from '../../../src/connector';
	import { useForceUpdate } from '../../../src/hooks/useForceUpdate';
	import { useSlicedAddress } from '../../../src/hooks/useSlicedAddress';
	import { useTonWallet } from '../../../src/hooks/useTonWallet';
	import { useTonWalletConnectionError } from '../../../src/hooks/useTonWalletConnectionError';
	import { walletsListQuery } from '../../../src/state/wallets-list';
	import { isDesktop, isMobile, openLink } from '../../../src/utils';
	import './style.scss';


	const menu = (
		<Menu
			onClick={() => connector.disconnect()}
			items={[
				{
					label: 'Disconnect',
					key: '1',
				},
			]}
		/>
	);

	export function AuthButton() {
		const [modalUniversalLink, setModalUniversalLink] = useState('');
		const forceUpdate = useForceUpdate();
		const wallet = useTonWallet();
		const onConnectErrorCallback = useCallback(() => {
			setModalUniversalLink('');
			notification.error({
				message: 'Connection was rejected',
				description: 'Please approve connection to the dApp in your wallet.',
			});
		}, []);
		useTonWalletConnectionError(onConnectErrorCallback);

		const walletsList = useRecoilValueLoadable(walletsListQuery);

		const address = useSlicedAddress(wallet?.account.address, wallet?.account.chain);

		useEffect(() => {
			if (modalUniversalLink && wallet) {
				setModalUniversalLink('');
			}
		}, [modalUniversalLink, wallet]);

		const handleButtonClick = useCallback(async () => {
			if (!(walletsList.state === 'hasValue')) {
				setTimeout(handleButtonClick, 200);
			}

			if (!isDesktop() && walletsList.contents.embeddedWallet) {
				connector.connect({ jsBridgeKey: walletsList.contents.embeddedWallet.jsBridgeKey });
				return;
			}

			const tonkeeperConnectionSource = {
				universalLink: walletsList.contents.walletsList[0].universalLink,
				bridgeUrl: walletsList.contents.walletsList[0].bridgeUrl,
			};

			const universalLink = connector.connect(tonkeeperConnectionSource);

			if (isMobile()) {
				openLink(addReturnStrategy(universalLink, 'none'), '_blank');
			} else {
				setModalUniversalLink(universalLink);
			}
		}, [walletsList]);

		return (
			<>
				<div className="auth-button">
					{wallet ? (
						<Dropdown overlay={menu}>
							<Button shape="round" type="primary">
								<Space>
									{address}
									<DownOutlined />
								</Space>
							</Button>
						</Dropdown>
					) : (
						<Button shape="round" type="primary" onClick={handleButtonClick}>
							Connect Wallet
						</Button>
					)}
				</div>
				<Modal
					title="Connect to Tonkeeper"
					open={!!modalUniversalLink}
					onOk={() => setModalUniversalLink('')}
					onCancel={() => setModalUniversalLink('')}
				>
					<QRCode
						size={256}
						style={{ height: '260px', maxWidth: '100%', width: '100%' }}
						value={modalUniversalLink}
						viewBox={`0 0 256 256`}
					/>
				</Modal>
			</>
		);
	}

## Application header component

For the convenience of working with decentralized applications, it is important to display in which test or main network the action takes place. We will display to the user in which network the wallet that he used for authorization next to the name of the application. To do this, let's create a separate component `AppTitle.tsx`.

	import { CHAIN } from '@tonconnect/sdk';
	import React, { useEffect, useRef, useState } from 'react';
	import { useTonWallet } from '../../../src/hooks/useTonWallet';
	import './style.scss';

	const chainNames = {
		[CHAIN.MAINNET]: 'mainnet',
		[CHAIN.TESTNET]: 'testnet',
	};

	export function AppTitle() {
		const wallet = useTonWallet();

		return (
			<>
				<div className="dapp-title" >
					<span className="dapp-title__text">My Dapp</span>
					{wallet && <span className="dapp-title__badge">{chainNames[wallet.account.chain]}</span>}
				</div>
			</>
		);
	}

As you can see, here everyone just uses our hook to get the current wallet from the wallet, we get the network number and using the `CHAIN` directory wired into `tonconnect/sdk` we get the network.

## Add our components to the page

In the App.tsx file, add the components we wrote to the header:

	import React, { useEffect } from 'react';
	import { AppTitle } from '../src/components/AppTitle/AppTitle';
	import { AuthButton } from '../src/components/AuthButton/AuthButton';
	import { connector } from '../src/connector';
	import 'antd/dist/reset.css';
	import './app.scss';

	function App() {
	  useEffect(() => {
			connector.restoreConnection();
		}, []);

	  return (
		<div className="app">
		  <header>
			<AppTitle />
			<AuthButton />
		  </header>
		  <main>
		  </main>
		</div>    
	  )
	}

	export default App

It is also important in the `main.tsx` file to wrap the application in `RecoilRoot` since we are using selectors.

	import React from 'react'
	import ReactDOM from 'react-dom/client'
	import App from './App'
	import './index.scss';
	import { RecoilRoot } from 'recoil';


	ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	  <RecoilRoot>
	  	<React.StrictMode>
			<App />
	  	</React.StrictMode>
	  </RecoilRoot>,
	)

And that's all. In the second part, we will look at how to send transactions using a connected wallet and expand on our example.

## Conclusion

There is an example on github. I publish similar articles [here](https://t.me/ton_learn). Thank you for your attention.



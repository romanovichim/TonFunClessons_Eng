# TON JS Client

## 🚨 Repository Deprecated and Moved! 🚨

**This repository has been deprecated and is no longer actively maintained.** We have moved our project to a new repository, which you can find here: [ton-org/ton](https://github.com/ton-org/ton). The new NPM package is available here: [@ton/ton](https://www.npmjs.com/package/@ton/ton)

Please make sure to update your bookmarks and star the new repository to stay up-to-date with the latest developments and updates. This repository will be archived and eventually removed.

**Thank you for your continued support!**
___________

[![Version npm](https://img.shields.io/npm/v/ton.svg?logo=npm)](https://www.npmjs.com/package/ton)

Cross-platform client for TON blockchain.

## Features

- 🚀 Create new wallets
- 🍰 Get balance
- ✈️ Transfers

## Install

```bash
yarn add ton ton-crypto ton-core buffer
```

#### Browser polyfill

```js
// Add before using library
require("buffer");
```

## Usage

To use this library you need HTTP API endpoint, you can use one of the public endpoints:

- Mainnet: https://toncenter.com/api/v2/jsonRPC
- Testnet: https://testnet.toncenter.com/api/v2/jsonRPC

```js
import { TonClient, WalletContractV4, internal } from "ton";
import { mnemonicNew, mnemonicToPrivateKey } from "ton-crypto";

// Create Client
const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
});

// Generate new key
let mnemonics = await mnemonicNew();
let keyPair = await mnemonicToPrivateKey(mnemonics);

// Create wallet contract
let workchain = 0; // Usually you need a workchain 0
let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
let contract = client.open(wallet);

// Get balance
let balance: bigint = await contract.getBalance();

// Create a transfer
let seqno: number = await contract.getSeqno();
let transfer = await contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [internal({
    value: '1.5',
    to: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N',
    body: 'Hello world',
  })]
});

```

## Docs

[Documentation](https://ton-community.github.io/ton/)

## Acknowledgements

This library is developed by the [Whales Corp.](https://tonwhales.com/) and maintained by [Dan Volkov](https://github.com/dvlkv).

## License

MIT

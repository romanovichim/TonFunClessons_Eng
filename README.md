# Lessons on developing smart contracts on FunC for The Open Network(TON)

Lessons on developing smart contracts on FunC for The Open Network(TON). The lessons are located in the appropriate folders in .md format, and a code is attached to each lesson. Our community - [here](https://t.me/ton_learn). The lessons are first done in Russian [here](https://github.com/romanovichim/TonFunClessons_ru/), and then I gradually translate them into English, if you want to help - the donation addresses are below.

## Create Smart Contracts on TON 

| Number | Lesson | Considered concepts | Link | 
| ------------- | ------------- | ------------- | ------------- |
| 1 | Simple FunC Smart Contract | Types, exceptions, functions, contract deployment, GET requests in testnet | [LINK](./lessons/smartcontract/1lesson/firstlesson.md)  | 
| 2 | FunC tests for the first smart contract  | FunC test logic, test structure, tuples  | [LINK](./lessons/smartcontract/2lesson/secondlesson.md) | 
| 3 | Messages, let's write a proxy contract |  Messages, message modes, primitives, cell references | [LINK](./lessons/smartcontract/3lesson/thirdlesson.md) | 
| 4 | Testing messages | Addresses, TL-B, register c5 and output actions |  [LINK](./lessons/smartcontract/4lesson/forthlesson.md) | 
| 5 | Flags and data storage in a contract | Op - for identification of operations, Computational fees, primitive data storage in the contract  | [LINK](./lessons/smartcontract/5lesson/fifthlesson.md) |  
| 6 | Testing flags and data storage in the contract |  Various tests for flag messages and data storage in register c4  | [LINK](./lessons/smartcontract/6lesson/sixthlesson.md) |  
| 7 | HashMap storage  | Working with Dictionaries (hashmap): storage, deletion, search  | [LINK](./lessons/smartcontract/7lesson/seventhlesson.md) | 
| 8 | Testing HashMap storage  | Testing HashMap(dictionaries), special toncli functions for testing, register c7  | [LINK](./lessons/smartcontract/8lesson/eighthlesson.md)  | 
| 9 | Analyzing the Jetton Standard(Fungible Token)  | Tokens, standards, Jetton standard, StateInit, workchains  | [LINK](./lessons/smartcontract/9lesson/ninthlesson.md)  | 
| 10 | Analyzing the NFT Standard (Non-Fungible Token)  |  NFT, standard NFT, collections and individual NFTs | [LINK](./lessons/smartcontract/10lesson/tenthlesson.md)  | 
> Writing such tutorials is a lot of work - I will be glad to see your star on the repository 🌟

# Create a Pipeline to work with smart contracts

| Lesson | Considered concepts | Link | 
| ------------- | ------------- | ------------- |
| Simple smart contract in ton-community/sandbox | create a ton-community/sandbox project, write and compile a contract|  | 
| Writing tests in ton-community/sandbox | jest framework tests  | | 
| Deploying a smart contract using a QR code | pipeline for deploying a smart contract to the test network |  | 
| Chatbot smart contract | analyzing the smart contract for future message tests |   | 
| Writing onchain tests on the testnet | message test logic, onchain tests  |   | 

> Author of lessons publishes new tutorials, writes about interesting blockchain companies [here](https://t.me/ton_learn)

# Get requests in TON

| Lesson | Considered concepts | Link | 
| ------------- | ------------- | ------------- | 
| ton.js | Getting data from a smart contract using JS(ton.js)  | [LINK](./lessons/requests/20lesson/tonjs_eng.md) | 
| ADNL Protocol Intro | Connection to ADNL, getAccountState, getMasterchaininfo  |  | 
| ADNL Run GetMethod | Get method call, NFT sales analytics logic  |  | 
| Collect account txes using ADNL | Logical time, recent account transactions  |  | 

# Authorization and sending transactions from UI in 5 minutes with TON Connect React UI

| Lesson | Considered concepts | Link | 
| ------------- | ------------- | ------------- | 
| TON Connect auth button| a simple site with authorization through TonConnect, the concept of separation into wallets and Web3 applications |  | 
| TON Connect send transaction | contract wrapper usage, send transaction, call get-method from ui  |  | 

# Golang Scripts - convenient scripts for working with TON

| Lesson | Considered concepts | Link | 
| ------------- | ------------- | ------------- | 
| Create a wallet and deploy a smart contract | Working with TON using GO, creating a wallet, hexBOC contract form, sending messages, calling the GET method | [LINK](./lessons/golang/14lesson/wallet_eng.md) | 
| NFT collection creation | We get information about the NFT collection and an individual element, Deploy the collection and element to the network | [LINK](./lessons/golang/15lesson/NFTCollectionDeploy_eng.md) | 
| We issue our own tokens: ICO | Jettons ICO, Jetton wallet balance| [LINK](./lessons/golang/16lesson/ICO.md) | 

# Bonus

| Lesson | Considered concepts | Link | 
| ------------- | ------------- | ------------- | 
| Random in TON| Raffle Smart Contract, global variables and c4, admin functions for contract balance  |  | 
|  NFT Sale | Sale logic based on smart contracts,how to "burn" contract | [LINK](./lessons/bonus/17lesson/nftsale_eng.md) |
| Hacking a simple contract | Vulnerability due to compiler optimization of the code in the absence of impure   | [LINK](./lessons/bonus/18lesson/hack_eng.md) | 

# Архив

[Go to the lesson arhive](./arhive)

## Development assistance

Ton:  EQAvmc9oVnOvLFlUAgeNmZNZoKeDg9vTEiAQxNFw-t5mh3m7

 
## LICENSE

CC BY-NC-ND 4.0 https://creativecommons.org/licenses/by-nc-nd/4.0/
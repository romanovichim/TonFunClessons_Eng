# Create wallet and deploy contract with GO

## Introduction

In the tondev chat, questions often arise about interacting with TON using popular programming languages, especially questions about interacting with NFT collections and contracts in general. Therefore, for [ton_learn](https://t.me/ton_learn) I decided to make 2 lessons where we interact with the TON blockchain using some scripts, so that the reader can easily work with smart contracts in TON.

The tasks are:
- in this lesson we will make a blank with a wallet, which we will use later, and also figure out how to deploy and interact with the contract from the first lesson
- in the next lesson we will deploy the NFT collection, and also pull the Get-methods

To work with TON scripts, we will use the GO library [tonutils-go](https://github.com/xssnick/tonutils-go). This library has an excellent balance between high-level and low-level, so it allows you to write simple scripts, but at the same time does not deprive us of various possibilities for working with the TON blockchain.

Even if you are not familiar with GO, I am sure that this lesson and scripts will be clear to you, but just in case, at the very end of the lesson there are links to materials that will allow you to quickly get used to GO.

> I would also like to note that this library has good documentation with examples.

## Create wallet

We need a wallet to send messages inside TON (those that come to recv_internal()). Essentially, a wallet is a smart contract capable of receiving external messages (those recv_external()) and sending internal ones. Therefore, before moving on to deploying a smart contract, we first create a wallet.

### Connecting to the network

A wallet in the TON network is a smart contract, in order to deploy a smart contract to a test or main network, we need to connect to the network, for this we need its config:
- [testnet config](https://ton-blockchain.github.io/testnet-global.config.json)
- [mainnet config](https://ton-blockchain.github.io/global.config.json)(mainnet)

We will interact with the network through light servers.

> Light client (English lite-client) is a software that connects to full nodes to interact with the blockchain. They help users access and interact with the blockchain without the need to synchronize the entire blockchain.

So let's connect:

	client := liteclient.NewConnectionPool()

	configUrl := "https://ton-blockchain.github.io/testnet-global.config.json"
	
	err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
	if err != nil {
		panic(err)
	}
	api := ton.NewAPIClient(client)

We get the lightserver api.

> If you look at the configs you can see some lightservers inside, which one does the library choose? - The first with which there will be a successful connection

### Seed phrase

To generate a wallet, we need a public / private key pair (we will receive them using the Seed phrase) and the [InitialAccountWallet](https://github.com/ton-blockchain/ton/blob/master/tl/generate/scheme/tonlib_api.tl#L60) structure corresponding to one of the available wallet versions.

> Seed phrase - a sequence of words used to generate keys.

Let's generate a seed phrase using `wallet.NewSeed()` and print it so that we can copy and use the wallet in the future.

	seed := wallet.NewSeed()
	fmt.Println("Seed phrase:")
	fmt.Println(seed)

This phrase can and should be saved in order to use the wallet in the future.

We generate a wallet and display the address.

	w, err := wallet.FromSeed(api, seed, wallet.V3)
	if err != nil {
		log.Fatalln("FromSeed err:", err.Error())
		return
	}

	fmt.Println(w.Address())
	
You can read more about different wallet versions [here](https://github.com/toncenter/tonweb/blob/master/src/contract/wallet/WalletSources.md).

### "Activate" wallet

According to [documentation](https://ton.org/docs/#/payment-processing/overview?id=deploying-wallet), Toncoin must be sent to the received address. The testnet has a bot https://t.me/testgiver_ton_bot for this. On the mainnet, I will attach the official [page](https://ton.org/buy-toncoin).

### Get the balance

Our wallet is ready and in order to get the balance, you need to get the current information about the network (namely the current block).

	block, err := api.CurrentMasterchainInfo(context.Background())
	if err != nil {
		log.Fatalln("CurrentMasterchainInfo err:", err.Error())
		return
	}
	
And then get the balance from the block:

	balance, err := w.GetBalance(context.Background(), block)
	if err != nil {
		log.Fatalln("GetBalance err:", err.Error())
		return
	}

	fmt.Println(balance)

Final `createwallet.go` code:


	package main

	import (
		"context"
		"log"
		"fmt"

		"github.com/xssnick/tonutils-go/liteclient"
		"github.com/xssnick/tonutils-go/ton"
		"github.com/xssnick/tonutils-go/ton/wallet"
	)

	func main() {


		client := liteclient.NewConnectionPool()

		configUrl := "https://ton-blockchain.github.io/testnet-global.config.json"


		err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
		if err != nil {
			panic(err)
		}
		api := ton.NewAPIClient(client)

		seed := wallet.NewSeed()
		fmt.Println("Seed phrase:")
		fmt.Println(seed)

		w, err := wallet.FromSeed(api, seed, wallet.V3)
		if err != nil {
			log.Fatalln("FromSeed err:", err.Error())
			return
		}

		fmt.Println(w.Address())

		block, err := api.CurrentMasterchainInfo(context.Background())
		if err != nil {
			log.Fatalln("CurrentMasterchainInfo err:", err.Error())
			return
		}


		balance, err := w.GetBalance(context.Background(), block)
		if err != nil {
			log.Fatalln("GetBalance err:", err.Error())
			return
		}

		fmt.Println(balance)

	}

Before we move on, we will move the generation of the wallet according to the seed phrase into a separate function.

### Wallet function

Since we already have a seed phrase, we do not need to generate it anymore, all that remains is to collect the wallet.

	func getWallet(api *ton.APIClient) *wallet.Wallet {
		words := strings.Split("write your seed phrase here", " ")
		w, err := wallet.FromSeed(api, words, wallet.V3)
		if err != nil {
			panic(err)
		}
		return w
	}
	
An example of generating a wallet with a similar function is in a separate file `walletfunc.go`.

## Deploy smart contract

### hexBoc smart contract

Now that we have a wallet with a Toncoin balance on it, we can deploy smart contracts. In the `tonutils-go` library, you can deploy a smart contract in the form of hexBoc. Boc is a serialized form of a smart contract (bag-of-cells).

The easiest way to translate a smart contract into a similar form is to use a fift script. Let's take the fift code from the first smart contract and write a script that will translate it into hexBoc.


	"Asm.fif" include
	// automatically generated from `C:\Users\7272~1\AppData\Local\toncli\toncli\func-libs\stdlib-tests.func` `C:\Users\7272~1\Documents\chain\firsttest\wallet\func\code.func` 
	PROGRAM{
	  DECLPROC recv_internal
	  128253 DECLMETHOD get_total
	  recv_internal PROC:<{
		//  in_msg_body
		DUP	//  in_msg_body in_msg_body
		SBITS	//  in_msg_body _2
		32 LESSINT	//  in_msg_body _4
		35 THROWIF
		32 LDU	//  _24 _23
		DROP	//  n
		c4 PUSH	//  n _11
		CTOS	//  n ds
		64 LDU	//  n _26 _25
		DROP	//  n total
		SWAP	//  total n
		ADD	//  total
		NEWC	//  total _18
		64 STU	//  _20
		ENDC	//  _21
		c4 POP
	  }>
	  get_total PROC:<{
		// 
		c4 PUSH	//  _1
		CTOS	//  ds
		64 LDU	//  _8 _7
		DROP	//  total
	  }>
	}END>c
	
> If you went through the first lesson, then the Fift contract code is in the fift folder

Now the script that will translate the code into hexBOC format:


	#!/usr/bin/fift -s
	"TonUtil.fif" include
	"Asm.fif" include

	."first contract:" cr

	"first.fif" include
	2 boc+>B dup Bx. cr cr

I will not dwell on fift in detail, this is beyond the scope of this lesson, I will only note:
- boc+>B - serializes to boc format
- cr - displays the value in a string

> You can run the script either using the familiar toncli, namely `toncli fift run` , or as described [here](https://ton.org/docs/#/compile?id=fift).

An example script is in the `print-hex.fif` file.

As a result, we will get:

B5EE9C72410104010038000114FF00F4A413F4BCF2C80B0102016202030032D020D749C120F263D31F30ED44D0D33F3001A0C8CB3FC9ED540011A1E9FBDA89A1A67E693

### Approaching the deployment of the contract

We take our blank with the wallet `walletfunc.go` from it we will make a contract deployment script. The first thing we will do is add the `getContractCode()` function, which will convert the hexBOC received earlier into bytes:

	func getContractCode() *cell.Cell {
		var hexBOC = "B5EE9C72410104010038000114FF00F4A413F4BCF2C80B0102016202030032D020D749C120F263D31F30ED44D0D33F3001A0C8CB3FC9ED540011A1E9FBDA89A1A67E61A6614973"
		codeCellBytes, _ := hex.DecodeString(hexBOC)

		codeCell, err := cell.FromBOC(codeCellBytes)
		if err != nil {
			panic(err)
		}

		return codeCell
	}

### Smart contract deployment process

To deploy a smart contract, we need to form a `StateInit`. `StateInit` is a combination of the smart contract code we already have and the smart contract data. The smart contract data is what we want to put in the `c4` register, often the address of the owner of the smart contract is put there to manage it. You could see examples in lessons 9 and 10, where the owner of the NFT collection or Jetton was stored in `c4`. In our example, we can put 0 or any number there, the main thing is 64 bits, so that it is 64 bits, for the contract logic to work correctly. Let's make a separate function for the data:

	func getContractData() *cell.Cell {
		data := cell.BeginCell().MustStoreUInt(2, 64).EndCell()

		return data
	}

Their StateInit thanks to hashing calculates the address of the smart contract.

It is necessary to send a message to the received address and it is important not to forget about a small amount of TON, since smart contracts must have a positive balance in order to be able to pay for the storage and processing of their data in the blockchain.

You also need to prepare some body for the message, but it can be empty depending on your situation.

In `tonutils-go`, all this logic is inside the `DeployContract` function, calling it in our case will look like this:

	msgBody := cell.BeginCell().MustStoreUInt(0, 64).EndCell()

	fmt.Println("Deploying NFT collection contract to net...")
	addr, err := w.DeployContract(context.Background(), tlb.MustFromTON("0.02"),
		msgBody, getContractCode(), getContractData(), true)
	if err != nil {
		panic(err)
	}

	fmt.Println("Deployed contract addr:", addr.String())

The `true` parameter specifies whether to "wait" for confirmation that the message has been sent.

> It is important to note that since we get the address hashed, it will not work to deploy the same contract twice with the same data, the message will simply come to an existing contract.

Final `deploycontract.go` code:


	package main

	import (
		"context"
		"log"
		"fmt"
		"encoding/hex"
		"strings"

		"github.com/xssnick/tonutils-go/liteclient"
		"github.com/xssnick/tonutils-go/ton"
		"github.com/xssnick/tonutils-go/ton/wallet"
		"github.com/xssnick/tonutils-go/tlb"
		"github.com/xssnick/tonutils-go/tvm/cell"
	)

	func main() {


		client := liteclient.NewConnectionPool()

		configUrl := "https://ton-blockchain.github.io/testnet-global.config.json"


		err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
		if err != nil {
			panic(err)
		}
		api := ton.NewAPIClient(client)

		w := getWallet(api)

		fmt.Println(w.Address())

		block, err := api.CurrentMasterchainInfo(context.Background())
		if err != nil {
			log.Fatalln("CurrentMasterchainInfo err:", err.Error())
			return
		}


		balance, err := w.GetBalance(context.Background(), block)
		if err != nil {
			log.Fatalln("GetBalance err:", err.Error())
			return
		}

		fmt.Println(balance)



		msgBody := cell.BeginCell().MustStoreUInt(0, 64).EndCell()

		fmt.Println("Deploying NFT collection contract to net...")
		addr, err := w.DeployContract(context.Background(), tlb.MustFromTON("0.02"),
			msgBody, getContractCode(), getContractData(), true)
		if err != nil {
			panic(err)
		}

		fmt.Println("Deployed contract addr:", addr.String())

	}


	func getWallet(api *ton.APIClient) *wallet.Wallet {
		words := strings.Split("write your seed phrase here", " ")
		w, err := wallet.FromSeed(api, words, wallet.V3)
		if err != nil {
			panic(err)
		}
		return w
	}

	func getContractCode() *cell.Cell {
		var hexBOC = "B5EE9C72410104010038000114FF00F4A413F4BCF2C80B0102016202030032D020D749C120F263D31F30ED44D0D33F3001A0C8CB3FC9ED540011A1E9FBDA89A1A67E61A6614973"
		codeCellBytes, _ := hex.DecodeString(hexBOC)

		codeCell, err := cell.FromBOC(codeCellBytes)
		if err != nil {
			panic(err)
		}

		return codeCell
	}

	func getContractData() *cell.Cell {
		data := cell.BeginCell().MustStoreUInt(2, 64).EndCell()

		return data
	}

## Sending a message

Now let's test our smart contract, namely, send a message, after which the contract will have to add it to the number in register c4 and save the resulting value. Let's take our blank with the wallet `walletfunc.go` and add the message sending code to it:


	fmt.Println("Let's send message")
	err = w.Send(context.Background(), &wallet.Message{
	 Mode: 3,
	 InternalMessage: &tlb.InternalMessage{
	  IHRDisabled: true,
	  Bounce:      true,
	  DstAddr:     address.MustParseAddr("your contract address"),
	  Amount:      tlb.MustFromTON("0.05"),
	  Body:        cell.BeginCell().MustStoreUInt(11, 32).EndCell(),
	 },
	}, true)
	if err != nil {
	 fmt.Println(err)
	}

The message scheme is still the same as before) It is discussed in more detail in lesson 3. We send a message from our wallet.

## Call the GET method

Now it remains to check whether the values were summed up in the smart contract. To do this, tonutils-go has RunGetMethod(), in which you need to pass the current block, the address of the smart contract, the method and parameters for the methods.


	fmt.Println("Get Method")
	addr := address.MustParseAddr("your contract address")

	// run get method 
	res, err := api.RunGetMethod(context.Background(), block, addr, "get_total")
	if err != nil {
		// if contract exit code != 0 it will be treated as an error too
		panic(err)
	}

	fmt.Println(res)

It is important to note that if you send a message and call Get contract in a row, the data may not have time to update in the blockchain and you may get the old value. Therefore, we add between sending messages and the Get method, receiving a new block. And [time.Sleep](https://www.geeksforgeeks.org/time-sleep-function-in-golang-with-examples/). Or we comment on the sending of the message and separately call the get method).

> In TON, blocks are updated in 5 seconds.

Sample code is in the `sendandget.go` file

## Conclusion

In the next tutorial, we will deploy the nft collection. I also wanted to note that tonutil-go has a donation address on their page.

## GO Supplement

I have collected a couple of links here that will speed up your understanding of the scripts from this lesson.

### Installing GO

https://go.dev/

### Hello world on GO

https://gobyexample.com/hello-world

### Syntax in 15 minutes

https://learnxinyminutes.com/docs/go/

### Error No required module

https://codesource.io/how-to-install-github-packages-in-golang/

### What is context

https://gobyexample.com/context
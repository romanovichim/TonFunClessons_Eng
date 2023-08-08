## Introduction
## What is an ICO
ICO - Initial Coin Offering (initial placement of tokens) - issuance by any project or company of its own money - tokens (cryptocurrency) in order to attract investments.

### Why ICO is needed
Conducting an ICO by a project allows you to provide it with funding, which is necessary for development, development and scaling. Usually, when conducting an ICO, it is assumed that the tokens will cost more over time. I note that "decent" projects, in their roadmaps, lay down various mechanics that do not allow the price of the token to fall sharply, provoking an even sharper price drop further.

If you are curious to understand how profitable ICOs are, then you can see the statistics on the ROI of ICO projects [here](https://icodrops.com/ico-stats/).

> Filter by USD ROI to see top projects.

### Important: Risks

Speaking about ICO, one cannot ignore the risks, in fact, when buying tokens, you buy records in the blockchain, the value of which is provided only by the token issuer project. On the technical side, a smart contract with which an ICO is carried out can be hacked or initially have a backdoor that will allow the owner of the smart contract to change the terms of the ICO, and of course, any project can scam, even if there was no initial goal of creating a scam.

## Overview of smart contracts

In this tutorial, we will use the smart contract from the examples provided in the Jetton standard, namely the master contract `jetton-minter-ICO.fc` [from here](https://github.com/ton-blockchain/token-contract/tree/main/ft).

The essential difference between the master contract from the ninth lesson, which we analyzed in detail, is the presence of mechanics in this ICO smart contract, due to the following code in `recv_internal()`:

	if (in_msg_body.slice_empty?()) { ;; buy jettons for Toncoin

		  int amount = 10000000; ;; for mint message
		  int buy_amount = msg_value - amount;
		  throw_unless(76, buy_amount > 0);

		  int jetton_amount = buy_amount; ;; rate 1 jetton = 1 toncoin; multiply to price here

		  var master_msg = begin_cell()
				.store_uint(op::internal_transfer(), 32)
				.store_uint(0, 64) ;; quert_id
				.store_coins(jetton_amount)
				.store_slice(my_address()) ;; from_address
				.store_slice(sender_address) ;; response_address
				.store_coins(0) ;; no forward_amount
				.store_uint(0, 1) ;; forward_payload in this slice, not separate cell
				.end_cell();

		  mint_tokens(sender_address, jetton_wallet_code, amount, master_msg);
		  save_data(total_supply + jetton_amount, admin_address, content, jetton_wallet_code);
		  return ();
		}


As you can see, the exchange of Toncoin for tokens occurs when sending a message with an empty body. Accordingly, in this lesson we will do the following:
- we will make two wallets: from one we will launch the master contract, from the second we will send a message with an empty body to receive tokens
- deploy `jetton-minter-ICO.fc`
- send a message from the second wallet with an empty body and some amount of Toncoin to be exchanged for tokens
- check that the balance of tokens has changed


## Deploy contracts for ICO to testnet

> If you have gone through the previous lessons and remember them well, scroll through immediately to Deploy contracts

### Wallets

The first thing to do is to create two wallets in TON w1 and w2, one of them will be the "administrator address" of the smart contract, the second one we will use to exchange test TONs for Jetton in the test network. (lesson about it [here](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/14lesson/wallet_eng.md))

`SeedPhrase.go` code: 

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

		seed1 := wallet.NewSeed()
		fmt.Println("Seed phrase one:")
		fmt.Println(seed1)

		w1, err := wallet.FromSeed(api, seed1, wallet.V3)
		if err != nil {
			log.Fatalln("FromSeed err:", err.Error())
			return
		}
		fmt.Println("Address one:")
		fmt.Println(w1.Address())

		seed2 := wallet.NewSeed()
		fmt.Println("Seed phrase two:")
		fmt.Println(seed2)

		w2, err := wallet.FromSeed(api, seed2, wallet.V3)
		if err != nil {
			log.Fatalln("FromSeed err:", err.Error())
			return
		}
		fmt.Println("Address two:")
		fmt.Println(w2.Address())

		block, err := api.CurrentMasterchainInfo(context.Background())
		if err != nil {
			log.Fatalln("CurrentMasterchainInfo err:", err.Error())
			return
		}

		balance1, err := w1.GetBalance(context.Background(), block)
		if err != nil {
			log.Fatalln("GetBalance err:", err.Error())
			return
		}
		fmt.Println("Balance one:")
		fmt.Println(balance1)

		balance2, err := w2.GetBalance(context.Background(), block)
		if err != nil {
			log.Fatalln("GetBalance err:", err.Error())
			return
		}
		fmt.Println("Balance two:")
		fmt.Println(balance2)

	}

We save seed phrases somewhere, with the help of them we will use the wallet in other scripts, and also send test tones to both addresses using the bot: https://t.me/testgiver_ton_bot

A minute later, check that the funds came through: https://testnet.tonscan.org/

> Since wallet two will have to wait a while to replenish the second wallet.

We will use wallets with the help of the functions we wrote, as in previous lessons. Let's use them to, for example, find out the balance.

`WalletFunC.go` code: 

	package main

	import (
		"context"
		"log"
		"fmt"
		"strings"

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

		w1 := getWallet1(api)
		w2 := getWallet2(api)


		fmt.Println(w1.Address())
		fmt.Println(w1.Address())
		block, err := api.CurrentMasterchainInfo(context.Background())
		if err != nil {
			log.Fatalln("CurrentMasterchainInfo err:", err.Error())
			return
		}


		balance1, err := w1.GetBalance(context.Background(), block)
		if err != nil {
			log.Fatalln("GetBalance1 err:", err.Error())
			return
		}

		fmt.Println(balance1)

		balance2, err := w2.GetBalance(context.Background(), block)
		if err != nil {
			log.Fatalln("GetBalance2 err:", err.Error())
			return
		}

		fmt.Println(balance2)

	}



	func getWallet1(api *ton.APIClient) *wallet.Wallet {
		words := strings.Split("your Seed phrase 1", " ")
		w, err := wallet.FromSeed(api, words, wallet.V3)
		if err != nil {
			panic(err)
		}
		return w
	}

	func getWallet2(api *ton.APIClient) *wallet.Wallet {
		words := strings.Split("your Seed phrase 2", " ")
		w, err := wallet.FromSeed(api, words, wallet.V3)
		if err != nil {
			panic(err)
		}
		return w
	}

> Yes, you can make one function and pass parameters there, but this is done for ease of perception of the code

### Deploy contracts

#### Create a hexBoc representation of contracts

In the `tonutils-go` library, you can deploy a smart contract in the form of hexBoc. Boc is a serialized form of a smart contract (bag-of-cells). To convert a smart contract into a hexBoc form from func, you must first compile it into fift, and then get hexBoc with a separate fift script. This can be done using the familiar `toncli`. But first things first.

##### Building jetton-minter-ICO and jetton-wallet code

We will take the func code from [examples](https://github.com/ton-blockchain/token-contract/tree/main/ft), we need `jetton-minter-ICO.fc` and `jetton-minter.fc `, as well as auxiliary ones:
- `jetton-utils.fc`
- `op-codes.fc`
- `params.fc`

> For your convenience, I have compiled two amalgam codes (all in one file), see code files: `code-amalgama.func` and `codewallet-amalgama.func`

##### Get fift

Turn func code into fift using `toncli func build`

> In code, the resulting files are `contract` and `contractwallet`

##### Let's print hexBoc

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

> You can run the script either using the familiar toncli, namely `toncli fift run` , or as described [here](https://ton-blockchain.github.io/docs/#/compile?id=fift).

An example script is in the `print-hex.fif` file.

Outcome:
 - `jetton-minter-ICO.fc` hexBoc:  B5EE9C7241020B010001F5000114FF00F4A413F4BCF2C80B0102016202030202CD040502037A60090A03F7D00E8698180B8D8492F81F07D201876A2687D007D206A6A1812E38047221AC1044C4B4028B350906100797026381041080BC6A28CE4658FE59F917D017C14678B13678B10FD0165806493081B2044780382502189E428027D012C678B666664F6AA701B02698FE99FC00AA9185D718141083DEECBEF09DD71812F83C0607080093F7C142201B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064907C80383A6465816503E5FFE4E83BC00C646582AC678B28027D0109E5B589666664B8FD80400606C215131C705F2E04902FA40FA00D43020D08060D721FA00302710345042F007A05023C85004FA0258CF16CCCCC9ED5400FC01FA00FA40F82854120970542013541403C85004FA0258CF1601CF16CCC922C8CB0112F400F400CB00C9F9007074C8CB02CA07CBFFC9D05006C705F2E04A13A1034145C85004FA0258CF16CCCCC9ED5401FA403020D70B01C3008E1F8210D53276DB708010C8CB055003CF1622FA0212CB6ACB1FCB3FC98042FB00915BE20008840FF2F0007DADBCF6A2687D007D206A6A183618FC1400B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064FC80383A6465816503E5FFE4E840001FAF16F6A2687D007D206A6A183FAA9040CA85A166 
 - `jetton-minter.fc` hexBoc:  B5EE9C7241021201000330000114FF00F4A413F4BCF2C80B0102016202030202CC0405001BA0F605DA89A1F401F481F481A8610201D40607020148080900BB0831C02497C138007434C0C05C6C2544D7C0FC02F83E903E900C7E800C5C75C87E800C7E800C00B4C7E08403E29FA954882EA54C4D167C0238208405E3514654882EA58C511100FC02780D60841657C1EF2EA4D67C02B817C12103FCBC2000113E910C1C2EBCB853600201200A0B020120101101F100F4CFFE803E90087C007B51343E803E903E90350C144DA8548AB1C17CB8B04A30BFFCB8B0950D109C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C032483E401C1D3232C0B281F2FFF274013E903D010C7E800835D270803CB8B11DE0063232C1540233C59C3E8085F2DAC4F3200C03F73B51343E803E903E90350C0234CFFE80145468017E903E9014D6F1C1551CDB5C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C0327E401C1D3232C0B281F2FFF274140371C1472C7CB8B0C2BE80146A2860822625A020822625A004AD822860822625A028062849F8C3C975C2C070C008E00D0E0F00AE8210178D4519C8CB1F19CB3F5007FA0222CF165006CF1625FA025003CF16C95005CC2391729171E25008A813A08208989680AA008208989680A0A014BCF2E2C504C98040FB001023C85004FA0258CF1601CF16CCC9ED5400705279A018A182107362D09CC8CB1F5230CB3F58FA025007CF165007CF16C9718010C8CB0524CF165006FA0215CB6A14CCC971FB0010241023000E10491038375F040076C200B08E218210D53276DB708010C8CB055008CF165004FA0216CB6A12CB1F12CB3FC972FB0093356C21E203C85004FA0258CF1601CF16CCC9ED5400DB3B51343E803E903E90350C01F4CFFE803E900C145468549271C17CB8B049F0BFFCB8B0A0822625A02A8005A805AF3CB8B0E0841EF765F7B232C7C572CFD400FE8088B3C58073C5B25C60063232C14933C59C3E80B2DAB33260103EC01004F214013E809633C58073C5B3327B55200083200835C87B51343E803E903E90350C0134C7E08405E3514654882EA0841EF765F784EE84AC7CB8B174CFCC7E800C04E81408F214013E809633C58073C5B3327B55209FB23AB6
 
#### Prepare data for Jetton
 
For deployment, in addition to hexBoc, we need data for the jetton-minter-ICO storage contract. Let's see what data is needed according to the standard:

	;; storage scheme
	;; storage#_ total_supply:Coins admin_address:MsgAddress content:^Cell jetton_wallet_code:^Cell = Storage;
	

For convenience, let's look at the function that saves data to the `c4` register:

	 () save_data(int total_supply, slice admin_address, cell content, cell jetton_wallet_code) impure inline {
	  set_data(begin_cell()
				.store_coins(total_supply)
				.store_slice(admin_address)
				.store_ref(content)
				.store_ref(jetton_wallet_code)
			   .end_cell()
			  );
	}

Content according to the standard can be viewed [here](https://github.com/ton-blockchain/TIPs/issues/64). Since this is a test example, we will not collect all the data, we will only put a link and then to the lessons))
 
	 func getContractData(OwnerAddr *address.Address) *cell.Cell {
		// storage scheme
		// storage#_ total_supply:Coins admin_address:MsgAddress content:^Cell jetton_wallet_code:^Cell = Storage;

		uri := "https://github.com/romanovichim/TonFunClessons_ru"
		jettonContentCell := cell.BeginCell().MustStoreStringSnake(uri).EndCell()

		contentRef := cell.BeginCell().
			MustStoreRef(jettonContentCell).
			EndCell()

		return data
	}
 
After preparing the link, we will collect the data cell by putting there:
  - total token supply MustStoreUInt(10000000, 64)
  - admin wallet address MustStoreAddr(OwnerAddr)
  - jettonContentCell content cell
  - contract wallet code MustStoreRef(getJettonWalletCode())
 
	func getContractData(OwnerAddr *address.Address) *cell.Cell {
		// storage scheme
		// storage#_ total_supply:Coins admin_address:MsgAddress content:^Cell jetton_wallet_code:^Cell = Storage;

		uri := "https://github.com/romanovichim/TonFunClessons_ru"
		jettonContentCell := cell.BeginCell().MustStoreStringSnake(uri).EndCell()

		contentRef := cell.BeginCell().
			MustStoreRef(jettonContentCell).
			EndCell()

		data := cell.BeginCell().MustStoreUInt(10000000, 64).
			MustStoreAddr(OwnerAddr).
			MustStoreRef(contentRef).
			MustStoreRef(getJettonWalletCode()).
			EndCell()

		return data
	}

#### Deploy

  In general, the deployment script is identical to the script from the lesson where we deployed the NFT collection. We have a `getContractData` function with data, two functions from the hexboc contract and wallet master and main from which we deploy the ICO contract:
 
	 func main() {

		// connect to mainnet lite server
		client := liteclient.NewConnectionPool()

		configUrl := "https://ton-blockchain.github.io/testnet-global.config.json"

		err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
		if err != nil {
			panic(err)
		}
		api := ton.NewAPIClient(client)
		w := getWallet(api)

		msgBody := cell.BeginCell().EndCell()

		fmt.Println("Deploying Jetton ICO	contract to mainnet...")
		addr, err := w.DeployContract(context.Background(), tlb.MustFromTON("0.02"),
			msgBody, getJettonMasterCode(), getContractData(w.Address()), true)
		if err != nil {
			panic(err)
		}

		fmt.Println("Deployed contract addr:", addr.String())
	}
 
Sample script in `DeployJettonMinter.go` file.
 
### Call smart contracts

After deploying the smart contract, it remains to call it and exchange Toncoin for our token. To do this, you need to send a message with an empty body and some amount of Toncoin. Let's use the second wallet, which we prepared at the beginning of the lesson.

 `ICO.go` code:

	func main() {
		client := liteclient.NewConnectionPool()
		// connect to testnet lite server
		err := client.AddConnectionsFromConfigUrl(context.Background(), "https://ton-blockchain.github.io/testnet-global.config.json")
		if err != nil {
			panic(err)
		}

		// initialize ton api lite connection wrapper
		api := ton.NewAPIClient(client)

		// seed words of account, you can generate them with any wallet or using wallet.NewSeed() method
		words := strings.Split("your seed phrase", " ")

		w, err := wallet.FromSeed(api, words, wallet.V3)
		if err != nil {
			log.Fatalln("FromSeed err:", err.Error())
			return
		}

		log.Println("wallet address:", w.Address())

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

		if balance.NanoTON().Uint64() >= 100000000 {

			// ICO address 
			addr := address.MustParseAddr("EQD_yyEbNQeWbWfnOIowqNilB8wwbCg6nLxHDP3Rbey1eA72")

		fmt.Println("Let's send message")
		err = w.Send(context.Background(), &wallet.Message{
		 Mode: 3,
		 InternalMessage: &tlb.InternalMessage{
		  IHRDisabled: true,
		  Bounce:      true,
		  DstAddr:     addr,
		  Amount:      tlb.MustFromTON("1"),
		  Body:        cell.BeginCell().EndCell(),
		 },
		}, true)
		if err != nil {
		 fmt.Println(err)
		}

			// update chain info
			block, err = api.CurrentMasterchainInfo(context.Background())
			if err != nil {
				log.Fatalln("CurrentMasterchainInfo err:", err.Error())
				return
			}

			balance, err = w.GetBalance(context.Background(), block)
			if err != nil {
				log.Fatalln("GetBalance err:", err.Error())
				return
			}

			log.Println("transaction sent, balance left:", balance.TON())

			return
		}

		log.Println("not enough balance:", balance.TON())
	}
	

If successful, in https://testnet.tonscan.org/ we can see the following picture:

![tnscn](./img/tnscn.PNG)

Our message and return message notice.

### Examining the result

Let's take the balance of tokens from our wallet from which we sent Toncoin.
 
`JettonBalance.go` code:

	package main

	import (
		"context"
		"github.com/xssnick/tonutils-go/address"
		_ "github.com/xssnick/tonutils-go/tlb"
		"github.com/xssnick/tonutils-go/ton/jetton"
		_ "github.com/xssnick/tonutils-go/ton/nft"
		_ "github.com/xssnick/tonutils-go/ton/wallet"
		"log"
		_ "strings"

		"github.com/xssnick/tonutils-go/liteclient"
		"github.com/xssnick/tonutils-go/ton"
	)

	func main() {
		client := liteclient.NewConnectionPool()

		// connect to testnet lite server
		err := client.AddConnectionsFromConfigUrl(context.Background(), "https://ton-blockchain.github.io/testnet-global.config.json")
		if err != nil {
			panic(err)
		}

		// initialize ton api lite connection wrapper
		api := ton.NewAPIClient(client)

		// jetton contract address
		contract := address.MustParseAddr("EQD_yyEbNQeWbWfnOIowqNilB8wwbCg6nLxHDP3Rbey1eA72")
		master := jetton.NewJettonMasterClient(api, contract)

		// get jetton wallet for account
		ownerAddr := address.MustParseAddr("EQAIz6DspthuIkUaBZaeH7THhe7LSOXmQImH2eT97KI2Dl4z")
		tokenWallet, err := master.GetJettonWallet(context.Background(), ownerAddr)
		if err != nil {
			log.Fatal(err)
		}

		tokenBalance, err := tokenWallet.GetBalance(context.Background())
		if err != nil {
			log.Fatal(err)
		}

		log.Println("token balance:", tokenBalance.String())
	}

If successful, we can see the following picture:

![cli](./img/wg.PNG)

> There are fewer tokens than we sent Toncoin since there are fees, plus the contract needs to send a message back.

##  Exercise

In the tonutils-go library, there are some convenient methods for transferring tokens from wallet to wallet, try using them to transfer tokens from wallet `w2` to `w1`.

## Conclusion

Tokens offer many opportunities, but also carry comparable risks.
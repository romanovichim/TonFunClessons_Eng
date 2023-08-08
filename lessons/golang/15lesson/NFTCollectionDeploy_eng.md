#  NFT collection deploy

## Introduction

In this tutorial, we will deploy an NFT collection using the tonutils-go library. In order for the lesson to qualitatively cover the topic of deploying an NFT collection, we will do the following, first we will make requests to an existing collection, thus we will get examples of what can be stored in an NFT collection and its element. And then we will create our own NFT collection (quite a test one without any sense).

Before proceeding to the lesson, I advise you to watch the previous lesson in order to understand how a wallet is created and contracts are deployed.

## Get information about the Collection and an individual element

Getting information about the collection involves making GET requests to the smart contract. In this lesson, we will consider obtaining information from smart contracts that comply with the standards. Lesson with analysis of the NFT standard [here](https://github.com/romanovichim/TonFunClessons_ru/blob/main/10lesson/tenthlesson.md). The standard itself can be found [here](https://github.com/ton-blockchain/TIPs/issues/62).

### What information can be taken according to the NFT collection standard

A collection smart contract that conforms to the standard must implement the Get method `get_collection_data()` , which will return the address of the collection owner, the content of the collection, and the count of current NFTs in the collection. The function looks like this:

	(int, cell, slice) get_collection_data() method_id {
	  var (owner_address, next_item_index, content, _, _) = load_data();
	  slice cs = content.begin_parse();
	  return (next_item_index, cs~load_ref(), owner_address);
	}

> load_data() unloads data from register c4

If we were just executing a request to the contract, we would have to "parse" the slice and other unpleasant things related to types. In `tonutils-go`, there is a `GetCollectionData` function that will allow you not to bother with this, which is what we will use next.

For example, let's take some collection from some marketplace and just check the information that we get and the information from the marketplace.

The address of the collection that I will use in this tutorial:

	EQAA1yvDaDwEK5vHGOXRdtS2MbOVd1-TNy01L1S_t2HF4oLu

Judging by the information from the marketplace, there are 13333 items in the collection at this address, let's check it out

### Getting information about the NFT collection using GO

Connect to lightserves on the main network:

	func main() {

		client := liteclient.NewConnectionPool()
		configUrl := "https://ton-blockchain.github.io/global.config.json"

		err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
		if err != nil {
			panic(err)
		}

		api := ton.NewAPIClient(client)

	}

> This collection is also in the test network, so if you take the test network config, everything will also work

Take the address and use the `GetCollectionData` function to call the get_collection_data() method and convert the data to readable

> Before calling `GetCollectionData` you need to set the `NewCollectionClient` connection

	func main() {
		client := liteclient.NewConnectionPool()
		configUrl := "https://ton-blockchain.github.io/global.config.json"

		err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
		if err != nil {
			panic(err)
		}

		api := ton.NewAPIClient(client)

		nftColAddr := address.MustParseAddr("EQAA1yvDaDwEK5vHGOXRdtS2MbOVd1-TNy01L1S_t2HF4oLu")


		// get info about our nft's collection
		collection := nft.NewCollectionClient(api, nftColAddr)
		collectionData, err := collection.GetCollectionData(context.Background())
		if err != nil {
			panic(err)
		}
	}

Now `collectionData` stores information about the collection, we will output data from `collectionData` to the console using the `fmt` library.

It should output the following information:

	Collection addr      : EQAA1yvDaDwEK5vHGOXRdtS2MbOVd1-TNy01L1S_t2HF4oLu
		content          : http://nft.animalsredlist.com/nfts/collection.json
		owner            : EQANKN8ZnM0OzYOENTkOEg7VVgFog5fBWdCtqQro1MRmU5_2
		minted items num : 13333

As we can see the information converge, there are also 13333 items in the collection.

Final `nftcoldata.go` code:

	package main

	import (
		"context"
		"fmt"

		"github.com/xssnick/tonutils-go/address"
		"github.com/xssnick/tonutils-go/liteclient"
		"github.com/xssnick/tonutils-go/ton"
		"github.com/xssnick/tonutils-go/ton/nft"
	)

	func main() {
		client := liteclient.NewConnectionPool()
		configUrl := "https://ton-blockchain.github.io/global.config.json"

		err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
		if err != nil {
			panic(err)
		}

		api := ton.NewAPIClient(client)

		nftColAddr := address.MustParseAddr("EQAA1yvDaDwEK5vHGOXRdtS2MbOVd1-TNy01L1S_t2HF4oLu")

		// get info about our nft's collection
		collection := nft.NewCollectionClient(api, nftColAddr)
		collectionData, err := collection.GetCollectionData(context.Background())
		if err != nil {
			panic(err)
		}

		fmt.Println("Collection addr      :", nftColAddr)
		fmt.Println("    content          :", collectionData.Content.(*nft.ContentOffchain).URI)
		fmt.Println("    owner            :", collectionData.OwnerAddress.String())
		fmt.Println("    minted items num :", collectionData.NextItemIndex)
	}
	
	
## What information can be obtained from a single NFT element

Let's say we want to get the address of the collection element, its content, let's say a link to the picture. And everything seems to be simple, we pull the Get-method and get the information. BUT in [according to the NFT standard in TON] (https://github.com/ton-blockchain/TIPs/issues/62), in this way we will not get the full link, but only a part, the so-called individual element content.

To get the full content (address), you need:
- by the get-method of the element `get_nft_data()`, we will get the element index and individual content, as well as the initialization sign
- check if the element is initialized (More about this in lesson 10, where the NFT standard is discussed)
- if the element is initialized, then by the get-method of the collection `get_nft_content(int index, cell individual_content)`, we get
full content (full address) on a single element

### Get information about the NFT element using GO

The address of the element that I will use below:

UQBzmkmGYAw3qNEQYddY-FjWRPJRjg7Vv2B1Dns3FrERcaRH

Let's try to take information about this NFT element.

Establish connection with lightservers:

	func main() {
		client := liteclient.NewConnectionPool()
		configUrl := "https://ton-blockchain.github.io/global.config.json"

		err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
		if err != nil {
			panic(err)
		}

		api := ton.NewAPIClient(client)

	}

Let's call the get-method of the element `get_nft_data()` and output the received information to the console:

	func main() {
		client := liteclient.NewConnectionPool()
		configUrl := "https://ton-blockchain.github.io/global.config.json"

		err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
		if err != nil {
			panic(err)
		}

		api := ton.NewAPIClient(client)


		nftAddr := address.MustParseAddr("UQBzmkmGYAw3qNEQYddY-FjWRPJRjg7Vv2B1Dns3FrERcaRH")
		item := nft.NewItemClient(api, nftAddr)

		nftData, err := item.GetNFTData(context.Background())
		if err != nil {
			panic(err)
		}

		fmt.Println("NFT addr         :", nftAddr.String())
		fmt.Println("    initialized  :", nftData.Initialized)
		fmt.Println("    owner        :", nftData.OwnerAddress.String())
		fmt.Println("    index        :", nftData.Index)
		
	}

In addition to the information that we displayed, we also have information about the collection, we can get it using the following code:

		// get info about our nft's collection
		collection := nft.NewCollectionClient(api, nftData.CollectionAddress)
		
It remains to check if the element is initialized and call the get-method of the collection `get_nft_content(int index, cell individual_content)` to get a reference to the element.

	// get info about our nft's collection
	collection := nft.NewCollectionClient(api, nftData.CollectionAddress)

		if nftData.Initialized {
			// get full nft's content url using collection method that will merge base url with nft's data
			nftContent, err := collection.GetNFTContent(context.Background(), nftData.Index, nftData.Content)
			if err != nil {
				panic(err)
			}
			fmt.Println("    part content :", nftData.Content.(*nft.ContentOffchain).URI)
			fmt.Println("    full content :", nftContent.(*nft.ContentOffchain).URI)
		} else {
			fmt.Println("    empty content")
		}


Final `nftitemdata.go` code:

	func main() {
		client := liteclient.NewConnectionPool()
		configUrl := "https://ton-blockchain.github.io/global.config.json"

		err := client.AddConnectionsFromConfigUrl(context.Background(), configUrl)
		if err != nil {
			panic(err)
		}

		api := ton.NewAPIClient(client)


		nftAddr := address.MustParseAddr("UQBzmkmGYAw3qNEQYddY-FjWRPJRjg7Vv2B1Dns3FrERcaRH")
		item := nft.NewItemClient(api, nftAddr)

		nftData, err := item.GetNFTData(context.Background())
		if err != nil {
			panic(err)
		}

		fmt.Println("NFT addr         :", nftAddr.String())
		fmt.Println("    initialized  :", nftData.Initialized)
		fmt.Println("    owner        :", nftData.OwnerAddress.String())
		fmt.Println("    index        :", nftData.Index)

		// get info about our nft's collection
		collection := nft.NewCollectionClient(api, nftData.CollectionAddress)

		if nftData.Initialized {
			// get full nft's content url using collection method that will merge base url with nft's data
			nftContent, err := collection.GetNFTContent(context.Background(), nftData.Index, nftData.Content)
			if err != nil {
				panic(err)
			}
			fmt.Println("    part content :", nftData.Content.(*nft.ContentOffchain).URI)
			fmt.Println("    full content :", nftContent.(*nft.ContentOffchain).URI)
		} else {
			fmt.Println("    empty content")
		}
	}

As a result, you should get the following element: https://nft.animalsredlist.com/nfts/11030.json

## Deploy smart contract collection

After we learned how to look at information about other people's collections and elements, we will try to deploy our collection and element in the test network. Before moving on, I advise you to go through the previous lesson, since I will not dwell on how to create a wallet, create a hexBOC contract form and deploy a contract to a test network here.

Let's analyze what is needed to deploy the collection. The first thing we need is the hexBOC representation of the contract, the second is the initial data for the `c4` register.

Let's start with the second, according to the standard, we will determine the data that needs to be put in `c4`. It is convenient to look at the function that loads data from the [collection contract](https://github.com/ton-blockchain/token-contract/blob/main/nft/nft-collection.fc) example.

	(slice, int, cell, cell, cell) load_data() inline {
	  var ds = get_data().begin_parse();
	  return 
		(ds~load_msg_addr(), ;; owner_address
		 ds~load_uint(64), ;; next_item_index
		 ds~load_ref(), ;; content
		 ds~load_ref(), ;; nft_item_code
		 ds~load_ref()  ;; royalty_params
		 );
	}

Let the address of the owner be the address of the wallet that we will use for deployment, so we will pass the address to the function as an argument:

	func getContractData(collectionOwnerAddr, royaltyAddr *address.Address) *cell.Cell {

	}

It is also necessary to transfer the royalty-free address, which we will transfer in the royalty parameters. In this example, we won't be setting any royalty values, so we'll pass in zeros. (You can read about the piano parameters [here](https://github.com/ton-blockchain/TEPs/blob/afb3b967db3cf693f1b667f771150056d53944d5/text/0066-nft-royalty-standard.md))


	func getContractData(collectionOwnerAddr, royaltyAddr *address.Address) *cell.Cell {

		royalty := cell.BeginCell().
			MustStoreUInt(0, 16).
			MustStoreUInt(0, 16).
			MustStoreAddr(royaltyAddr).
			EndCell()

	}

Now let's collect the content part, it is divided into two cells `collection_content` and `common_content` in accordance with the standard:

	func getContractData(collectionOwnerAddr, royaltyAddr *address.Address) *cell.Cell {
		royalty := cell.BeginCell().
			MustStoreUInt(0, 16).
			MustStoreUInt(0, 16).
			MustStoreAddr(royaltyAddr).
			EndCell()

		collectionContent := nft.ContentOffchain{URI: "https://tonutils.com"}
		collectionContentCell, _ := collectionContent.ContentCell()

		commonContent := nft.ContentOffchain{URI: "https://tonutils.com/nft/"}
		commonContentCell, _ := commonContent.ContentCell()

		contentRef := cell.BeginCell().
			MustStoreRef(collectionContentCell).
			MustStoreRef(commonContentCell).
			EndCell()

	}

The index will be equal to zero, and for the code we will create a separate function `getNFTItemCode()`, which will simply store the contract code of a separate element in hexBOC format. As a result, we get:

	func getContractData(collectionOwnerAddr, royaltyAddr *address.Address) *cell.Cell {

		royalty := cell.BeginCell().
			MustStoreUInt(0, 16).
			MustStoreUInt(0, 16).
			MustStoreAddr(royaltyAddr).
			EndCell()

		collectionContent := nft.ContentOffchain{URI: "https://tonutils.com"}
		collectionContentCell, _ := collectionContent.ContentCell()

		commonContent := nft.ContentOffchain{URI: "https://tonutils.com/nft/"}
		commonContentCell, _ := commonContent.ContentCell()

		contentRef := cell.BeginCell().
			MustStoreRef(collectionContentCell).
			MustStoreRef(commonContentCell).
			EndCell()

		data := cell.BeginCell().MustStoreAddr(collectionOwnerAddr).
			MustStoreUInt(0, 64).
			MustStoreRef(contentRef).
			MustStoreRef(getNFTItemCode()).
			MustStoreRef(royalty).
			EndCell()

		return data
	}

It remains only to deploy the contract:

	addr, err := w.DeployContract(context.Background(), tlb.MustFromTON("0.02"),
		msgBody, getNFTCollectionCode(), getContractData(w.Address(), nil), true)
	if err != nil {
		panic(err)
	}

Full code [here](https://github.com/xssnick/tonutils-go/blob/master/example/deploy-nft-collection/main.go).

## Mint element to collection

Adding an element to a collection is called mint. If you look at the [collection contract example](https://github.com/ton-blockchain/token-contract/blob/main/nft/nft-collection.fc) you can see that in order to mint a new NFT item, you need to send internal message.

Respectively:
- Call the get-method of the collection `get_collection_data()` to get the index we need for the mint
- Call the collection's get method `get_nft_address_by_index(int ​​index)` to get the address of the NFT element
- Let's collect the payload (Item index, wallet address, small amount of TON for , content)
- Send a message to the smart contract address of the collection with our payload

Let's start by connecting to light servers:

	func main() {
		client := liteclient.NewConnectionPool()

		// connect to mainnet lite server
		err := client.AddConnection(context.Background(), "135.181.140.212:13206", "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw=")
		if err != nil {
			panic(err)
		}

		// initialize ton api lite connection wrapper
		api := ton.NewAPIClient(client)

	}

We "collect" the wallet, and make a call to `get_collection_data()` to get the index:

	func main() {
		client := liteclient.NewConnectionPool()

		// connect to mainnet lite server
		err := client.AddConnection(context.Background(), "135.181.140.212:13206", "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw=")
		if err != nil {
			panic(err)
		}

		// initialize ton api lite connection wrapper
		api := ton.NewAPIClient(client)
		w := getWallet(api)

		collectionAddr := address.MustParseAddr("EQCSrRIKVEBaRd8aQfsOaNq3C4FVZGY5Oka55A5oFMVEs0lY")
		collection := nft.NewCollectionClient(api, collectionAddr)

		collectionData, err := collection.GetCollectionData(context.Background())
		if err != nil {
			panic(err)
		}
	}

> It is important to use the wallet, the address that we put in `c4` when deploying the collection contract, otherwise when minting, an error will occur, since the contract has a check for the address from which you can mint (It looks like this: `throw_unless(401, equal_slices(sender_address, owner_address));`).

Now get the element's address by calling the collection's get method `get_nft_address_by_index(int index)` to get the element's NFT address and prepare the payload:

	func main() {
		client := liteclient.NewConnectionPool()

		// connect to mainnet lite server
		err := client.AddConnection(context.Background(), "135.181.140.212:13206", "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw=")
		if err != nil {
			panic(err)
		}

		// initialize ton api lite connection wrapper
		api := ton.NewAPIClient(client)
		w := getWallet(api)

		collectionAddr := address.MustParseAddr("EQCSrRIKVEBaRd8aQfsOaNq3C4FVZGY5Oka55A5oFMVEs0lY")
		collection := nft.NewCollectionClient(api, collectionAddr)

		collectionData, err := collection.GetCollectionData(context.Background())
		if err != nil {
			panic(err)
		}

		nftAddr, err := collection.GetNFTAddressByIndex(context.Background(), collectionData.NextItemIndex)
		if err != nil {
			panic(err)
		}

		mintData, err := collection.BuildMintPayload(collectionData.NextItemIndex, w.Address(), tlb.MustFromTON("0.01"), &nft.ContentOffchain{
			URI: fmt.Sprint(collectionData.NextItemIndex) + ".json",
		})
		if err != nil {
			panic(err)
		}
	}

The only thing left is to send a message from the wallet to the smart contract of the collection and display data about our element (check that everything went right by calling the get-method `get_nft_data()` - let's see if the correct information comes in).

	func main() {
		client := liteclient.NewConnectionPool()

		// connect to mainnet lite server
		err := client.AddConnection(context.Background(), "135.181.140.212:13206", "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw=")
		if err != nil {
			panic(err)
		}

		// initialize ton api lite connection wrapper
		api := ton.NewAPIClient(client)
		w := getWallet(api)

		collectionAddr := address.MustParseAddr("EQCSrRIKVEBaRd8aQfsOaNq3C4FVZGY5Oka55A5oFMVEs0lY")
		collection := nft.NewCollectionClient(api, collectionAddr)

		collectionData, err := collection.GetCollectionData(context.Background())
		if err != nil {
			panic(err)
		}

		nftAddr, err := collection.GetNFTAddressByIndex(context.Background(), collectionData.NextItemIndex)
		if err != nil {
			panic(err)
		}

		mintData, err := collection.BuildMintPayload(collectionData.NextItemIndex, w.Address(), tlb.MustFromTON("0.01"), &nft.ContentOffchain{
			URI: fmt.Sprint(collectionData.NextItemIndex) + ".json",
		})
		if err != nil {
			panic(err)
		}

		fmt.Println("Minting NFT...")
		mint := wallet.SimpleMessage(collectionAddr, tlb.MustFromTON("0.025"), mintData)

		err = w.Send(context.Background(), mint, true)
		if err != nil {
			panic(err)
		}

		fmt.Println("Minted NFT:", nftAddr.String(), 0)

		newData, err := nft.NewItemClient(api, nftAddr).GetNFTData(context.Background())
		if err != nil {
			panic(err)
		}

		fmt.Println("Minted NFT addr: ", nftAddr.String())
		fmt.Println("NFT Owner:", newData.OwnerAddress.String())
	}

Full code [here](https://github.com/xssnick/tonutils-go/blob/master/example/nft-mint/main.go).

## Exercise

Deploy your collection and create an NFT item on the testnet, then try to get the information about the collection and the item with the scripts from the beginning of the lesson.

## Conclusion

I publish new lessons [here](https://t.me/ton_learn), on the [main page](https://github.com/romanovichim/TonFunClessons_ru) there is an address for donations, if you suddenly want to help release new lessons. Separately, I want to thank the developers https://github.com/xssnick/tonutils-go who are doing a great job.
# Explore the TON blockchain with tonapi

Every 5 seconds, changes occur in the TON network, a new block is generated. To access changed information, for your application/research, etc. you will have to index all the blocks, imagine their number, taking into account the appearance of a new one every 5 seconds.

There are services in the TON blockchain ecosystem that simplify this task, they index the blockchain, add information to their database and allow you to take it, for example, using the API.

In this article, we will use the https://tonapi.io/ service to get various information from the blockchain.

> The code in the lesson is written for clarity, not quality, so if you can write better - you are great!

## Steps to follow before making requests to TON

### Step 1 Python and requests

To work with the API, we will use [Python](https://www.python.org/) and the `requests` library. Check if Python is installed on the computer using the command line:

	python --version

Also, with a Python script, we will check if the `requests` library is on the computer:

	 import sys
	'requests' in sys.modules

### Step 2 Get the request token

To use tonapi, you need a token, you can get it in a special bot: https://t.me/tonapi_bot

> Attention, do not betray your token to anyone!!

Tonapi has two types of token:
- client, to get it, enter `/get_client_key` in the bot
- server key, to get it enter `/get_server_key` in the bot

## Requests in TON

Now that we have the token and the required library, let's start writing queries.

### Get account information in TON

So, we have a token, this token is a bearer, so we will transfer it to the header.

> more about bearer standard - [here](https://datatracker.ietf.org/doc/html/rfc6750)

	serverSideKey ='your serverSide token'
	headers_data = {'Authorization': 'Bearer ' + serverSideKey  }
	
We will receive information using the `/v1/accounts/getInfo` method, this method has one parameter, this is the address of `account` in raw format (hexadecimal without 0x) or in base64url format.

	serverSideKey ='your serverSide token'
	headers_data = {'Authorization': 'Bearer ' + serverSideKey  }
	data = {'account' : 'EQAvmc9oVnOvLFlUAgeNmZNZoKeDg9vTEiAQxNFw-t5mh3m7'}

> Address EQAvmc9oVnOvLFlUAgeNmZNZoKeDg9vTEiAQxNFw-t5mh3m7 is the address for donations for my lessons, if you want to support the release of new lessons or offer something, you can use this address.

The query remains:

	serverSideKey ='your serverSide token'
	headers_data = {'Authorization': 'Bearer ' + serverSideKey }
	data = {'account' : 'EQAvmc9oVnOvLFlUAgeNmZNZoKeDg9vTEiAQxNFw-t5mh3m7'}

	method = 'getInfo'
	pref= 'account'
	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	response = requests.get(url, params=data, headers=headers_data)
	response.json()
	

We get:

	{'address': {'bounceable': 'EQAvmc9oVnOvLFlUAgeNmZNZoKeDg9vTEiAQxNFw-t5mh3m7', 'non_bounceable': 'UQAvmc9oVnOvLFlUAgeNmZNZoKeDg9vTEiAQxNFw-t5mhyR-', 'raw': '0:2f99cf685673af2c595402078d999359a0a78383dbd3122010c4d170fade6687'}, 'balance': 762788458171, 'interfaces': None, 'is_scam': False, 'last_update': 33318949000004, 'memo_required': False, 'status': 'uninit'}
	

I note that the balance is in NanoTons.

### Get information about account transactions in TON

The first thing that interests us when we talk about TON accounts/wallets is, of course, transactions. In tonapi, there is a convenient method for getting transactions `blockchain/getTransactions`, it has the following arguments:

  - account - address in raw format (hexadecimal without 0x) or in base64url format
  - maxLt - maximum logical time
  - minLt - minimum logical time
  - limit - limit on the number of transactions displayed in `response`

###### Logical time

Logical time is needed to determine the order of actions in TON for processing by the TVM virtual machine. It is strongly guaranteed that the transaction resulting from the message will have lt greater than the lt of the message itself. The lt of a message sent in some transaction is strictly greater than the lt of the transaction. In addition, messages sent from one account, as well as transactions made on one account, are strictly ordered. Thus, for each account, we always know the order of transactions, received and sent messages.

> Similar mechanics in computer systems is also called Lamport time, more details -https://en.wikipedia.org/wiki/Lamport_timestamp

> In the TON documentation about this on [21 pages](https://ton-blockchain.github.io/docs/tblkch.pdf)

Lt arguments are optional, we will omit them and leave the last transactions, then we will select a limit of 1 and get the last transaction. Let's make a request:

	# params
	data = {'account' : 'EQAvmc9oVnOvLFlUAgeNmZNZoKeDg9vTEiAQxNFw-t5mh3m7','limit': '1'}

	method = 'getTransactions'
	pref= 'blockchain'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json())

Response:

	{'transactions': [{'account': {'address': '0:2f99cf685673af2c595402078d999359a0a78383dbd3122010c4d170fade6687', 'is_scam': False}, 'data': 'b5ee9c720102060100015f0003b372f99cf685673af2c595402078d999359a0a78383dbd3122010c4d170fade668700001e5320d5c783bc8aa15e77674dfb8c8377523ed41f72e26d4e81314a744d645322efe3b80a1a00001e50f06ea503638a61f2000004023880104050101a00201b1480167522fb9a3d91fd785e89d733356e6bf0316c735bb9a1062d32193cb9622de29000be673da159cebcb16550081e36664d66829e0e0f6f4c4880431345c3eb799a1d0ee6b280006233ce800003ca641ab8f04c714c3e4c003009e00000000d0a1d0bfd0b0d181d0b8d0b1d0be20d0b7d0b020d183d180d0bed0bad0b82c20d18dd182d0be20d09bd183d187d188d0b8d0b520d0b3d0b0d0b9d0b4d18b20d0bfd0be20d182d0bed0bd210082728704397af0418b054a0a8cf3c13e7465d8ea57f98df794628d28c0de0319748a48965beb0da0698cbb9a9b30cbdd7c112e91f713c4a15f9c099d1fbec1e39fc400130c8047090ee6b2800120', 'fee': 284, 'hash': '3fe607c8115d255b4e3d794a82086cc6e9b617171d607d20decfe3a5dca243c8', 'in_msg': {'created_lt': 33342382000002, 'destination': {'address': '0:2f99cf685673af2c595402078d999359a0a78383dbd3122010c4d170fade6687', 'is_scam': False}, 'fwd_fee': 1154676, 'ihr_fee': 0, 'msg_data': 'AAAAANCh0L/QsNGB0LjQsdC+INC30LAg0YPRgNC+0LrQuCwg0Y3RgtC+INCb0YPRh9GI0LjQtSDQs9Cw0LnQtNGLINC/0L4g0YLQvtC9IQ==', 'source': {'address': '0:b3a917dcd1ec8febc2f44eb999ab735f818b639addcd08316990c9e5cb116f14', 'icon': '', 'is_scam': False, 'name': 'toncoingrave.ton'}, 'value': 1000000000}, 'lt': 33342382000003, 'other_fee': 0, 'out_msgs': [], 'storage_fee': 284, 'utime': 1670013426}]}
	
If you look at the sender address, you can see that it is in raw format, we get base64url( in_msg_source.address) using the `account/getInfo` endpoint, which we looked at earlier.

	# params
	data = {'account' : '0:b3a917dcd1ec8febc2f44eb999ab735f818b639addcd08316990c9e5cb116f14'}

	method = 'getInfo'
	pref= 'account'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json()['address']['bounceable'])

Result:

	EQCzqRfc0eyP68L0TrmZq3NfgYtjmt3NCDFpkMnlyxFvFBG9

### Get information about an individual transaction in TON

You can get information about an individual transaction in tonapi using the hash of the transaction and the `blockchain/getTransaction` endpoint

Example:

	# params
	data = {'hash' : '3fe607c8115d255b4e3d794a82086cc6e9b617171d607d20decfe3a5dca243c8'}

	method = 'getTransaction'
	pref= 'blockchain'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json())
	

### Analyzing DNS auctions

TON DNS is a service that allows you to set short readable names for crypto wallets, smart contracts or websites.

.ton domains are NFTs that can be transferred to other users, as well as bought and sold on marketplaces. (More about auctions [here](https://telegra.ph/Pravila-aukciona-TON-DNS-07-20))

TonApi allows you to collect information about auctions and a hotel auction in particular in a convenient way.

#### We collect data on all current auctions

TonApi makes it possible to get all the auctions for a specific domain, let's take the information for the .ton domain and display the current number of auctions:

	# params
	data = {'tld' : 'ton'}

	method = 'getCurrent'
	pref= 'auction'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json()['total'])
	
And also, for example, take the first domain, for the following example:

	print(response.json()['data'][0]['domain'])

#### Let's consider separately the rates under one of the auctions

Using the endpoint, we will take information on the auction for a specific domain:

	# params
	data = {'domain' : 'betcoin.ton'}

	method = 'getBids'
	pref= 'auction'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json())


### Information on Jetton tokens

A lot of information about Jetton is stored in metadata according to the [standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md). So, let's take the address of the master contract of one of the tokens on TON and get the metadata using tonapi:

	# params
	data = {'account' : 'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw'}

	method = 'getInfo'
	pref= 'jetton'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json())

We get:

	{'metadata': {'address': '0:f4bdd480fcd79d47dbaf6e037d1229115feb2e7ac0f119e160ebd5d031abdf2e', 'decimals': 9, 'description': 'Official token of the Huebel Company', 'image': 'https://cache.tonapi.io/imgproxy/vPhDv8TBUkDFE5N74ckFuSE2FtKKjmNpL4B-Ti3gd5Q/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jbG91ZGZsYXJlLWlwZnMuY29tL2lwZnMvUW1YNDdkb2RVZzFhY1hveFlEVUxXVE5mU2hYUlc1dUhyQ21vS1NVTlI5eEtRdw.webp', 'name': 'Huebel Bolt', 'social': ['https://t.me/boltlink'], 'symbol': 'BOLT'}, 'mintable': True, 'total_supply': '6000693317361000'}

Here you can immediately see the name, and the offer and all the necessary links, etc. etc.

I think it’s immediately clear that it would be convenient for Jetton to have an endpoint that would return information about Jetton on the wallet. And there is such an endpoint, it is `jetton/GetBalances`. Let's take information from some address about Jetton located on it:

	# params
	data = {'account' : 'EQC38-cbo1HivDOdH0oOzyZfTKVpSkatn1ydXJYsrg5KvLNI'}

	method = 'getBalances'
	pref= 'jetton'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json())

We will get a lot of information about Jetton at this address, I suggest listing the Jetton names that are on this wallet:

	#not in pythonic style for educational purposes
	for item  in response.json()['balances']:
	  print(item['metadata']['name'])

Result:

	Centimeter

	Scaleton
	EasyCash 
	KittyCoin for TonSwap tests
	Huebel Bolt
	Kote Coin

Yes, one line is missing because the account has a Jetton with an empty name.

Tonapi also has a handy `jetton/getHistory` endpoint that allows you to view Jetton transactions by account. Let's take the last transaction of interest with Jetton:

	# params
	data = {'account' : 'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw','jetton_master':'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw','limit': 1}

	method = 'getHistory'
	pref= 'jetton'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json())

As you can see, in the parameters we passed the account for which we are interested in transactions, the Jetton master contract and the limit.

### Information on NFTs

#### NFT Collection

As in the case with Jetton, let's start with the master contracts, take the collection metadata:

	# params
	data = {'account' : 'EQCA14o1-VWhS2efqoh_9M1b_A9DtKTuoqfmkn83AbJzwnPi'}

	method = 'getCollection'
	pref= 'nft'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json())
	
In this case, this is a collection of usernames in the Telegram:

	{'address': '0:80d78a35f955a14b679faa887ff4cd5bfc0f43b4a4eea2a7e6927f3701b273c2', 'metadata': {'description': 'Unique addresses in Telegram’s ecosystem of more than 700 million active users.', 'external_link': 'https://fragment.com/', 'image': 'https://nft.fragment.com/usernames.svg', 'name': 'Telegram Usernames'}, 'next_item_index': 1, 'raw_collection_content': '68747470733a2f2f6e66742e667261676d656e742e636f6d2f757365726e616d65732e6a736f6e'}

#### NFT Item

Of course, the collection is followed by an element, let's take an NFT Item:

	# params
	data = {'addresses' : 'EQA5WX3EjeUPntk2CpPlfqIgnt4VfzlLhCIJ7WPm6B3V09WI'}

	method = 'getItems'
	pref= 'nft'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json())
	
Let's get the username:

	response.json()['nft_items'][0]['metadata']
	
Result:
	
	{'description': 'The @gold username and address in the Telegram ecosystem. Aliases: gold.t.me, t.me/gold',
	 'image': 'https://nft.fragment.com/username/gold.webp',
	 'name': 'gold'}

Like the repository if you think this should be your username)

#### NFT Account

Tonapi provides a convenient way to get the NFT of an account, let's get the NFT of a specific collection using the `nft/searchItems` endpoint:

	# params
	data = {'owner' : 'EQDyBC20fBqrPFEgG088izaeQOgw1ZsWTTuqp7Jo2d1Kz4tQ','collection' :'UQAaLmbRimQRuYx3UkLTv8TTgDfUL-ZIyiFCGeDb4lE06ktW','limit': 10,'offset': 1}

	method = 'searchItems'
	pref= 'nft'

	url = 'https://tonapi.io/v1/{}/{}'.format(pref,method)
	print(url)
	response = requests.get(url, params=data, headers=headers_data)
	print(response.json())
	
And let's count them:

	print(len(response.json()['nft_items']))

Length
	7

## Conclusion

Code examples are in the `code` folder. Have a nice day reader.











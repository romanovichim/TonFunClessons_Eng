# Smart Contract Pipeline Part1 - Writing a Smart Contract 

## Introduction

The modern tool for working with smart contracts in the TON blockchain is [blueprint](https://github.com/ton-org/blueprint/), it allows you to quickly create a project structure and immediately proceed to convenient development. It is the blueprint that is used in my [lessons](https://github.com/romanovichim/TonFunClessons_Eng) on the FunC smart contract development language.

To successfully work with a blueprint, you need to be able to work with its various components, so in this series of tutorials we will go over:

- creating a project, a simple smart contract and compiling it using https://github.com/ton-community/func-js
- test the smart contract using https://github.com/ton-org/sandbox
- we will make deployment to the test network convenient: generating a QR code, which we will confirm in the wallet
- TON is an actor model - smart contracts communicate with each other by messages - we will write a chatbot smart contract that will respond with a message to a message)
- we will test the chatbot smart contract and learn how to test smart contracts that send messages

Let's start by creating a simple smart contract and compiling it.

## Project initialization

Make a folder for your project and go into it.

```bash
// Windows example
mkdir test_folder
cd test_folder
```
In this tutorial, we will use the `yarn` package manager
```bash
	yarn init
```
Let's initialize the `yarn` and just click on the questions in the console, as this is a test case. After that we should get the package.json file in the folder.

Now let's add the typescript and the necessary libraries. Install them as dev dependencies:
```bash
yarn add typescript ts-node @types/node @swc/core --dev
```
Create a `tsconfig.json` file. We need the file for the project compilation configuration. Let's add to it: 

	{
		"compilerOptions": {
			"target" : "es2020",
			"module" : "commonjs",
			"esModuleInterop" : true,
			"forceConsistentCasingInFileNames": true,
			"strict" : true,
			"skipLibCheck" : true,
			"resolveJsonModule" : true

		},
		"ts-node": {
			"transpileOnly" : true,
			"transpile" : "ts-node/transpilers/swc"
		}
	}

In this tutorial, we will not dwell on what each line of configurations means, because this tutorial is about smart contracts. Now let's install the libraries necessary to work with TON:
```bash
yarn add ton-core ton-crypto @ton-community/func-js  --dev
```
Now let's create a smart contract on FunC. Create `contracts` folder and `main.fc` file with minimal code:

```func
() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {

} 
```

 `recv_internal ` is called when a smart contract receives an inbound internal message. There are some variables at the stack when [TVM initiates](https://docs.ton.org/learn/tvm-instructions/tvm-overview#initialization-of-tvm), by setting arguments in recv_internal we give smart-contract code awareness about some of them. T

Now let's write a script that will compile our smart contract template. Let's create a `scripts` folder and a `compile.ts` file in it.

So that we can use this script, we need to register it as a parameter in the package manager, i.e. in the `package.json` file, it will look like this:

	{
	  "name": "test_folder",
	  "version": "1.0.0",
	  "main": "index.js",
	  "license": "MIT",
	  "devDependencies": {
		"@swc/core": "^1.3.63",
		"@ton-community/func-js": "^0.6.2",
		"@types/node": "^20.3.1",
		"ton-core": "^0.49.1",
		"ton-crypto": "^3.2.0",
		"ts-node": "^10.9.1",
		"typescript": "^5.1.3"
	  },
	  "scripts": {
		  "compile" : "ts-node ./scripts/compile.ts"
	  }
	}

Now let's move on to writing the compilation script in the `compile.ts` file. Here we make a reservation that the result of compilation will be the representation of the [bag of Cell](https://docs.ton.org/develop/data-formats/cell-boc) in the format of the base64 encoded string. This result needs to be saved somewhere, so let's create a  `build ` folder.

Finally we get to the compilation file, the first thing we do is compile our code using the function `compileFunc`:

```ts
	import * as fs from "fs";
	import { readFileSync } from "fs";
	import process from "process";
	import { Cell } from "ton-core";
	import { compileFunc } from "@ton-community/func-js";

	async function compileScript() {

		const compileResult = await compileFunc({
			targets: ["./contracts/main.fc"], 
			sources: (path) => readFileSync(path).toString("utf8"),
		});

		if (compileResult.status ==="error") {
			console.log("Error happend");
			process.exit(1);
		}

	}
	compileScript();
```	
The resulting hexBoС will be written to the folder:
```ts
import * as fs from "fs";
import { readFileSync } from "fs";
import process from "process";
import { Cell } from "ton-core";
import { compileFunc } from "@ton-community/func-js";

async function compileScript() {

	const compileResult = await compileFunc({
		targets: ["./contracts/main.fc"], 
		sources: (path) => readFileSync(path).toString("utf8"),
	});

	if (compileResult.status ==="error") {
		console.log("Error happend");
		process.exit(1);
	}

	const hexBoC = 'build/main.compiled.json';

	fs.writeFileSync(
		hexBoC,
		JSON.stringify({
			hex: Cell.fromBoc(Buffer.from(compileResult.codeBoc,"base64"))[0]
				.toBoc()
				.toString("hex"),
		})

	);

}

compileScript();
```

For convenience, you can dilute the code with `console.log()` so that it is clear what worked and what did not when compiling, for example, you can add it to the end:

```ts
console.log("Compiled, hexBoC:"+hexBoC);
```

Which will output the resulting hexBoC.

## Let's go to the contract

To create contracts, we need the standard FunC function library. Create a folder `imports`  inside folder `contracts` and add [this](https://github.com/ton-blockchain/ton/blob/master/crypto/smartcont/stdlib.fc) file there.  

Now go to the `main.fc` file and import the library, now the file looks like this:
```func
#include "imports/stdlib.fc";

() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {

} 
```
Let's go over briefly on the contract, detailed analyzes and lessons on FunC starts [here](https://github.com/romanovichim/TonFunClessons_Eng/). 

The smart contract that we will write will store the sender address of the internal message and also store the number one in the smart contract. It will also implement the Get method, which, when called, will return the address of the last sender of the message to the contract and one.

An internal message comes to our function, we will first get the service flags from there, and then the sender's address, which we will save:
```func
#include "imports/stdlib.fc";

() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {
	slice cs = in_msg.begin_parse();
	int flags = cs~load_uint(4);
	slice sender_address = cs~load_msg_addr();

} 
```
Let's save the address and one in the contract, i.e. write the data to register `c4`. 
```func
#include "imports/stdlib.fc";

() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {
	slice cs = in_msg.begin_parse();
	int flags = cs~load_uint(4);
	slice sender_address = cs~load_msg_addr();

	set_data(begin_cell().store_slice(sender_address).store_uint(1,32).end_cell());
} 
```
It's time for the Get method, the method will return an address and a number, so let's start with `(slice,int)`:

```func
(slice,int) get_sender() method_id {

}
```
In the method itself, we get the data from the register and return it to the user
```func
#include "imports/stdlib.fc";

() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {
	slice cs = in_msg.begin_parse();
	int flags = cs~load_uint(4);
	slice sender_address = cs~load_msg_addr();

	set_data(begin_cell().store_slice(sender_address).store_uint(1,32).end_cell());
} 

(slice,int) get_sender() method_id {
	slice ds = get_data().begin_parse();
	return (ds~load_msg_addr(),ds~load_uint(32));
}
```

Final contract:

```func
#include "imports/stdlib.fc";

() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {
	slice cs = in_msg.begin_parse();
	int flags = cs~load_uint(4);
	slice sender_address = cs~load_msg_addr();

	set_data(begin_cell().store_slice(sender_address).store_uint(1,32).end_cell());
} 

(slice,int) get_sender() method_id {
	slice ds = get_data().begin_parse();
	return (ds~load_msg_addr(),ds~load_uint(32));
}
```

We start compilation using the  `yarn compile` command and get a file c `main.compiled.json` in the `build` folder:

	{"hex":"b5ee9c72410104010035000114ff00f4a413f4bcf2c80b0102016203020015a1418bda89a1f481a63e610028d03031d0d30331fa403071c858cf16cb1fc9ed5474696b07"}
	
## Conclusion

The next step is to write [tests](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/lessons/pipeline/simpletest.md) for this smart contract, thanks for your attention.

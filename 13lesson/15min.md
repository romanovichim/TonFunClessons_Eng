# Introduction

High-level language FunC is used to program smart contracts on TON blockchain . 

TON network consists of TVMs (TON Virtual Machines). FunC programs are compiled into Fift assembler code, which generates corresponding bytecode for the TVM.

# Part 1 First Smart Contract - Data Types, "Storage", functions

	;; Single line comment

	{- This is a multi-line comment
		{- this is a comment in the comment -}
	-}

	;; Let's write a smart contract that stores the data in its "storage" and returns the data using Get functions.

	;; Smart contracts on the TON network have two reserved methods that can be accessed.
	;; recv_internal() is executed when inside TON itself, for example, when any contract refers to ours
	;; recv_external() is executed when a request to the contract comes from the outside world, that is, not from TON

	;; impure is a keyword that indicates that the function changes the smart contract data.

	() recv_internal(slice in_msg_body) impure {

	  ;; FunC has the following built-in types:

	  ;; cell is the type of TVM cells. 
	  ;; slice is the type of cell slices.
	  ;; builder is the type of cell builders.

	  ;;Cells play a role of memory in stack-based TVM. Cell can be transformed to a slice, and then the data bits and references to other cells from the cell can be obtained by loading them from the slice. Data bits and references to other cells can be stored into a builder, and then the builder can be finalized to a new cell.

	  ;; int is the type of 257-bit signed integers. 
	  ;; load_uint function is from the FunC standard library it loads an unsigned n-bit integer from a slice.

	  int n = in_msg_body~load_uint(32);

	  ;; To store permanent data, in TVM register c4 is assigned, the data type is Cell.
	  ;; In order to "get" data from c4, we need two functions from the FunC standard library.
	  ;; Namely: get_data - Gets a cell from the c4 register. begin_parse - converts a cell into a slice

	  slice ds = get_data().begin_parse();

	  int total = ds~load_uint(64);

	  ;; For summation, we will use the binary summation operation + and the assignment =

	  total += n;

	  ;; In order to keep a constant value, we need to do four things:
	  ;; create a Builder for the future cell - begin_cell()
	  ;; write a value to  total - store_uint()
	  ;; from Builder create Cell - end_cell()
	  ;; write the resulting cell to the register - set_data()

	  set_data(begin_cell().store_uint(total, 64).end_cell());
	}

	;; FunC program is essentially a list of function declarations/definitions and global variable declarations.

	;; Any function in FunC matches the following pattern:
	;; [<forall declarator>] <return_type <function_name(<comma_separated_function_args>)<specifiers>

	;; The method_id specification allows you to call a GET function by name

	int get_total() method_id {
	  ;; Below we get data from c4 with the functions we already know

	  slice ds = get_data().begin_parse();
	  int total = ds~load_uint(64);

	  ;; Return type can be any atomic or composite typ
	  return total;
	}

# Part 2 Messages and Conditional Statements

The actor model is a mathematical model of concurrent computation and is at the heart of TON smart contracts. In it, each smart contract can receive one message, change its own state or send one or several messages per unit time. As a result, the entire blockchain, as well as a given contract, can scale up to host an unlimited amount of users and transactions.

	;; Each transaction consists of up to 5 phases(stages).
	;; For smart contracts we are intrested in Compute phase. And to be more specific, what is "on the stack" during initialization.
	;; For normal message-triggered transactions, the initial state of the stack looks like this:
	;;;; Smart contract balance (in nanoTons)
	;;;; Incoming message balance (in nanotones)
	;;;; Cell with incoming message
	;;;; Incoming message body, slice type
	;;;; Function selector (for recv_internal it is 0)

	;; As a result, we get the following code:

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
	  ;; from in_msg_full we can take sender address
	  ;; first we need to take some tech flags and then take adress using function from FunC standard library - load_msg_addr()
	  var cs = in_msg_full.begin_parse();
	  var flags = cs~load_uint(4);
	  slice sender_address = cs~load_msg_addr();

	  ;; if we want to send a message, we first need to collect the message
	  ;; message serialization in most cases may be reduced to
	  var msg = begin_cell()
		.store_uint(0x18, 6)
		.store_slice(addr)
		.store_coins(amount)
		.store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
		.store_slice(message_body)
	  .end_cell();

	  ;; to send messages, use send_raw_message from the standard library.
	  ;; two arguments message and mode
	  send_raw_message(msg, 64);

	  ;; mode parameter specify how to process the funds passed into the smart contract with the message and the smart contract funds

	 ;; Exceptions can be thrown by conditional primitives throw_if and throw_unless and by unconditional throw

	  throw(101)
	  throw_if(102,10==10)
	  throw_unless(103,10!=10)

	
}

# Part 3 Dictionaries and Loops and Conditional Statements

	;; FunC of course supports if statements

	;;;; usual if-else
	if (flag) {
		;;do_something();
	}
	else {
		;;do_alternative();
	}

	;; If statements are often used as operation identifier for smart contract, for example:

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
		int op = in_msg_body~load_int(32);
		if (op == 1) {
			;; smth here
		} else {
		if (op == 2) {
			;; smth here
		} else {
			;; smth here
		}
		}
		}

	;; Loops
	;; FunC supports repeat, while and do { ... } until loops. for loop is not supported.

	;; repeat
	int x = 1;
	repeat(10) {
		x *= 2;
	}
	;; x = 1024

	;; while
	int x = 2;
	while (x < 100) {
		x = x * x;
	}
	;; x = 256

	;; until loops
	int x = 0;
	do {
		x += 3;
	} until (x % 17 == 0);
	;; x = 51

	;; In practice, loops in TON smart contracts are often used to work with dictionaries, or as they are also called in TON hashmaps

	;; Hashmap is a data structure represented by a tree. Hashmap - maps keys to values ​​of arbitrary type, so that quick lookup and modification is possible. 

	;; udict_get_next? from FunC standart library in combination with the loop will help, go through the dictionary

	int key = -1;
	do {
		(key, slice cs, int f) = dic.udict_get_next?(256, key);

	} until (~ f);

	;; udict_get_next? - Calculates the minimum key k in the dictionary dict that is greater than some given value and returns k, the associated value, and a flag indicating success. If the dictionary is empty, returns (null, null, 0).
  
# Further Reading

	{- 
		I really into the TON ecosystem, so I wrote lessons on developing smart contracts: https://github.com/romanovichim/TonFunClessons_Eng .
		
		 TON Documentation: https://ton.org/docs/#/
		 FunC Documentation: https://ton.org/docs/#/func/overview
		 
		 TON Smart Contracts examples:  https://github.com/ton-blockchain/ton/tree/master/crypto/smartcont
		
		
		 Have fun with FunC!
	-}  
  
# Introduction

The FunC language is used to program smart contracts on the TON blockchain. Contract logic is executed in TVM - stack-based TON Virtual Machine.

# Part 1 Basic syntax, the first Smart Contract - Data Types, Storage, Functions

	;; Single line comment

	{- This is a multi-line comment
		{- this is a comment in the comment -}
	-}
	
	(int) sum(int a, int b) { ;; This is function which get two integer parameters and return integer result
	  return a + b;  ;; All integers are signed and 257 bit long. Overflow throws exception
	  ;; expressions must end with a semicolon
	}
	
	() f(int i, cell c, slice s, builder b, cont c, tuple t) {
	  ;; FunC has 7 atomic types: 
	  ;; int - 257 bit signed integers,
	  ;; cell - basic for TON opaque data structure which contains up to 1023 bits and up to 4 references to other cells,
	  ;; slice and builder - special objects to read from and write to cells,
	  ;; continuation - another flavor of cell which contains ready to execute TVM byte-code
	  ;; tuple is an ordered collection of up to 255 components, having arbitrary value types, possibly distinct.
	  ;; Finally tensor type (A,B, ...) is an ordered collection ready for mass assigning like: (int, int) a = (3, 5);
	  ;; Special case of tensor type is the unit type ().
	  ;; It represents that a function doesn't return any value, or has no arguments.
	}
	
	;; During execution contract has read access to local context: it's storage, balance, time, network config etc.
	;; Contract may change it's storage, code and also may send messages to other contracts

	;; Let's write a counter smart contract that gets a number from incoming message,
	;; adds to already stored number and stores result in "storage"

	;; For handling special events smart contracts have reserved methods:
	;; recv_internal() handles internal message from other smart-contract
	;; recv_external() handles external message from the outside world (e.g. from a user)

	() recv_internal(slice in_msg_body) {
	  ;; Cells play a role of memory in stack-based TVM. Cell can be transformed to a slice,
	  ;; and then the data bits and references to other cells from the cell can be obtained
	  ;; by loading them from the slice. Data bits and references to other cells can be stored
	  ;; into a builder, and then the builder can be finalized to a new cell.
	  ;; recv_internal gets slice with incoming message data as argument

	  ;; As everything else in TON permanent storage data stored as cell.
	  ;; It can be retrieved via get_data() method
	  ;; begin_parse - converts a cell with data into readable a slice

	  slice ds = get_data().begin_parse(); ;; `.` is a syntax sugar: a.b() is equivalent to b(a)

	  ;; load_uint is function from the FunC standard library; it loads an unsigned n-bit integer from a slice
	  int total = ds~load_uint(64); ;; `~` is a "modifying" method:
	  ;; essentially it is a syntax sugar: `r = a~b(x)` is equivalent to (a,r) = b(a,x)
	  
	  ;; Now lets read incoming value from message body slice
	  int n = in_msg_body~load_uint(32);

	  total += n; ;; integers support usual +-*/ operations as well as (+-*/)= syntax sugar

	  ;; In order to keep a store integer value, we need to do four things:
	  ;; create a Builder for the future cell - begin_cell()
	  ;; write a value to  total - store_uint(value, bit_size)
	  ;; create Cell from Builder - end_cell()
	  ;; write the resulting cell to permanent storage - set_data()

	  set_data(begin_cell().store_uint(total, 64).end_cell());
	}



	;; FunC program is essentially a list of function declarations/definitions and global variable declarations.

	;; Any function in FunC matches the following pattern:
	;; [<forall declarator>] <return_type> <function_name>(<comma_separated_function_args>) <specifiers>


	;; Specifiers:
	;; The impure specifier indicates that function call should not be optimized (wheter it's result is used or not)
	;; it is important for methods that changes the smart contract data or send messages

	;; The method_id specifier allows you to call a GET function by name
	
	;; For instance we can create get method for contract above to allow outside viewer to read counter

	int get_total() method_id {
	  slice ds = get_data().begin_parse();
	  int total = ds~load_uint(64);

	  ;; Note that (int) and int is the same, thus brackets in function declaration and in return statement are omitted.
	  return total;
	}
	;; Now any observer can read get_total value via lite-client or explorer

# Part 2 Messages

The actor model is a model of concurrent computation and is at the heart of TON smart contracts. Each smart contract can process one message at a time, change its own state or send one or several messages. Processing of the message occurs in one transaction, that is can not be interrupted. Messages to one contract processed consequently one by one. As a result, the execution of each transaction is local, can be parallelized at the blockchain level, which allows for on-demand throughput horizontal scaling and hosting an unlimited number of users and transactions.

	;; For normal internal message-triggered transactions, before passing control to recv_internal TVM puts the following
	;; elements on stack.
	;;;; Smart contract balance (in nanoTons)
	;;;; Incoming message balance (in nanoTons)
	;;;; Cell with incoming message
	;;;; Incoming message body, slice type
	;; In turn recv_internal may use only required number of fields (like 1 in example above or 4 like below)
	
	;; Lets dive into message sending

	() recv_internal (int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
	  ;; 
	  ;; Every message has a strict layout, thus by parsing it we can get sender address
	  ;; first we need to read some tech flags and then take adress using load_msg_addr
	  ;; function from FunC standard library - ()
	  var cs = in_msg_full.begin_parse();
	  var flags = cs~load_uint(4);
	  slice sender_address = cs~load_msg_addr();

	  ;; if we want to send a message, we first need to construct it
	  ;; message serialization in most cases may be reduced to
	  var msg = begin_cell()
		.store_uint(0x18, 6) ;; tech flags
		.store_slice(addr)   ;; destination address
		.store_coins(amount) ;; attached value
		.store_uint(0, 107) ;; more tech flags :)
		.store_slice(in_msg_body) ;; just put some payload here
	  .end_cell();

	  ;; to send messages, use send_raw_message from the standard library.
	  ;; it accepts two arguments message and mode
	  send_raw_message(msg, 64);

	  ;; mode parameter specify how to process the funds passed into the smart contract with the message and the smart contract funds
	  ;; 64 means send everything from incoming message what's left after commission is deducted

	  ;; Exceptions can be thrown by conditional primitives throw_if and throw_unless and by unconditional throw
	  ;; by default it will automatically cause bounce message with 64 mode

	  var some  = 7;
	  throw_if(102, some == 10);    ;; Throw exception with code 102 conditionally
	  throw_unless(103, some != 10);    ;; Throw exception with code 103 conditionally
	  throw(101);    ;; Throw exception with code 101 unconditionally
	}

# Part 3 Flow control: Conditional Statements and Loops; Dictionaries

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
	

# Part 4 Functions
	;; Most useful functions are slice reader and builder writer primitives, storage handlers and sending messages

	;; slice begin_parse(cell c) - Converts a cell into a slice
	;; (slice, int) load_int(slice s, int len) - Loads a signed len-bit integer from a slice.
	;; (slice, int) load_uint(slice s, int len) - Loads a unsigned len-bit integer from a slice.
	;; (slice, slice) load_bits(slice s, int len) - Loads the first 0 ≤ len ≤ 1023 bits from slice into a separate slice.
	;; (slice, cell) load_ref(slice s) - Loads the reference cell from the slice.

	;; builder begin_cell() - Creates a new empty builder.
	;; cell end_cell(builder b) - Converts a builder into an ordinary cell.
	;; builder store_int(builder b, int x, int len) - Stores a signed len-bit integer x into b for 0 ≤ len ≤ 257.
	;; builder store_uint(builder b, int x, int len) - Stores an unsigned len-bit integer x into b for 0 ≤ len ≤ 256.
	;; builder store_slice(builder b, slice s) - Stores slice s into builder b.
	;; builder store_ref(builder b, cell c) - Stores a reference to cell c into builder b.

	;; cell get_data() - Returns the persistent contract storage cell. 
	;; () set_data(cell c) - Sets cell c as persistent contract data.
	
	;; () send_raw_message(cell msg, int mode) - put message msg into sending queue with mode. Note, that message will be sent after successfull execution of whole transaction
	
	;; Detailed descriptions of all standard functions can be found in docs https://ton.org/docs/#/func/stdlib

	
  
# Further Reading

	{- 
		I really into the TON ecosystem, so I wrote lessons on developing smart contracts: https://github.com/romanovichim/TonFunClessons_Eng .
		
		 TON Documentation: https://ton.org/docs/#/
		 FunC Documentation: https://ton.org/docs/#/func/overview
		 
		 TON Smart Contracts examples:  https://github.com/ton-blockchain/ton/tree/master/crypto/smartcont
		
		
		 Have fun with FunC!
	-}  
  

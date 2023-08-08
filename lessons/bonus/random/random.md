# Smart Contract Lottery Draw

In this tutorial, we will analyze the lottery draw smart contract. A smart contract is good because:
- Properly used by random. Learn more about the technical part of randomness in TON [here](https://docs.ton.org/develop/smart-contracts/guidelines/random-number-generation)
- there are important contract balance management mechanics that can be applied in your smart contracts
- convenient grouping and structure of the project, the pattern of which is worth adopting.


## Random problem

Random number generation - may be needed in many different projects. There is a `random()` function in the FunC documentation, but you can't use it in real projects!!! Its result can be easily predicted if you do not apply some additional tricks.

To make the random number generation unpredictable, you can add the current logical time to the seed so that different transactions have different seeds and results.

You can do this with `randomize_lt()`, for example:

	randomize_lt();
	int x = random(); ;; users can't predict this number
	
Также можно использовать `randomize()`, прокинув туда несколько парметров включая в себя логическое время.

	() randomize(int x) impure asm "ADDRAND";
	
In this article, we will look at the draw contract that uses `randomize()`

## Top-level overview

### How it works?

The contract only accepts messages with 1 TON (other amounts will be returned). The smart contract generates a random number from 0 to 10000 to determine if you win or not.

If a person wins, their winnings are reduced by our commission of 10%. The rest of the contract balance remains intact. The winner will receive a message about the win in the comment to the transaction.

### Probability

- 0.1% to win the jackpot (half of the contract balance) [0; 10)
- 9.9%, to win 5 TON. [10; 1000)
- 10% for winning 2 TON. [1000; 2000)

If there is no win, nothing happens. [2000; 9999]

Contract code - https://github.com/Vudi/new-year-ruffle/tree/main

### Smart contract structure

A smart contract is a `recv_internal` internal message handler, which, if the message body is empty, starts a lottery/draw or fulfills one of the `op` conditions:
- `op == op::add_balance()` adding a balance, in case the contract runs out of money
- `op == op::maintain()` allows you to send an internal message from the contract with a different mode, i.e. it allows you to manage the balance of the smart contract, and also if it allows you to destroy it (message with `mode == 128 + 32` )
- `op == op::withdraw()` allows you to get part of the money from the smart contract - the accumulated commission

## Smart contract style

The smart contract we are considering has a good style:
- the smart contract is well-spaced into several files, so that it is very convenient to read
- work with the storage (we are talking about the `c4` register, of course) is combined with global variables, which again improves the readability of the code, making the smart contract understandable

The `op` commands and the frequently used 1 TON variable are moved to a separate `const.func` file:

	int op::maintain() asm "1001 PUSHINT";
	int op::withdraw() asm "1002 PUSHINT";
	int op::add_balance() asm "1003 PUSHINT";

	int exit::invalid_bet() asm "2001 PUSHINT";

	int 1ton() asm "1000000000 PUSHINT";

The `admin.func` file contains admin commands, `adm::maintain`, which allows you to send a message from a smart contract with any mode - that is, it allows you to manage the balance of a smart contract:

	() adm::maintain(slice in_msg_body) impure inline_ref {
		int mode = in_msg_body~load_uint(8);
		send_raw_message(in_msg_body~load_ref(), mode);    
	}
	
And `adm::withdraw()` allowing you to withdraw some of the money in a convenient way:

	() adm::withdraw() impure inline_ref {
		cell body = begin_cell()
			.store_uint(0, 32)
			.store_slice(msg::commission_withdraw())
			.end_cell();

		cell msg = begin_cell()
			.store_uint(0x18, 6)
			.store_slice(db::admin_addr)
			.store_coins(db::service_balance)
			.store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			.store_ref(body)
			.end_cell();

		db::service_balance = 0;
		send_raw_message(msg, 0);
	}
	
The smart contract sends messages on lose and win, they are placed in a separate `msg.func` file, note that they are of type `slice`:

	slice msg::commission_withdraw()    asm "<b 124 word Withdraw commission| $, b> <s PUSHSLICE";
	slice msg::jackpot()                asm "<b 124 word Congrats! You have won jackpot!| $, b> <s PUSHSLICE";
	slice msg::x2()                     asm "<b 124 word Congrats! You have won x2!| $, b> <s PUSHSLICE";
	slice msg::x5()                     asm "<b 124 word Congrats! You have won x5!| $, b> <s PUSHSLICE";
	
`game.func` contains the drawing/lottery logic, we will consider the code of this file in detail, but later. The smart contract provides a Get method that returns information from the `c4` register of the smart contract. This method is stored in the `get-methods.func` file:

	(int, int, (int, int), int, int) get_info() method_id {
		init_data();
		return (db::available_balance, db::service_balance, parse_std_addr(db::admin_addr), db::last_number, db::hash);
	}
	
And finally, work with the storage in the `storage.func` file. It is important to note here that the data is not permanently stored in register c4, but first it is stored in global variables, and then at the end of some logical code, it is stored in the register using the `pack_data()` function:

	global int init?;

	global int db::available_balance;
	global int db::service_balance;
	global slice db::admin_addr;
	global int db::last_number;
	global int db::hash;


	() init_data() impure {
		ifnot(null?(init?)) {
			throw(0x123);
		}

		slice ds = get_data().begin_parse();

		db::available_balance = ds~load_coins();
		db::service_balance = ds~load_coins();
		db::admin_addr = ds~load_msg_addr();
		db::last_number = ds~load_uint(64);
		db::hash = slice_empty?(ds) ? 0 : ds~load_uint(256);

		init? = true;
	}

	() pack_data() impure {
		set_data(
			begin_cell()
				.store_coins(db::available_balance)
				.store_coins(db::service_balance)
				.store_slice(db::admin_addr)
				.store_uint(db::last_number, 64)
				.store_uint(db::hash, 256)
			.end_cell()
		);
	}
	
## Разберем recv_internal()

Файл `main.fc` начинается с импорта файлов, по которым мы прошлись выше:

	#include "lib/stdlib.func";
	#include "struct/const.func";
	#include "struct/storage.func";
	#include "struct/msg.func";
	#include "struct/game.func";
	#include "struct/admin.func";
	#include "struct/get-methods.func";


	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {

	}

We get the message and use the [slice_hash](https://docs.ton.org/develop/func/stdlib#slice_hash) function to create a hash, which we will use for randomization. Also, as you remember, any message starts with flags, let's do a little check:

	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

	}

We initialize the data using a helper function from the `storage.func` file and here we get the address from the message:

	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

		init_data();

		slice sender_addr = cs~load_msg_addr();

	}
	
It seems that it would be logical to get `op` next, but for the convenience of using a smart contract, the main functionality is used without `op`, so the user simply sends an empty message to the contract and the draw / lottery begins. To implement such functionality, we simply check the remaining message, if it is empty, we start the game.

	#include "lib/stdlib.func";
	#include "struct/const.func";
	#include "struct/storage.func";
	#include "struct/msg.func";
	#include "struct/game.func";
	#include "struct/admin.func";
	#include "struct/get-methods.func";


	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

		init_data();

		slice sender_addr = cs~load_msg_addr();

		if (in_msg_body.slice_empty?()) {
			game::start(sender_addr, msg_value, hash);
			pack_data();
			throw(0);
		}
	}
	
Inside the game function, we will change the data that will later need to be stored in the constant data storage register `c4`, global variables will change inside the function, and in `recv_internal()` we save:

	#include "lib/stdlib.func";
	#include "struct/const.func";
	#include "struct/storage.func";
	#include "struct/msg.func";
	#include "struct/game.func";
	#include "struct/admin.func";
	#include "struct/get-methods.func";


	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

		init_data();

		slice sender_addr = cs~load_msg_addr();

		if (in_msg_body.slice_empty?()) {
			game::start(sender_addr, msg_value, hash);
			pack_data();
			throw(0);
		}
	}
	
Here the question may arise why an exception is thrown after everything has worked correctly. According to the documentation for [TVM clause 4.5.1](https://ton.org/tvm.pdf) there are reserved codes 0-31 for exceptions, which are the same as [exit_code](https://docs.ton.org/ learn/tvm-instructions/tvm-exit-codes), which means 0 is the standard success exit code.

Then everything is simple, `op`, the meaning of which we have analyzed above, the final code of `main.func`:

	#include "lib/stdlib.func";
	#include "struct/const.func";
	#include "struct/storage.func";
	#include "struct/msg.func";
	#include "struct/game.func";
	#include "struct/admin.func";
	#include "struct/get-methods.func";


	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

		init_data();

		slice sender_addr = cs~load_msg_addr();

		if (in_msg_body.slice_empty?()) {
			game::start(sender_addr, msg_value, hash);
			pack_data();
			throw(0);
		}

		int op = in_msg_body~load_uint(32);
		int is_admin = equal_slices(sender_addr, db::admin_addr);
		if (op == op::add_balance()) {
			db::available_balance += msg_value;
			pack_data();
			throw(0);
		}

		if (op == op::maintain()) {
			throw_if(0xfffe, is_admin == 0);
			adm::maintain(in_msg_body);
			throw(0);
		}

		if (op == op::withdraw()) {
			throw_if(0xfffd, is_admin == 0);
			adm::withdraw();
			pack_data();
			throw(0);
		}

		throw(0xffff);
	}

## Parse game.func

Finally we got to the logic of the game, the `game.func` file starts with a helper function for paying a prize:

	() game::payout(slice sender_addr, int amount, slice msg) impure inline_ref {
		cell body = begin_cell()
			.store_uint(0, 32)
			.store_slice(msg)
			.end_cell();

		cell msg = begin_cell()
			.store_uint(0x18, 6)
			.store_slice(sender_addr)
			.store_coins(amount)
			.store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			.store_ref(body)
			.end_cell();

		send_raw_message(msg, 0);
	}  
	
The game itself begins with checking that the value sent to the contract is equal to `1 TON`:

	() game::start(slice sender_addr, int msg_value, int hash) impure inline_ref {
		throw_unless(exit::invalid_bet(), msg_value == 1ton());
	}

Next, a hash for the random is collected, it is collected from the current time, the hash from the `c4` register, the hash formed in `recv_internal` from the message and `cur_lt()` - the logical time of the current transaction:

	() game::start(slice sender_addr, int msg_value, int hash) impure inline_ref {
		throw_unless(exit::invalid_bet(), msg_value == 1ton());
		int new_hash = slice_hash(
			begin_cell()
				.store_uint(db::hash, 256)
				.store_uint(hash, 256)
				.store_uint(cur_lt(), 64)
				.store_uint(now(), 64)
			.end_cell()
			.begin_parse()
		);
	}
	
Using a hash, you can generate a random, but before generating a random using the `rand()` function, we randomize the hash using [randomize](https://docs.ton.org/develop/func/stdlib/#randomize).

	() game::start(slice sender_addr, int msg_value, int hash) impure inline_ref {
		throw_unless(exit::invalid_bet(), msg_value == 1ton());
		int new_hash = slice_hash(
			begin_cell()
				.store_uint(db::hash, 256)
				.store_uint(hash, 256)
				.store_uint(cur_lt(), 64)
				.store_uint(now(), 64)
			.end_cell()
			.begin_parse()
		);

		randomize(new_hash);

	}

> I note that this is one of the possible variations in the implementation of randomness, you can read about randomness in the documentation - https://docs.ton.org/develop/smart-contracts/guidelines/random-number-generation

To implement the probability of winning, a number from 0 to 10000 is generated, everything is simple here, we look at what percentile the number fell into and, depending on this, send or not send the winnings:

	() game::start(slice sender_addr, int msg_value, int hash) impure inline_ref {
		throw_unless(exit::invalid_bet(), msg_value == 1ton());
		int new_hash = slice_hash(
			begin_cell()
				.store_uint(db::hash, 256)
				.store_uint(hash, 256)
				.store_uint(cur_lt(), 64)
				.store_uint(now(), 64)
			.end_cell()
			.begin_parse()
		);

		randomize(new_hash);
		db::hash = new_hash;

		int number = rand(10000); ;; [0; 10000)
		db::last_number = number;
		db::available_balance += 1ton();

		if (number < 10) { ;; win 1/2 available balance
			int win = db::available_balance / 2;
			int commission = muldiv(win, 10, 100);
			win -= commission;

			db::available_balance -= (win + commission);
			db::service_balance += commission;

			game::payout(sender_addr, win, msg::jackpot());

			return ();
		}

		if (number < 1000) { ;; win x5
			int win = 5 * 1ton();
			int commission = muldiv(win, 10, 100);
			win -= commission;

			db::available_balance -= (win + commission);
			db::service_balance += commission;
			game::payout(sender_addr, win, msg::x5());

			return ();
		}

		if (number < 2000) { ;; win x2
			int win = 2 * 1ton();
			int commission = muldiv(win, 10, 100);
			win -= commission;

			db::available_balance -= (win + commission);
			db::service_balance += commission;
			game::payout(sender_addr, win, msg::x2());

			return ();
		}

	}

## Conclusion

I write similar tutorials and analyzes on the TON network in my channel - https://t.me/ton_learn . I will be glad to your subscription.



Смарт-контракт представляет собой обработчик внутренних сообщений `recv_internal`, который если тело сообщения пустое, запускает лоттерею/розыгрыш или же выполняет одно из условий по `op`:
- `op == op::add_balance()` добавление баланса, на случай если в контракте закончаться деньги
- `op == op::maintain()` позволяет отправить из контракта внутренее сообщение с разным режимом, т.е позволяет управлять балансом смарт-контракта, а также если что позволит его уничтожить(сообщение с `mode == 128 + 32`)
- `op == op::withdraw()`  позволяет достать часть денег из смарт-контракта - накопленную комиссию

## Стилистика смарт-контракта

В смарт-контракте, который мы рассматриваем, хорошая стилистика:
- смарт-контракт грамотно разнесен на несколько файлов, таким образом, что его очень удобно читать
- работа с хранилищем(речь о регистре `с4` конечно же) комбинируется с глобальными переменными, что опять же улучшает читаемость кода, делая смарт-контракт понятным

Команды `op` и часто используемая переменная в 1 TON вынесена в отдельный файл `const.func`:

	int op::maintain() asm "1001 PUSHINT";
	int op::withdraw() asm "1002 PUSHINT";
	int op::add_balance() asm "1003 PUSHINT";

	int exit::invalid_bet() asm "2001 PUSHINT";

	int 1ton() asm "1000000000 PUSHINT";

В файл  `admin.func` вынесены админские команды, `adm::maintain`, которая позволяет отправить сообщение от смарт-контракта с любым mode - т.е позволяет управлять балансом смарт-контракта:

	() adm::maintain(slice in_msg_body) impure inline_ref {
		int mode = in_msg_body~load_uint(8);
		send_raw_message(in_msg_body~load_ref(), mode);    
	}
	
И `adm::withdraw()` позволяющая вытащить часть денег удобным способом:

	() adm::withdraw() impure inline_ref {
		cell body = begin_cell()
			.store_uint(0, 32)
			.store_slice(msg::commission_withdraw())
			.end_cell();

		cell msg = begin_cell()
			.store_uint(0x18, 6)
			.store_slice(db::admin_addr)
			.store_coins(db::service_balance)
			.store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			.store_ref(body)
			.end_cell();

		db::service_balance = 0;
		send_raw_message(msg, 0);
	}
	
Смарт-контракт отправляет сообщения при пройгрыше и победе, они вынесенны в отдельный файл `msg.func`, заметьте, что они являются типом `slice`:

	slice msg::commission_withdraw()    asm "<b 124 word Withdraw commission| $, b> <s PUSHSLICE";
	slice msg::jackpot()                asm "<b 124 word Congrats! You have won jackpot!| $, b> <s PUSHSLICE";
	slice msg::x2()                     asm "<b 124 word Congrats! You have won x2!| $, b> <s PUSHSLICE";
	slice msg::x5()                     asm "<b 124 word Congrats! You have won x5!| $, b> <s PUSHSLICE";
	
В `game.func` расположена логика розыгрыша/лотереи, код данного файла мы рассмотрим детально, но позже. В смарт-контракте предусмотрен Get-метод, который возвращает информацию из регистра `с4` смарт-контракта. Хранится этот метод в файле `get-methods.func`: 

	(int, int, (int, int), int, int) get_info() method_id {
		init_data();
		return (db::available_balance, db::service_balance, parse_std_addr(db::admin_addr), db::last_number, db::hash);
	}
	
И наконец-то работа с хранилищем в файле `storage.func`. Здесь важно отметить, что данные не сохраняются постоянно в регистр с4, а сначала они сохраняются в глобальные переменные, а потом в конце некоторого логического кода происходит сохранение в регистр c помощью функции `pack_data()`:

	global int init?;

	global int db::available_balance;
	global int db::service_balance;
	global slice db::admin_addr;
	global int db::last_number;
	global int db::hash;


	() init_data() impure {
		ifnot(null?(init?)) {
			throw(0x123);
		}

		slice ds = get_data().begin_parse();

		db::available_balance = ds~load_coins();
		db::service_balance = ds~load_coins();
		db::admin_addr = ds~load_msg_addr();
		db::last_number = ds~load_uint(64);
		db::hash = slice_empty?(ds) ? 0 : ds~load_uint(256);

		init? = true;
	}

	() pack_data() impure {
		set_data(
			begin_cell()
				.store_coins(db::available_balance)
				.store_coins(db::service_balance)
				.store_slice(db::admin_addr)
				.store_uint(db::last_number, 64)
				.store_uint(db::hash, 256)
			.end_cell()
		);
	}
	
## Разберем recv_internal()

Файл `main.fc` начинается с импорта файлов, по которым мы прошлись выше:

	#include "lib/stdlib.func";
	#include "struct/const.func";
	#include "struct/storage.func";
	#include "struct/msg.func";
	#include "struct/game.func";
	#include "struct/admin.func";
	#include "struct/get-methods.func";


	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {

	}

Достаем сообщение и функцией [slice_hash](https://docs.ton.org/develop/func/stdlib#slice_hash) создаем хэш, который далее будем использовать для рандома. Также как вы помните, любое сообщение начинается с флагов, сделаем небольшую проверку:

	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

	}

Инициализируем данные с помощью вспомогательной функции из файла `storage.func` и здесь же достанем адрес из сообщения:

	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

		init_data();

		slice sender_addr = cs~load_msg_addr();

	}
	
Кажется, что дальше логично было бы достать `op`, но для удобства использования смарт-контракта, основной функционал используется без `op`, таким образом пользователь просто отправляет пустое сообщение в контракт и розыгрыш/лотерея начинается. Чтобы реализовать подобный функционал, просто проверяем оставшееся сообщение, если оно пустое, запускаем игру.

	#include "lib/stdlib.func";
	#include "struct/const.func";
	#include "struct/storage.func";
	#include "struct/msg.func";
	#include "struct/game.func";
	#include "struct/admin.func";
	#include "struct/get-methods.func";


	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

		init_data();

		slice sender_addr = cs~load_msg_addr();

		if (in_msg_body.slice_empty?()) {
			game::start(sender_addr, msg_value, hash);
			pack_data();
			throw(0);
		}
	}
	
Внутри функции игры мы будем менять данные, которые позже нужно будет сохранить в регистр хранения постоянных данных `с4`, внутри функции менятются глобальные переменные, а в `recv_internal()` мы сохраняем:

	#include "lib/stdlib.func";
	#include "struct/const.func";
	#include "struct/storage.func";
	#include "struct/msg.func";
	#include "struct/game.func";
	#include "struct/admin.func";
	#include "struct/get-methods.func";


	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

		init_data();

		slice sender_addr = cs~load_msg_addr();

		if (in_msg_body.slice_empty?()) {
			game::start(sender_addr, msg_value, hash);
			pack_data();
			throw(0);
		}
	}
	
Здесь может возникнуть вопрос, зачем вызывается исключение, после того как все отработало правильно. В соответствии с документацией по [TVM пункт 4.5.1](https://ton.org/tvm.pdf) для исключений есть зарезервированные коды 0–31, совпадающие с [exit_code](https://docs.ton.org/learn/tvm-instructions/tvm-exit-codes), а значит 0 -  cтандартный код завершения успешного выполнения.

Дальше все просто, `op`, смысл которых мы разобрали выше, итоговый код `main.func`:

	#include "lib/stdlib.func";
	#include "struct/const.func";
	#include "struct/storage.func";
	#include "struct/msg.func";
	#include "struct/game.func";
	#include "struct/admin.func";
	#include "struct/get-methods.func";


	() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
		slice cs = in_msg_full.begin_parse();
		int hash = slice_hash(cs); 
		throw_if(0, cs~load_uint(4) & 1);

		init_data();

		slice sender_addr = cs~load_msg_addr();

		if (in_msg_body.slice_empty?()) {
			game::start(sender_addr, msg_value, hash);
			pack_data();
			throw(0);
		}

		int op = in_msg_body~load_uint(32);
		int is_admin = equal_slices(sender_addr, db::admin_addr);
		if (op == op::add_balance()) {
			db::available_balance += msg_value;
			pack_data();
			throw(0);
		}

		if (op == op::maintain()) {
			throw_if(0xfffe, is_admin == 0);
			adm::maintain(in_msg_body);
			throw(0);
		}

		if (op == op::withdraw()) {
			throw_if(0xfffd, is_admin == 0);
			adm::withdraw();
			pack_data();
			throw(0);
		}

		throw(0xffff);
	}

## Разберем game.func

Наконец-то мы добрались до логики игры, файл `game.func` начинается со вспомогательной функции выплаты приза:

	() game::payout(slice sender_addr, int amount, slice msg) impure inline_ref {
		cell body = begin_cell()
			.store_uint(0, 32)
			.store_slice(msg)
			.end_cell();

		cell msg = begin_cell()
			.store_uint(0x18, 6)
			.store_slice(sender_addr)
			.store_coins(amount)
			.store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
			.store_ref(body)
			.end_cell();

		send_raw_message(msg, 0);
	}  
	
Сама же игра начинается с проверки, что значание присланное в контракт равно `1 TON`:

	() game::start(slice sender_addr, int msg_value, int hash) impure inline_ref {
		throw_unless(exit::invalid_bet(), msg_value == 1ton());
	}

Далее собирается хэш для рандома, собирается он из текущего времени, хэша из регистра `с4`, хэша сформированного в `recv_internal` из сообщения и `cur_lt()` - логического времени текущей транзакции:

	() game::start(slice sender_addr, int msg_value, int hash) impure inline_ref {
		throw_unless(exit::invalid_bet(), msg_value == 1ton());
		int new_hash = slice_hash(
			begin_cell()
				.store_uint(db::hash, 256)
				.store_uint(hash, 256)
				.store_uint(cur_lt(), 64)
				.store_uint(now(), 64)
			.end_cell()
			.begin_parse()
		);
	}
	
С помощью хэша можно сформировать рандом, но прежде чем генерировать рандом с помощью функции `rand()` рандомизируем хэш с помощью [randomize](https://docs.ton.org/develop/func/stdlib/#randomize).

() game::start(slice sender_addr, int msg_value, int hash) impure inline_ref {
    throw_unless(exit::invalid_bet(), msg_value == 1ton());
    int new_hash = slice_hash(
        begin_cell()
            .store_uint(db::hash, 256)
            .store_uint(hash, 256)
            .store_uint(cur_lt(), 64)
            .store_uint(now(), 64)
        .end_cell()
        .begin_parse()
    );

    randomize(new_hash);
	
}

> Отмечу что это одна из возможных вариации реализации рандома, про рандом можно прочитать в документации - https://docs.ton.org/develop/smart-contracts/guidelines/random-number-generation

Для реализации вероятности выйгрыша генерируется число от 0 до 10000, здесь все просто, смотрим в какой перцентиль попало число и в зависимости от этого отправляем или не отпраaвляем выйгрышь:

	() game::start(slice sender_addr, int msg_value, int hash) impure inline_ref {
		throw_unless(exit::invalid_bet(), msg_value == 1ton());
		int new_hash = slice_hash(
			begin_cell()
				.store_uint(db::hash, 256)
				.store_uint(hash, 256)
				.store_uint(cur_lt(), 64)
				.store_uint(now(), 64)
			.end_cell()
			.begin_parse()
		);

		randomize(new_hash);
		db::hash = new_hash;

		int number = rand(10000); ;; [0; 10000)
		db::last_number = number;
		db::available_balance += 1ton();

		if (number < 10) { ;; win 1/2 available balance
			int win = db::available_balance / 2;
			int commission = muldiv(win, 10, 100);
			win -= commission;

			db::available_balance -= (win + commission);
			db::service_balance += commission;

			game::payout(sender_addr, win, msg::jackpot());

			return ();
		}

		if (number < 1000) { ;; win x5
			int win = 5 * 1ton();
			int commission = muldiv(win, 10, 100);
			win -= commission;

			db::available_balance -= (win + commission);
			db::service_balance += commission;
			game::payout(sender_addr, win, msg::x5());

			return ();
		}

		if (number < 2000) { ;; win x2
			int win = 2 * 1ton();
			int commission = muldiv(win, 10, 100);
			win -= commission;

			db::available_balance -= (win + commission);
			db::service_balance += commission;
			game::payout(sender_addr, win, msg::x2());

			return ();
		}

	}

## Заключение 

Подобные туториалы и разборы по сети TON я пишу в свой канал - https://t.me/ton_learn . Буду рад вашей подписке.



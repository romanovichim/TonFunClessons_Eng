# str2buf [![NPM](https://img.shields.io/npm/v/str2buf.svg)](https://npmjs.com/package/str2buf) [![Build](https://travis-ci.org/kevlened/str2buf.svg?branch=master)](https://travis-ci.org/kevlened/str2buf)
isomorphic string <=> buffer in 198 bytes

## Install

`npm install str2buf`

## Usage

You must provide strings where each character is represented by a single byte (also known as the binary string format). For example, the output of a `atob` operation or any ASCII string would be allowed.

```javascript
const str2buf = require('str2buf')

str2buf.toUint8Array('hello')
// new Uint8Array([104,101,108,108,111])

str2buf.fromUint8Array(new Uint8Array([104,101,108,108,111]))
// 'hello'

str2buf.toBuffer('hello')
// ArrayBuffer

str2buf.fromBuffer(new Uint8Array([104,101,108,108,111]).buffer)
// 'hello'
```

## Can it be smaller?

If you use ES6 imports with a bundler that supports tree-shaking, yes!

```javascript
import { fromUint8Array } from 'str2buf'
```

#### Perf profile

```
⏱ browser performance on 1000 arrays or strings of size 25003:
str2buf.fromUint8Array: 245.842ms
str2buf.toUint8Array: 165.240ms
str2buf.fromBuffer: 234.920ms
str2buf.toBuffer: 160.021ms

⏱ node performance on 1000 arrays or strings of size 25003:
str2buf.fromUint8Array: 20.213ms
str2buf.toUint8Array: 15.655ms
str2buf.fromBuffer: 32.880ms
str2buf.toBuffer: 21.514ms
```

## License

MIT
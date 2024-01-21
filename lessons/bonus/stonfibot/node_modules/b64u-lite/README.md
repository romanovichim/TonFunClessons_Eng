# b64u-lite [![NPM](https://img.shields.io/npm/v/b64u-lite.svg)](https://npmjs.com/package/b64u-lite) [![Build](https://travis-ci.org/kevlened/b64u-lite.svg?branch=master)](https://travis-ci.org/kevlened/b64u-lite) [![bundlephobia](https://img.shields.io/bundlephobia/minzip/b64u-lite.svg)](https://bundlephobia.com/result?p=b64u-lite)

isomorphic base64url library in 244 bytes

## Usage

```javascript
const b64u = require('b64u-lite');

b64u.toBase64Url('hi there? 你好');
// aGkgdGhlcmU_IOS9oOWlvQ

// add padding
b64u.toBase64Url('hi there? 你好', true);
// aGkgdGhlcmU_IOS9oOWlvQ==

// convert a buffer to b64u
b64u.toBase64Url(new Uint8Array([228, 189, 160, 229, 165, 189]).buffer);
// 5L2g5aW9

// convert b64u to a buffer
b64u.toBuffer('5L2g5aW9');
// new Uint8Array([228, 189, 160, 229, 165, 189]).buffer

// works with or without padding
b64u.fromBase64Url('aGkgdGhlcmU_IOS9oOWlvQ==');
b64u.fromBase64Url('aGkgdGhlcmU_IOS9oOWlvQ');
// hi there? 你好

// equivalent to btoa
b64u.fromBinaryString('hi there? ');
// aGkgdGhlcmU_IA

// with padding
b64u.fromBinaryString('hi there? ', true);
// aGkgdGhlcmU_IA==

// equivalent to atob
b64u.toBinaryString('aGkgdGhlcmU=');
// hi there?
```

## Can it be smaller?

If you use ES6 imports with a bundler that supports tree-shaking, yes!

```javascript
import { toBase64Url } from 'b64u-lite'
```

## License

MIT
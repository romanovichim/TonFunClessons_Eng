# isomorphic-webcrypto [![NPM](https://img.shields.io/npm/v/isomorphic-webcrypto.svg)](https://npmjs.com/package/isomorphic-webcrypto) [![bundlephobia](https://img.shields.io/bundlephobia/minzip/isomorphic-webcrypto.svg)](https://bundlephobia.com/result?p=isomorphic-webcrypto)
webcrypto library for Node, React Native and IE11+

## What?

There's [a great Node polyfill](https://github.com/PeculiarVentures/webcrypto) for the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API), but it's not isomorphic.

IE11 and versions of Safari < 11 use an older version of the spec, so the browser implementation includes a [webcrypto-shim](https://github.com/vibornoff/webcrypto-shim) to iron out the differences. You'll still need to provide your own Promise polyfill.

There's currently no native crypto support in React Native, so [the Microsoft Research library](https://github.com/kevlened/msrCrypto) is exposed.

> **Note:** If you're performing cross-platform jwt operations, consider [jwt-lite](https://www.npmjs.com/package/jwt-lite) or [jwt-verifier-lite](https://www.npmjs.com/package/jwt-verifier-lite) (for OpenID Connect), which build on `isomorphic-webcrypto`

## Install

`npm install isomorphic-webcrypto`

## Usage

There's a simple hashing example below, but [there are many more WebCrypto examples here](https://github.com/diafygi/webcrypto-examples). This example requires you to `npm install hex-lite`.

```javascript
const crypto = require('isomorphic-webcrypto')
const hex = require('hex-lite')
// or
import crypto from 'isomorphic-webcrypto'
import hex from 'hex-lite'

crypto.subtle.digest(
  { name: 'SHA-256' },
  new Uint8Array([1,2,3]).buffer
)
.then(hash => {
  // hashes are usually represented as hex strings
  // hex-lite makes this easier
  const hashString = hex.fromBuffer(hash);
})
```

### React Native

React Native support is implemented using [the Microsoft Research library](https://github.com/kevlened/msrCrypto). The React Native environment only supports `Math.random()`, so [react-native-securerandom](https://github.com/rh389/react-native-securerandom) is used to provide proper entropy. This is handled automatically, except for `crypto.getRandomValues()`, which requires you wait:

```javascript
const crypto = require('isomorphic-webcrypto')

(async () => {
  // Only needed for crypto.getRandomValues
  // but only wait once, future calls are secure
  await crypto.ensureSecure();
  const array = new Uint8Array(1);
  crypto.getRandomValues(array);
  const safeValue = array[0];
})()
```

Working React Native examples:

* Using [create-react-native-app](https://github.com/kevlened/webcrypto-react-native-examples/tree/master/crna) with Expo
* Using an ejected [create-react-native-app](https://github.com/kevlened/webcrypto-react-native-examples/blob/master/crna-ejected)

## I just want to drop in a script tag

You should use [the webcrypto-shim](https://github.com/vibornoff/webcrypto-shim) library directly:

```html
<!-- Any Promise polyfill will do -->
<script src="https://unpkg.com/bluebird"></script>
<script src="https://unpkg.com/webcrypto-shim"></script>
```

## Compatibility

* IE11+
* Safari 8+
* Edge 12+
* Chrome 43+
* Opera 24+
* Firefox 34+
* Node 8+
* React Native

Although the library runs on IE11+, the level of functionality varies between implementations. The grid below shows the discrepancies between the latest versions of each environment.

> __Legend__
>
> * **~** works with some caveats - see the \_\_tests__ directory for the caveats
> * **?** untested
> * **x** unsupported algorithm
> * **strikethrough** broken method

| Key                | Node                                                        | React Native                                                | Chrome/Firefox                                          | Safari                                                      | Edge                                                          | IE11                                                            |
| ------------------ | ----------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| HS256              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify       | importKey<br>exportKey<br>generateKey<br>sign<br>verify         |
| HS384              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify       | importKey<br>exportKey<br>generateKey<br>sign<br>verify         |
| HS512              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify       | x                                                               |
| RS256              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>~~generateKey~~<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | ~importKey<br>exportKey<br>~generateKey<br>~~sign~~<br>verify | ~importKey<br>~exportKey<br>generateKey<br>~~sign~~<br>verify   |
| RS384              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>~~generateKey~~<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>~~exportKey~~<br>generateKey<br>sign<br>verify | ~importKey<br>exportKey<br>~generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify         |
| RS512              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>~~generateKey~~<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>~~exportKey~~<br>generateKey<br>sign<br>verify | ~importKey<br>exportKey<br>~generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>~~sign~~<br>~~verify~~ |
| PS256              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>~~generateKey~~<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>~~exportKey~~<br>generateKey<br>sign<br>verify | ? | ? |
| PS384              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>~~generateKey~~<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>~~exportKey~~<br>generateKey<br>sign<br>verify | ? | ? |
| PS512              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>~~generateKey~~<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>~~exportKey~~<br>generateKey<br>sign<br>verify | ? | ? |
| ES256              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | x                                                             | x                                                               |
| ES384              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | x                                                             | x                                                               |
| ES512              | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify     | importKey<br>exportKey<br>generateKey<br>sign<br>verify | x                                                           | x                                                             | x                                                               |
| RSA1_5             | ? | ? | ? | ? | ? | ? |
| RSA-OAEP           | ? | ? | ? | ? | ? | ? |
| RSA-OAEP-256       | ? | ? | ? | ? | ? | ? |
| A128KW             | ? | ? | ? | ? | ? | ? |
| A192KW             | ? | ? | ? | ? | ? | ? |
| A256KW             | ? | ? | ? | ? | ? | ? |
| dir                | ? | ? | ? | ? | ? | ? |
| ECDH-ES            | ? | ? | ? | ? | ? | ? |
| ECDH-ES+A128KW     | ? | ? | ? | ? | ? | ? |
| ECDH-ES+A192KW     | ? | ? | ? | ? | ? | ? |
| ECDH-ES+A256KW     | ? | ? | ? | ? | ? | ? |
| A128GCMKW          | ? | ? | ? | ? | ? | ? |
| A192GCMKW          | ? | ? | ? | ? | ? | ? |
| A256GCMKW          | ? | ? | ? | ? | ? | ? |
| PBES2-HS256+A128KW | ? | ? | ? | ? | ? | ? |
| PBES2-HS384+A192KW | ? | ? | ? | ? | ? | ? |
| PBES2-HS512+A256KW | ? | ? | ? | ? | ? | ? |

Here's a legend for the [JWA alg abbreviations](https://tools.ietf.org/html/rfc7518#section-3.1):

| Key                | Signature, MAC or Key Management Algorithm                                    |
| ------------------ | ----------------------------------------------------------------------------- |
| HS256              | HMAC using SHA-256                                                            |
| HS384              | HMAC using SHA-384                                                            |
| HS512              | HMAC using SHA-512                                                            |
| RS256              | RSASSA-PKCS1-v1_5 using SHA-256                                               |
| RS384              | RSASSA-PKCS1-v1_5 using SHA-384                                               |
| RS512              | RSASSA-PKCS1-v1_5 using SHA-512                                               |
| ES256              | ECDSA using P-256 and SHA-256                                                 |
| ES384              | ECDSA using P-384 and SHA-384                                                 |
| ES512              | ECDSA using P-521 and SHA-512                                                 |
| PS256              | RSASSA-PSS using SHA-256 and MGF1 with SHA-256                                |
| PS384              | RSASSA-PSS using SHA-384 and MGF1 with SHA-384                                |
| PS512              | RSASSA-PSS using SHA-512 and MGF1 with SHA-512                                |
| RSA1_5             | RSAES-PKCS1-v1_5                                                              |
| RSA-OAEP           | RSAES OAEP using default parameters                                           |
| RSA-OAEP-256       | RSAES OAEP using SHA-256 and MGF1 with SHA-256                                |
| A128KW             | AES Key Wrap with default initial value using 128-bit key                     |
| A192KW             | AES Key Wrap with default initial value using 192-bit key                     |
| A256KW             | AES Key Wrap with default initial value using 256-bit key                     |
| dir                | Direct use of a shared symmetric key as the CEK                               |
| ECDH-ES            | Elliptic Curve Diffie-Hellman Ephemeral Static key agreement using Concat KDF |
| ECDH-ES+A128KW     | ECDH-ES using Concat KDF and CEK wrapped with "A128KW"                        |
| ECDH-ES+A192KW     | ECDH-ES using Concat KDF and CEK wrapped with "A192KW"                        |
| ECDH-ES+A256KW     | ECDH-ES using Concat KDF and CEK wrapped with "A256KW"                        |
| A128GCMKW          | Key wrapping with AES GCM using 128-bit key                                   |
| A192GCMKW          | Key wrapping with AES GCM using 192-bit key                                   |
| A256GCMKW          | Key wrapping with AES GCM using 256-bit key                                   |
| PBES2-HS256+A128KW | PBES2 with HMAC SHA-256 and "A128KW" wrapping                                 |
| PBES2-HS384+A192KW | PBES2 with HMAC SHA-384 and "A192KW" wrapping                                 |
| PBES2-HS512+A256KW | PBES2 with HMAC SHA-512 and "A256KW" wrapping                                 |

## License

MIT

let generateSecureRandom;
if (require.getModules) {
  const NativeModules = require('react-native').NativeModules;
  const RNSecureRandom = NativeModules.RNSecureRandom;
  const NativeUnimoduleProxy = NativeModules.NativeUnimoduleProxy;
  if (RNSecureRandom && RNSecureRandom.generateSecureRandomAsBase64) {
    generateSecureRandom = require('react-native-securerandom').generateSecureRandom;
  } else if (NativeUnimoduleProxy && NativeUnimoduleProxy.exportedMethods.ExpoRandom) {
    generateSecureRandom = require('expo-random').getRandomBytesAsync;
  }
}

if (!generateSecureRandom) {
  console.log(`
    isomorphic-webcrypto cannot ensure the security of some operations!
    Install and configure react-native-securerandom or expo-random
    If managed by Expo, run 'expo install expo-random'
  `);
  generateSecureRandom = function(length) {
    const uint8Array = new Uint8Array(length);
    while (length && length--) {
      uint8Array[length] = Math.floor(Math.random() * 256);
    }
    return Promise.resolve(uint8Array);
  }
}

const str2buf = require('str2buf');
const b64u = require('b64u-lite');
const b64 = require('b64-lite');

if(global.window.navigator === undefined)
  global.window.navigator = {};

global.window.navigator.userAgent = '';
global.atob = typeof atob === 'undefined' ? b64.atob : atob;
global.btoa = typeof btoa === 'undefined' ? b64.btoa : btoa;
global.msrCryptoPermanentForceSync = true;

const crypto = require('msrcrypto');

let isSecured = false;
const secured = new Promise((resolve, reject) => {
    if (!crypto.initPrng) return resolve(false);
    return generateSecureRandom(48)
    .then(byteArray => {
        crypto.initPrng(Array.from(byteArray))
        isSecured = true;
        resolve(true);
    })
    .catch(err => reject(err));
  })
  .then(() => {
    if (!global.window.crypto) {
      global.window.crypto = crypto;
    }

    global.asmCrypto = require('asmcrypto.js');
    const liner = require('./webcrypto-liner');

    const originalImportKey = crypto.subtle.importKey;
    crypto.subtle.importKey = function importKey() {
      const importType = arguments[0];
      const key = arguments[1];
      const algorithm = arguments[2];
      if (algorithm.name.toUpperCase() === 'PBKDF2') {
        let importKey, ref;
        if (liner.crypto.subtle.getProvider) {
          ref = liner.crypto.subtle.getProvider('PBKDF2');
          importKey = ref.onImportKey;
        } else {
          ref = liner.crypto.subtle;
          importKey = ref.importKey;
        }
        if (importType === 'raw') arguments[1] = new ArrayBuffer(arguments[1]);
        return importKey.apply(ref, arguments);
      }

      return originalImportKey.apply(this, arguments)
      .then(res => {
        res.algorithm.name = standardizeAlgoName(res.algorithm.name);
        switch(res.type) {
          case 'secret':
            res.usages = res.algorithm.name === 'HMAC' ? ['sign', 'verify'] : ['encrypt', 'decrypt'];
            break;
          case 'private':
            res.usages = ['sign'];
            break;
          case 'public':
            res.usages = ['verify'];
            break;
        }
        if (importType === 'jwk' && key.kty === 'RSA') {
          res.algorithm.modulusLength = b64u.toBinaryString(key.n).length * 8;
          res.algorithm.publicExponent = str2buf.toUint8Array(b64u.toBinaryString(key.e));
        }
        return res;
      });
    }

    const originalDeriveBits = crypto.subtle.deriveBits;
    crypto.subtle.deriveBits = function deriveBits() {
      const algorithm = arguments[0];
      if (algorithm.name.toUpperCase() === 'PBKDF2') {
        let deriveBits, ref;
        if (liner.crypto.subtle.getProvider) {
          ref = liner.crypto.subtle.getProvider('PBKDF2');
          deriveBits = ref.onDeriveBits;
        } else {
          ref = liner.crypto.subtle;
          deriveBits = ref.deriveBits;
        }
        return deriveBits.apply(ref, arguments);
      }

      return originalDeriveBits.apply(this, arguments);
    }
  })
  .catch(e => {
    console.log('Unable to secure:', e.message);
    throw e;
  });

crypto.ensureSecure = () => secured;

function standardizeAlgoName(algo) {
  const upper = algo.toUpperCase();
  return upper === 'RSASSA-PKCS1-V1_5' ? 'RSASSA-PKCS1-v1_5' : upper;
}

function ensureUint8Array(buffer) {
  if (typeof buffer === 'string' || buffer instanceof String)
    return str2buf.toUint8Array(buffer);
  if (!buffer) return;
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  if (buffer instanceof Uint8Array) return buffer;
  return buffer;
}

const originalGetRandomValues = crypto.getRandomValues;
crypto.getRandomValues = function getRandomValues() {
  if (!isSecured) {
    throw new Error(`
      You must wait until the library is secure to call this method:

      await crypto.ensureSecure();
      const safeValues = crypto.getRandomValues();
    `);
  }
  return originalGetRandomValues.apply(crypto, arguments);
}

// wrap all methods to ensure they're secure
const methods = [
  'decrypt',
  'digest',
  'deriveKey',
  'encrypt',
  'exportKey',
  'generateKey',
  'importKey',
  'sign',
  'unwrapKey',
  'verify',
  'wrapKey'
]
methods.map(key => {
  const original = crypto.subtle[key]
  const proxy = function() {
    const args = Array.from(arguments)
    const before = crypto.subtle[key];
    return crypto.ensureSecure()
    .then(() => {
      const after = crypto.subtle[key];
      if (before === after) {
        return original.apply(crypto.subtle, args)
      } else {
        return crypto.subtle[key].apply(crypto.subtle, args)
      }
    });
  }
  crypto.subtle[key] = proxy;
  crypto.subtle[key].name = key;
})

const originalGenerateKey = crypto.subtle.generateKey;
crypto.subtle.generateKey = function generateKey() {
  const algo = arguments[0];
  if (algo) {
    if (algo.name) algo.name = algo.name.toLowerCase();
    if (algo.hash && algo.hash.name) algo.hash.name = algo.hash.name.toLowerCase();
  }
  return originalGenerateKey.apply(this, arguments)
  .then(res => {
    if (res.publicKey) {
      res.publicKey.usages = ['verify'];
      res.publicKey.algorithm.name = standardizeAlgoName(res.publicKey.algorithm.name);
      res.privateKey.usages = ['sign'];
      res.privateKey.algorithm.name = standardizeAlgoName(res.privateKey.algorithm.name);
    } else {
      res.algorithm.name = standardizeAlgoName(res.algorithm.name);
      res.usages = res.algorithm.name === 'HMAC' ? ['sign', 'verify'] : ['encrypt', 'decrypt'];
    }
    return res;
  });
}

const originalExportKey = crypto.subtle.exportKey;
crypto.subtle.exportKey = function exportKey() {
  const key = arguments[1];
  return originalExportKey.apply(this, arguments)
  .then(res => {
    if (res.kty === 'RSA' || res.kty === 'EC') {
      if (res.d) {
        res.key_ops = ['sign'];
      } else {
        res.key_ops = ['verify'];
      }
    }
    switch(res.alg) {
      case 'EC-256':
      case 'EC-384':
      case 'EC-521':
        delete res.alg;
    }
    return res;
  });
}

const originalDigest = crypto.subtle.digest;
crypto.subtle.digest = function digest() {
  arguments[1] = ensureUint8Array(arguments[1]);
  return originalDigest.apply(this, arguments);
}

module.exports = crypto

require('webcrypto-shim');
var b64u = require('b64u-lite/bundle/b64u-lite');
var str2buf = require('str2buf');

var isEdge = navigator.userAgent.indexOf('Edge') > -1;
var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
function assign(target) {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var to = Object(target);

  for (var index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];

    if (nextSource != null) {
      for (var nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}

function toArray(item) {
  return Array.prototype.slice.call(item);
}

if (isEdge || isIE11) {
  var originalGenerateKey = crypto.subtle.generateKey;
  crypto.subtle.generateKey = function() {
    const args = toArray(arguments);
    var algo = assign({}, args[0]);
    if (algo.name === 'ECDSA') {
      delete algo.hash
    }
    args[0] = algo;
    return originalGenerateKey.apply(crypto.subtle, args);
  };

  var originalExportKey = crypto.subtle.exportKey;
  crypto.subtle.exportKey = function() {
    var args = toArray(arguments);
    var key = args[1];
    return originalExportKey.apply(crypto.subtle, args)
    .then(function(res) {
      if (!res.key_ops || !res.key_ops.length) {
        res.key_ops = key.usages;
      }
      return res;
    });;
  };

  var originalImportKey = crypto.subtle.importKey;
  crypto.subtle.importKey = function() {
    var args = toArray(arguments);
    var jwk = args[1];
    var algo = args[2];

    if (algo.name === 'RSASSA-PKCS1-v1_5' && algo.hash.name === 'SHA-256') {
      delete jwk.qi;
    }
    
    return originalImportKey.apply(crypto.subtle, args)
    .then(function(res) {
      var algo = res.algorithm;
      if (algo.name === 'RSASSA-PKCS1-v1_5') {
        algo.modulusLength = str2buf.toUint8Array(b64u.toBinaryString(jwk.n)).length * 8;
        algo.publicExponent = str2buf.toUint8Array(b64u.toBinaryString(jwk.e));
      }
      return res;
    });
  };
}

module.exports = window.crypto;

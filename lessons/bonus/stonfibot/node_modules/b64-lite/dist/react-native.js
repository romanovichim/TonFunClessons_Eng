const Base64 = require('base-64');

const b64_lite = {
  atob(base64) {
    return Base64.decode(base64)
  },
  btoa(byteString) {
    return Base64.encode(byteString)
  },
  toBase64(input) {
    if (typeof input === 'string')
      return b64_lite.btoa(unescape(encodeURIComponent(input)))
    else {
      var buffer = new Uint8Array(input);
      var binary = '';
      for (var b = 0; b < buffer.byteLength; b++) {
          binary += String.fromCharCode(buffer[b]);
      }
      return b64_lite.btoa(binary);
    }
  },
  fromBase64(b64) {
    return decodeURIComponent(escape(b64_lite.atob(b64)))
  },
  toBuffer(b64) {
    var utf8 = b64_lite.atob(b64);
    var result = new Uint8Array(utf8.length);
    for (var i = 0; i < utf8.length; i++) {
        result[i] = utf8.charCodeAt(i);
    }
    return result;
  }
}

module.exports = b64_lite;

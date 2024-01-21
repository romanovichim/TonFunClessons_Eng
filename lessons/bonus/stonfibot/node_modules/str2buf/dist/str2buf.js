function r(r){for(var t="",n=0,e=r.length;n<e;n++)t+=String.fromCharCode(r[n]);return t}function t(r){for(var t=new Uint8Array(r.length),n=0,e=r.length;n<e;n++)t[n]=r.charCodeAt(n);return t}function n(t){return r(new Uint8Array(t))}function e(r){return t(r).buffer}exports.fromUint8Array=r,exports.toUint8Array=t,exports.fromBuffer=n,exports.toBuffer=e;
//# sourceMappingURL=str2buf.js.map

interface WebCrypto extends Crypto {
    ensureSecure(): Promise<any>;
}
declare var crypto: WebCrypto
export = crypto;
export default crypto;

describe( "ISSUES", () => {
    it( "22", (done) => {
        let jwkKey = { "kty": "RSA", "e": "AQAB", "n": "wji8Hk1TfEP_SHGnRcMh9LUslx4pQGMpLssQSIvMXJrJfsz7OZNqPSOgjhefwldiEgNHeDnk87kYQ6LYHLfqVMKyBxn2rUNMcflVKUSQnFtOZZIWnkeji-3OprIXhH7G65zUvYG_rj2x13JtNrDYSQ2A3eJOIWvrA5TBFOSDh9M", "alg": "RSA-OAEP", "ext": true },
            jwkAlg = { name: "RSA-OAEP", hash: { name: "SHA-1" } },
            jwkExt = true,
            jwkUse = ["encrypt"];

        crypto.subtle.importKey( "jwk", jwkKey, jwkAlg, jwkExt, jwkUse )
            .then( (pubKey) => {
                expect(pubKey).toEqual(jasmine.any(CryptoKey));
            })
            .catch(fail)
            .then(done);
    });

    describe( "30", () => {
        let alg = { name: 'RSA-OAEP', hash: 'SHA-256' },
            jwkKey = {"alg":"RSA-OAEP-256","kty":"RSA","e":"AQAB","ext":true,"key_ops":["encrypt"],"n":"viC6FqJnk6d6ycPAnIZ6vdqUxN9HGN9ApNYnul9h3P4vR0ApmiDDSQSRi4WVC0aOAtrEQ_lLRfs4ggsU46sYEDtRhW4WMfjEd3XXzKJuy4jYXgu3ODNlnnaXNzN1lHcmGhG3oZQTT628_MWwCiZEwTZIJXpAHkyMjQNhEYjLpdIMqhXEicpk38rB-WpemllcTJYf_cYu_k9LMTAm9PiP3ANQZyYrDCluyIN-wN8P35W_eLNonyZANLUdIdMMJPa9sbDLez0jmHdeJtpeGXn8juWPsI_S3yQDJtW-LqitRrmjGD4RvRMdfyd_WmQ98HeDd--GxAkRVpLqtx3pPNknoQ"},
            plaintext = "Hello World!";

        let importComplete = crypto.subtle.importKey( "jwk", jwkKey, alg, true, [ 'encrypt' ] );

        it( "encrypt", (done) => {
            importComplete
                .then( (key) => {
                    return crypto.subtle.encrypt( { name: 'RSA-OAEP'/*, hash: 'SHA-256' */ }, key, s2b(plaintext) )
                })
                .then( (ciphertext) => {
                    expect(ciphertext).toEqual(jasmine.any(ArrayBuffer));
                })
                .catch(fail)
                .then(done);
        });
    });
});

describe( "IndexedDB interoperability", function () {
    //
    // WebCrypto stuff initialization
    //

    var alg = { name: 'AES-CBC', length: 256 };
    var key;
    var db;

    var genKeyComplete = crypto.subtle.generateKey( alg, true, [ 'encrypt', 'decrypt' ] )
            .then( function ( res ) {
                key = res;
            });


    //
    // IndexedDB stuff initialization
    //

    var idbOpen = indexedDB.open('webcrypto-shim', 1);

    idbOpen.onupgradeneeded = function () {
        db = idbOpen.result;
        db.createObjectStore('keys');
    }

    var idbOpenComplete = new Promise( function ( resolve, reject ) {
        idbOpen.onerror = reject;
        idbOpen.onsuccess = function () {
            db = idbOpen.result;
            resolve();
        };
    });

    //
    // Tests
    //

    it( "window.crypto", function () {
        expect(typeof indexedDB).not.toBe('undefined');
    });

    it( "store and retrieve key", function ( done ) {
        Promise.all( [ genKeyComplete, idbOpenComplete ] )
            .then( function () {
                var tx = db.transaction( [ 'keys' ], 'readwrite' );
                var st = tx.objectStore('keys');

                var r = st.put( key, 'test' );
                return new Promise( function ( resolve, reject ) {
                    r.onerror = reject;
                    r.onsuccess = function () {
                        resolve(r);
                    };
                });
            })
            .then( function ( r ) {
                expect(r).not.toBe('undefined');
                expect(r.readyState).toEqual('done');
            })
            .then( function () {
                var tx = db.transaction( 'keys', 'readonly' );
                var st = tx.objectStore( 'keys' );

                var r = st.get('test');
                return new Promise( function ( resolve, reject ) {
                    r.onerror = reject;
                    r.onsuccess = function () {
                        resolve(r);
                    };
                });
            })
            .then( function ( r ) {
                expect(r).not.toBe('undefined');
                expect(r.readyState).toEqual('done');
                expect(r.result).toEqual(jasmine.any(CryptoKey));
            })
            .catch(fail)
            .then(done);
    });
});

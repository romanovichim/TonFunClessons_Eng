"use strict";
var _tsdLite = require("tsd-lite");
var _basic = require("./fixtures/basic");
// eslint-disable-next-line react-hooks/rules-of-hooks
const router = (0, _basic).useRouter();
describe("router.push()", ()=>{
    // router.push will return void when the type matches, otherwise it should error
    describe("href", ()=>{
        it("will error on non-urls", ()=>{
            (0, _tsdLite).expectError(router.push("should-error"));
        });
        it("can accept an absolute url", ()=>{
            (0, _tsdLite).expectType(router.push("/apple"));
            (0, _tsdLite).expectType(router.push("/banana"));
        });
        it("can accept a ANY relative url", ()=>{
            // We only type-check absolute urls
            (0, _tsdLite).expectType(router.push("./this/work/but/is/not/valid"));
        });
        it("works for dynamic urls", ()=>{
            (0, _tsdLite).expectType(router.push("/colors/blue"));
        });
        it("works for CatchAll routes", ()=>{
            (0, _tsdLite).expectType(router.push("/animals/bear"));
            (0, _tsdLite).expectType(router.push("/animals/bear/cat/dog"));
            (0, _tsdLite).expectType(router.push("/mix/apple/blue/cat/dog"));
        });
        it.skip("works for optional CatchAll routes", ()=>{
        // CatchAll routes are not currently optional
        // expectType<void>(router.push('/animals/'));
        });
        it("will error when providing extra parameters", ()=>{
            (0, _tsdLite).expectError(router.push("/colors/blue/test"));
        });
        it("will error when providing too few parameters", ()=>{
            (0, _tsdLite).expectError(router.push("/mix/apple"));
            (0, _tsdLite).expectError(router.push("/mix/apple/cat"));
        });
    });
    describe("HrefObject", ()=>{
        it("will error on non-urls", ()=>{
            (0, _tsdLite).expectError(router.push({
                pathname: "should-error"
            }));
        });
        it("can accept an absolute url", ()=>{
            (0, _tsdLite).expectType(router.push({
                pathname: "/apple"
            }));
            (0, _tsdLite).expectType(router.push({
                pathname: "/banana"
            }));
        });
        it("can accept a ANY relative url", ()=>{
            // We only type-check absolute urls
            (0, _tsdLite).expectType(router.push({
                pathname: "./this/work/but/is/not/valid"
            }));
        });
        it("works for dynamic urls", ()=>{
            (0, _tsdLite).expectType(router.push({
                pathname: "/colors/[color]",
                params: {
                    color: "blue"
                }
            }));
        });
        it("requires a valid pathname", ()=>{
            (0, _tsdLite).expectError(router.push({
                pathname: "/colors/[invalid]",
                params: {
                    color: "blue"
                }
            }));
        });
        it("requires a valid param", ()=>{
            (0, _tsdLite).expectError(router.push({
                pathname: "/colors/[color]",
                params: {
                    invalid: "blue"
                }
            }));
        });
        it("works for catch all routes", ()=>{
            (0, _tsdLite).expectType(router.push({
                pathname: "/animals/[...animal]",
                params: {
                    animal: [
                        "cat",
                        "dog"
                    ]
                }
            }));
        });
        it("allows numeric inputs", ()=>{
            (0, _tsdLite).expectType(router.push({
                pathname: "/mix/[fruit]/[color]/[...animals]",
                params: {
                    color: 1,
                    fruit: "apple",
                    animals: [
                        2,
                        "cat"
                    ]
                }
            }));
        });
        it("requires an array for catch all routes", ()=>{
            (0, _tsdLite).expectError(router.push({
                pathname: "/animals/[...animal]",
                params: {
                    animal: "cat"
                }
            }));
        });
        it("works for mixed routes", ()=>{
            (0, _tsdLite).expectType(router.push({
                pathname: "/mix/[fruit]/[color]/[...animals]",
                params: {
                    color: "red",
                    fruit: "apple",
                    animals: []
                }
            }));
        });
        it("requires all params in mixed routes", ()=>{
            (0, _tsdLite).expectError(router.push({
                pathname: "/mix/[fruit]/[color]/[...animals]",
                params: {
                    color: "red",
                    animals: [
                        "cat",
                        "dog"
                    ]
                }
            }));
        });
    });
});
describe("useSearchParams", ()=>{
    (0, _tsdLite).expectType((0, _basic).useSearchParams());
    (0, _tsdLite).expectType((0, _basic).useSearchParams());
    (0, _tsdLite).expectError((0, _basic).useSearchParams());
    (0, _tsdLite).expectError((0, _basic).useSearchParams());
});
describe("useLocalSearchParams", ()=>{
    (0, _tsdLite).expectType((0, _basic).useLocalSearchParams());
    (0, _tsdLite).expectType((0, _basic).useLocalSearchParams());
    (0, _tsdLite).expectError((0, _basic).useSearchParams());
    (0, _tsdLite).expectError((0, _basic).useSearchParams());
});
describe("useGlobalSearchParams", ()=>{
    (0, _tsdLite).expectType((0, _basic).useGlobalSearchParams());
    (0, _tsdLite).expectType((0, _basic).useGlobalSearchParams());
    (0, _tsdLite).expectError((0, _basic).useGlobalSearchParams());
    (0, _tsdLite).expectError((0, _basic).useGlobalSearchParams());
});
describe("useSegments", ()=>{
    it("can accept an absolute url", ()=>{
        (0, _tsdLite).expectType((0, _basic).useSegments());
    });
    it("only accepts valid possible urls", ()=>{
        (0, _tsdLite).expectError((0, _basic).useSegments());
    });
    it("can accept an array of segments", ()=>{
        (0, _tsdLite).expectType((0, _basic).useSegments());
    });
    it("only accepts valid possible segments", ()=>{
        (0, _tsdLite).expectError((0, _basic).useSegments());
    });
});
describe("external routes", ()=>{
    it("can accept any external url", ()=>{
        (0, _tsdLite).expectType(router.push("http://expo.dev"));
    });
    it("can accept any schema url", ()=>{
        (0, _tsdLite).expectType(router.push("custom-schema://expo.dev"));
    });
    it("can accept mailto url", ()=>{
        (0, _tsdLite).expectType(router.push("mailto:test@test.com"));
    });
});

//# sourceMappingURL=route.test.js.map
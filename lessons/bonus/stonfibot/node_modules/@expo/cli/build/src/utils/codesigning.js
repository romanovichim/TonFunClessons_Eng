"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getDevelopmentCodeSigningDirectory = getDevelopmentCodeSigningDirectory;
exports.getCodeSigningInfoAsync = getCodeSigningInfoAsync;
exports.signManifestString = signManifestString;
exports.DevelopmentCodeSigningInfoFile = void 0;
var _codeSigningCertificates = require("@expo/code-signing-certificates");
var _getUserState = require("@expo/config/build/getUserState");
var _jsonFile = _interopRequireDefault(require("@expo/json-file"));
var _core = require("@urql/core");
var _fs = require("fs");
var _graphql = require("graphql");
var _path = _interopRequireDefault(require("path"));
var _structuredHeaders = require("structured-headers");
var _env = require("./env");
var _errors = require("./errors");
var _getExpoGoIntermediateCertificate = require("../api/getExpoGoIntermediateCertificate");
var _getProjectDevelopmentCertificate = require("../api/getProjectDevelopmentCertificate");
var _appQuery = require("../api/graphql/queries/AppQuery");
var _actions = require("../api/user/actions");
var _generated = require("../graphql/generated");
var Log = _interopRequireWildcard(require("../log"));
var _link = require("../utils/link");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
const debug = require("debug")("expo:codesigning");
const DEVELOPMENT_CODE_SIGNING_SETTINGS_FILE_NAME = "development-code-signing-settings-2.json";
function getDevelopmentCodeSigningDirectory() {
    return _path.default.join((0, _getUserState).getExpoHomeDirectory(), "codesigning");
}
function getProjectDevelopmentCodeSigningInfoFile(defaults) {
    function getFile(easProjectId) {
        const filePath = _path.default.join(getDevelopmentCodeSigningDirectory(), easProjectId, DEVELOPMENT_CODE_SIGNING_SETTINGS_FILE_NAME);
        return new _jsonFile.default(filePath);
    }
    async function readAsync(easProjectId) {
        let projectSettings;
        try {
            projectSettings = await getFile(easProjectId).readAsync();
        } catch  {
            projectSettings = await getFile(easProjectId).writeAsync(defaults, {
                ensureDir: true
            });
        }
        // Set defaults for any missing fields
        return {
            ...defaults,
            ...projectSettings
        };
    }
    async function setAsync(easProjectId, json) {
        try {
            return await getFile(easProjectId).mergeAsync(json, {
                cantReadFileDefault: defaults
            });
        } catch  {
            return await getFile(easProjectId).writeAsync({
                ...defaults,
                ...json
            }, {
                ensureDir: true
            });
        }
    }
    return {
        getFile,
        readAsync,
        setAsync
    };
}
const DevelopmentCodeSigningInfoFile = getProjectDevelopmentCodeSigningInfoFile({
    easProjectId: null,
    scopeKey: null,
    privateKey: null,
    certificateChain: null
});
exports.DevelopmentCodeSigningInfoFile = DevelopmentCodeSigningInfoFile;
async function getCodeSigningInfoAsync(exp, expectSignatureHeader, privateKeyPath) {
    if (!expectSignatureHeader) {
        return null;
    }
    let parsedExpectSignature;
    try {
        parsedExpectSignature = (0, _structuredHeaders).parseDictionary(expectSignatureHeader);
    } catch  {
        throw new _errors.CommandError("Invalid value for expo-expect-signature header");
    }
    const expectedKeyIdOuter = parsedExpectSignature.get("keyid");
    if (!expectedKeyIdOuter) {
        throw new _errors.CommandError("keyid not present in expo-expect-signature header");
    }
    const expectedKeyId = expectedKeyIdOuter[0];
    if (typeof expectedKeyId !== "string") {
        throw new _errors.CommandError(`Invalid value for keyid in expo-expect-signature header: ${expectedKeyId}`);
    }
    let expectedAlg = null;
    const expectedAlgOuter = parsedExpectSignature.get("alg");
    if (expectedAlgOuter) {
        const expectedAlgTemp = expectedAlgOuter[0];
        if (typeof expectedAlgTemp !== "string") {
            throw new _errors.CommandError("Invalid value for alg in expo-expect-signature header");
        }
        expectedAlg = expectedAlgTemp;
    }
    if (expectedKeyId === "expo-root") {
        return await getExpoRootDevelopmentCodeSigningInfoAsync(exp);
    } else if (expectedKeyId === "expo-go") {
        throw new _errors.CommandError("Invalid certificate requested: cannot sign with embedded keyid=expo-go key");
    } else {
        return await getProjectCodeSigningCertificateAsync(exp, privateKeyPath, expectedKeyId, expectedAlg);
    }
}
/**
 * Get a development code signing certificate for the expo-root -> expo-go -> (development certificate) certificate chain.
 * This requires the user be logged in and online, otherwise try to use the cached development certificate.
 */ async function getExpoRootDevelopmentCodeSigningInfoAsync(exp) {
    var ref, ref1;
    const easProjectId = (ref = exp.extra) == null ? void 0 : (ref1 = ref.eas) == null ? void 0 : ref1.projectId;
    // can't check for scope key validity since scope key is derived on the server from projectId and we may be offline.
    // we rely upon the client certificate check to validate the scope key
    if (!easProjectId) {
        debug(`WARN: Expo Application Services (EAS) is not configured for your project. Configuring EAS enables a more secure development experience amongst many other benefits. ${(0, _link).learnMore("https://docs.expo.dev/eas/")}`);
        return null;
    }
    const developmentCodeSigningInfoFromFile = await DevelopmentCodeSigningInfoFile.readAsync(easProjectId);
    const validatedCodeSigningInfo = validateStoredDevelopmentExpoRootCertificateCodeSigningInfo(developmentCodeSigningInfoFromFile, easProjectId);
    // 1. If online, ensure logged in, generate key pair and CSR, fetch and cache certificate chain for projectId
    //    (overwriting existing dev cert in case projectId changed or it has expired)
    if (!_env.env.EXPO_OFFLINE) {
        try {
            return await fetchAndCacheNewDevelopmentCodeSigningInfoAsync(easProjectId);
        } catch (e) {
            if (validatedCodeSigningInfo) {
                Log.warn("There was an error fetching the Expo development certificate, falling back to cached certificate");
                return validatedCodeSigningInfo;
            } else {
                // need to return null here and say a message
                throw e;
            }
        }
    }
    // 2. check for cached cert/private key matching projectId and scopeKey of project, if found and valid return private key and cert chain including expo-go cert
    if (validatedCodeSigningInfo) {
        return validatedCodeSigningInfo;
    }
    // 3. if offline, return null
    Log.warn("Offline and no cached development certificate found, unable to sign manifest");
    return null;
}
/**
 * Get the certificate configured for expo-updates for this project.
 */ async function getProjectCodeSigningCertificateAsync(exp, privateKeyPath, expectedKeyId, expectedAlg) {
    var ref, ref2;
    const codeSigningCertificatePath = (ref = exp.updates) == null ? void 0 : ref.codeSigningCertificate;
    if (!codeSigningCertificatePath) {
        return null;
    }
    if (!privateKeyPath) {
        throw new _errors.CommandError("Must specify --private-key-path argument to sign development manifest for requested code signing key");
    }
    const codeSigningMetadata = (ref2 = exp.updates) == null ? void 0 : ref2.codeSigningMetadata;
    if (!codeSigningMetadata) {
        throw new _errors.CommandError('Must specify "codeSigningMetadata" under the "updates" field of your app config file to use EAS code signing');
    }
    const { alg , keyid  } = codeSigningMetadata;
    if (!alg || !keyid) {
        throw new _errors.CommandError('Must specify "keyid" and "alg" in the "codeSigningMetadata" field under the "updates" field of your app config file to use EAS code signing');
    }
    if (expectedKeyId !== keyid) {
        throw new _errors.CommandError(`keyid mismatch: client=${expectedKeyId}, project=${keyid}`);
    }
    if (expectedAlg && expectedAlg !== alg) {
        throw new _errors.CommandError(`"alg" field mismatch (client=${expectedAlg}, project=${alg})`);
    }
    const { privateKeyPEM , certificatePEM  } = await getProjectPrivateKeyAndCertificateFromFilePathsAsync({
        codeSigningCertificatePath,
        privateKeyPath
    });
    return {
        keyId: keyid,
        privateKey: privateKeyPEM,
        certificateForPrivateKey: certificatePEM,
        certificateChainForResponse: [],
        scopeKey: null
    };
}
async function readFileWithErrorAsync(path, errorMessage) {
    try {
        return await _fs.promises.readFile(path, "utf8");
    } catch  {
        throw new _errors.CommandError(errorMessage);
    }
}
async function getProjectPrivateKeyAndCertificateFromFilePathsAsync({ codeSigningCertificatePath , privateKeyPath  }) {
    const [codeSigningCertificatePEM, privateKeyPEM] = await Promise.all([
        readFileWithErrorAsync(codeSigningCertificatePath, `Code signing certificate cannot be read from path: ${codeSigningCertificatePath}`),
        readFileWithErrorAsync(privateKeyPath, `Code signing private key cannot be read from path: ${privateKeyPath}`), 
    ]);
    const privateKey = (0, _codeSigningCertificates).convertPrivateKeyPEMToPrivateKey(privateKeyPEM);
    const certificate = (0, _codeSigningCertificates).convertCertificatePEMToCertificate(codeSigningCertificatePEM);
    (0, _codeSigningCertificates).validateSelfSignedCertificate(certificate, {
        publicKey: certificate.publicKey,
        privateKey
    });
    return {
        privateKeyPEM,
        certificatePEM: codeSigningCertificatePEM
    };
}
/**
 * Validate that the cached code signing info is still valid for the current project and
 * that it hasn't expired. If invalid, return null.
 */ function validateStoredDevelopmentExpoRootCertificateCodeSigningInfo(codeSigningInfo, easProjectId) {
    if (codeSigningInfo.easProjectId !== easProjectId) {
        return null;
    }
    const { privateKey: privateKeyPEM , certificateChain: certificatePEMs , scopeKey ,  } = codeSigningInfo;
    if (!privateKeyPEM || !certificatePEMs) {
        return null;
    }
    const certificateChain = certificatePEMs.map((certificatePEM)=>(0, _codeSigningCertificates).convertCertificatePEMToCertificate(certificatePEM)
    );
    // TODO(wschurman): maybe move to @expo/code-signing-certificates
    const leafCertificate = certificateChain[0];
    const now = new Date();
    if (leafCertificate.validity.notBefore > now || leafCertificate.validity.notAfter < now) {
        return null;
    }
    // TODO(wschurman): maybe do more validation, like validation of projectID and scopeKey within eas certificate extension
    return {
        keyId: "expo-go",
        certificateChainForResponse: certificatePEMs,
        certificateForPrivateKey: certificatePEMs[0],
        privateKey: privateKeyPEM,
        scopeKey
    };
}
function actorCanGetProjectDevelopmentCertificate(actor, app) {
    var ref, ref3, ref4, ref5;
    const owningAccountId = app.ownerAccount.id;
    const owningAccountIsActorPrimaryAccount = actor.__typename === "User" || actor.__typename === "SSOUser" ? actor.primaryAccount.id === owningAccountId : false;
    const userHasPublishPermissionForOwningAccount = !!((ref4 = (ref = actor.accounts.find((account)=>account.id === owningAccountId
    )) == null ? void 0 : (ref3 = ref.users) == null ? void 0 : ref3.find((userPermission)=>userPermission.actor.id === actor.id
    )) == null ? void 0 : (ref5 = ref4.permissions) == null ? void 0 : ref5.includes(_generated.Permission.Publish));
    return owningAccountIsActorPrimaryAccount || userHasPublishPermissionForOwningAccount;
}
async function fetchAndCacheNewDevelopmentCodeSigningInfoAsync(easProjectId) {
    const actor = await (0, _actions).ensureLoggedInAsync();
    let app;
    try {
        app = await _appQuery.AppQuery.byIdAsync(easProjectId);
    } catch (e) {
        if (e instanceof _graphql.GraphQLError || e instanceof _core.CombinedError) {
            return null;
        }
        throw e;
    }
    if (!actorCanGetProjectDevelopmentCertificate(actor, app)) {
        return null;
    }
    const keyPair = (0, _codeSigningCertificates).generateKeyPair();
    const keyPairPEM = (0, _codeSigningCertificates).convertKeyPairToPEM(keyPair);
    const csr = (0, _codeSigningCertificates).generateCSR(keyPair, `Development Certificate for ${easProjectId}`);
    const csrPEM = (0, _codeSigningCertificates).convertCSRToCSRPEM(csr);
    const [developmentSigningCertificate, expoGoIntermediateCertificate] = await Promise.all([
        (0, _getProjectDevelopmentCertificate).getProjectDevelopmentCertificateAsync(easProjectId, csrPEM),
        (0, _getExpoGoIntermediateCertificate).getExpoGoIntermediateCertificateAsync(easProjectId), 
    ]);
    await DevelopmentCodeSigningInfoFile.setAsync(easProjectId, {
        easProjectId,
        scopeKey: app.scopeKey,
        privateKey: keyPairPEM.privateKeyPEM,
        certificateChain: [
            developmentSigningCertificate,
            expoGoIntermediateCertificate
        ]
    });
    return {
        keyId: "expo-go",
        certificateChainForResponse: [
            developmentSigningCertificate,
            expoGoIntermediateCertificate
        ],
        certificateForPrivateKey: developmentSigningCertificate,
        privateKey: keyPairPEM.privateKeyPEM,
        scopeKey: app.scopeKey
    };
}
function signManifestString(stringifiedManifest, codeSigningInfo) {
    const privateKey = (0, _codeSigningCertificates).convertPrivateKeyPEMToPrivateKey(codeSigningInfo.privateKey);
    const certificate = (0, _codeSigningCertificates).convertCertificatePEMToCertificate(codeSigningInfo.certificateForPrivateKey);
    return (0, _codeSigningCertificates).signBufferRSASHA256AndVerify(privateKey, certificate, Buffer.from(stringifiedManifest, "utf8"));
}

//# sourceMappingURL=codesigning.js.map
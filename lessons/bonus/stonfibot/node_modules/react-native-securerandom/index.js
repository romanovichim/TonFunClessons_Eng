/* @flow */

import { NativeModules, Platform } from 'react-native';
import { toByteArray } from 'base64-js';

const { RNSecureRandom } = NativeModules;

export function generateSecureRandom(length: number): Promise<Uint8Array> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        throw Error('react-native-securerandom is currently only available for iOS and Android');
    }

    if (!RNSecureRandom || !RNSecureRandom.generateSecureRandomAsBase64) {
        throw Error('react-native-securerandom is not properly linked');
    }

    return RNSecureRandom.generateSecureRandomAsBase64(length).then(base64 => toByteArray(base64));
}

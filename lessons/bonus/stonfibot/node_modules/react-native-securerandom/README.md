# react-native-securerandom
[![npm version](https://badge.fury.io/js/react-native-securerandom.svg)](https://badge.fury.io/js/react-native-securerandom)

A library to generate cryptographically-secure random bytes. Uses `SecRandomCopyBytes` on iOS and `SecureRandom` on Android.

## Usage
The library exports a single function:
### generateSecureRandom(length: number) => Promise\<Uint8Array\>
Takes a length, the number of bytes to generate, and returns a `Promise` that resolves with a `Uint8Array`.

```javascript
import { generateSecureRandom } from 'react-native-securerandom';

generateSecureRandom(12).then(randomBytes => console.log(randomBytes));
```

## Installation

`$ yarn add react-native-securerandom`

### Automatic linking with react-native link

`$ react-native link react-native-securerandom`

### Manual linking

#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-securerandom` and add `RNSecureRandom.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNSecureRandom.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import net.rhogan.rnsecurerandom.RNSecureRandomPackage;` to the imports at the top of the file
  - Add `new RNSecureRandomPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-securerandom'
  	project(':react-native-securerandom').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-securerandom/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-securerandom')
  	```

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getLatestRelease;
function _semver() {
  const data = _interopRequireDefault(require("semver"));
  _semver = function () {
    return data;
  };
  return data;
}
var _cacheManager = _interopRequireDefault(require("../cacheManager"));
var _fetch = require("../fetch");
var _logger = _interopRequireDefault(require("../logger"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function isDiffPurgeEntry(data) {
  var _data$commit, _data$commit2;
  return [data.name, data.zipball_url, data.tarball_url, (_data$commit = data.commit) === null || _data$commit === void 0 ? void 0 : _data$commit.sha, (_data$commit2 = data.commit) === null || _data$commit2 === void 0 ? void 0 : _data$commit2.url, data.node_id].indexOf(false) === -1;
}

/**
 * Checks via GitHub API if there is a newer stable React Native release and,
 * if it exists, returns the release data.
 *
 * If the latest release is not newer or if it's a prerelease, the function
 * will return undefined.
 */
async function getLatestRelease(name, currentVersion) {
  _logger.default.debug('Checking for a newer version of React Native');
  try {
    _logger.default.debug(`Current version: ${currentVersion}`);

    // if the version is a 1000.0.0 version or 0.0.0, we want to bail
    // since they are nightlies or unreleased versions
    if (currentVersion.includes('1000.0.0') || currentVersion.includes('0.0.0')) {
      return;
    }
    const cachedLatest = _cacheManager.default.get(name, 'latestVersion');
    if (cachedLatest) {
      _logger.default.debug(`Cached release version: ${cachedLatest}`);
    }
    _logger.default.debug('Checking for newer releases on GitHub');
    const eTag = _cacheManager.default.get(name, 'eTag');
    const {
      stable,
      candidate
    } = await getLatestRnDiffPurgeVersion(name, eTag);
    _logger.default.debug(`Latest release: ${stable} (${candidate})`);
    if (_semver().default.compare(stable, currentVersion) >= 0) {
      return {
        stable,
        candidate,
        changelogUrl: buildChangelogUrl(stable),
        diffUrl: buildDiffUrl(stable)
      };
    }
  } catch (e) {
    _logger.default.debug('Something went wrong with remote version checking, moving on');
    _logger.default.debug(e);
  }
  return undefined;
}
function buildChangelogUrl(version) {
  return `https://github.com/facebook/react-native/releases/tag/v${version}`;
}
function buildDiffUrl(version) {
  return `https://react-native-community.github.io/upgrade-helper/?from=${version}`;
}
/**
 * Returns the most recent React Native version available to upgrade to.
 */
async function getLatestRnDiffPurgeVersion(name, eTag) {
  const options = {
    // https://developer.github.com/v3/#user-agent-required
    headers: {
      'User-Agent': 'React-Native-CLI'
    }
  };
  if (eTag) {
    options.headers['If-None-Match'] = eTag;
  }
  const {
    data,
    status,
    headers
  } = await (0, _fetch.fetch)('https://api.github.com/repos/react-native-community/rn-diff-purge/tags', options);
  const result = {
    stable: '0.0.0'
  };

  // Remote is newer.
  if (status === 200) {
    const body = data.filter(isDiffPurgeEntry);
    const eTagHeader = headers.get('eTag');
    for (let {
      name: version
    } of body) {
      if (!result.candidate && version.includes('-rc')) {
        result.candidate = version.substring(8);
        continue;
      }
      if (!version.includes('-rc')) {
        result.stable = version.substring(8);
        if (eTagHeader) {
          _logger.default.debug(`Saving ${eTagHeader} to cache`);
          _cacheManager.default.set(name, 'eTag', eTagHeader);
          _cacheManager.default.set(name, 'latestVersion', result.stable);
        }
        return result;
      }
    }
    return result;
  }

  // Cache is still valid.
  if (status === 304) {
    result.stable = _cacheManager.default.get(name, 'latestVersion') ?? result.stable;
  }

  // Should be returned only if something went wrong.
  return result;
}

//# sourceMappingURL=getLatestRelease.ts.map
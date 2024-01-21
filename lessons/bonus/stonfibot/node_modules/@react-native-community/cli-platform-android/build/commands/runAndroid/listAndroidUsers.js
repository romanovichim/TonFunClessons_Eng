"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkUsers = checkUsers;
exports.promptForUser = promptForUser;
function _execa() {
  const data = _interopRequireDefault(require("execa"));
  _execa = function () {
    return data;
  };
  return data;
}
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function checkUsers(device, adbPath) {
  try {
    const adbArgs = ['-s', device, 'shell', 'pm', 'list', 'users'];
    _cliTools().logger.debug(`Checking users on "${device}"...`);
    const {
      stdout
    } = _execa().default.sync(adbPath, adbArgs, {
      encoding: 'utf-8'
    });
    const regex = new RegExp(/^\s*UserInfo\{(?<userId>\d+):(?<userName>.*):(?<userFlags>[0-9a-f]*)}/);
    const users = [];
    const lines = stdout.split('\n');
    for (const line of lines) {
      const res = regex.exec(line);
      if (res === null || res === void 0 ? void 0 : res.groups) {
        users.push({
          id: res.groups.userId,
          name: res.groups.userName
        });
      }
    }
    if (users.length > 1) {
      _cliTools().logger.debug(`Available users are:\n${users.map(user => `${user.name} - ${user.id}`).join('\n')}`);
    }
    return users;
  } catch (error) {
    _cliTools().logger.error('Failed to check users of device.', error);
    return [];
  }
}
async function promptForUser(users) {
  const {
    selectedUser
  } = await (0, _cliTools().prompt)({
    type: 'select',
    name: 'selectedUser',
    message: 'Which profile would you like to launch your app into?',
    choices: users.map(user => ({
      title: user.name,
      value: user
    })),
    min: 1
  });
  return selectedUser;
}

//# sourceMappingURL=listAndroidUsers.ts.map
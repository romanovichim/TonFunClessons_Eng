"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTaskNames = getTaskNames;
var _toPascalCase = require("./toPascalCase");
function getTaskNames(appName, mode = 'debug', tasks, taskPrefix) {
  const appTasks = tasks && tasks.length ? tasks : [taskPrefix + (0, _toPascalCase.toPascalCase)(mode)];
  return appName ? appTasks.map(command => `${appName}:${command}`) : appTasks;
}

//# sourceMappingURL=getTaskNames.ts.map
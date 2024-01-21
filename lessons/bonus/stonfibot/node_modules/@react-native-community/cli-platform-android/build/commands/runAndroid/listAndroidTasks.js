"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.promptForTaskSelection = exports.parseTasksFromGradleFile = exports.getGradleTasks = void 0;
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _execa() {
  const data = _interopRequireDefault(require("execa"));
  _execa = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const parseTasksFromGradleFile = (taskType, text) => {
  const instalTasks = [];
  const taskRegex = new RegExp(taskType === 'build' ? '^assemble|^bundle' : '^install');
  text.split('\n').forEach(line => {
    if (taskRegex.test(line.trim()) && /(?!.*?Test)^.*$/.test(line.trim())) {
      const metadata = line.split(' - ');
      instalTasks.push({
        task: metadata[0],
        description: metadata[1]
      });
    }
  });
  return instalTasks;
};
exports.parseTasksFromGradleFile = parseTasksFromGradleFile;
const getGradleTasks = (taskType, sourceDir) => {
  const loader = (0, _cliTools().getLoader)();
  loader.start('Searching for available Gradle tasks...');
  const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';
  try {
    const out = _execa().default.sync(cmd, ['tasks', '--group', taskType], {
      cwd: sourceDir
    }).stdout;
    loader.succeed();
    return parseTasksFromGradleFile(taskType, out);
  } catch {
    loader.fail();
    return [];
  }
};
exports.getGradleTasks = getGradleTasks;
const promptForTaskSelection = async (taskType, sourceDir) => {
  const tasks = getGradleTasks(taskType, sourceDir);
  if (!tasks.length) {
    throw new (_cliTools().CLIError)(`No actionable ${taskType} tasks were found...`);
  }
  const {
    task
  } = await (0, _cliTools().prompt)({
    type: 'select',
    name: 'task',
    message: `Select ${taskType} task you want to perform`,
    choices: tasks.map(t => ({
      title: `${_chalk().default.bold(t.task)} - ${t.description}`,
      value: t.task
    })),
    min: 1
  });
  return task;
};
exports.promptForTaskSelection = promptForTaskSelection;

//# sourceMappingURL=listAndroidTasks.ts.map
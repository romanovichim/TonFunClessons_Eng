"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bin = void 0;
Object.defineProperty(exports, "loadConfig", {
  enumerable: true,
  get: function () {
    return _cliConfig().default;
  }
});
exports.run = run;
function _cliConfig() {
  const data = _interopRequireDefault(require("@react-native-community/cli-config"));
  _cliConfig = function () {
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
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _child_process() {
  const data = _interopRequireDefault(require("child_process"));
  _child_process = function () {
    return data;
  };
  return data;
}
function _commander() {
  const data = require("commander");
  _commander = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
var _commands = require("./commands");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const pkgJson = require('../package.json');
const program = new (_commander().Command)().usage('[command] [options]').version(pkgJson.version, '-v', 'Output the current version').enablePositionalOptions();
const handleError = err => {
  _cliTools().logger.enable();
  if (program.opts().verbose) {
    _cliTools().logger.error(err.message);
  } else {
    // Some error messages (esp. custom ones) might have `.` at the end already.
    const message = err.message.replace(/\.$/, '');
    _cliTools().logger.error(`${message}.`);
  }
  if (err.stack) {
    _cliTools().logger.log(err.stack);
  }
  if (!program.opts().verbose && _cliTools().logger.hasDebugMessages()) {
    _cliTools().logger.info(_chalk().default.dim(`Run CLI with ${_chalk().default.reset('--verbose')} ${_chalk().default.dim('flag for more details.')}`));
  }
  process.exit(1);
};
function printExamples(examples) {
  let output = [];
  if (examples && examples.length > 0) {
    const formattedUsage = examples.map(example => `  ${example.desc}: \n  ${_chalk().default.cyan(example.cmd)}`).join('\n\n');
    output = output.concat([_chalk().default.bold('\nExample usage:'), formattedUsage]);
  }
  return output.join('\n').concat('\n');
}

/**
 * Custom type assertion needed for the `makeCommand` conditional
 * types to be properly resolved.
 */
function isDetachedCommand(command) {
  return command.detached === true;
}
function isAttachedCommand(command) {
  return !isDetachedCommand(command);
}

/**
 * Attaches a new command onto global `commander` instance.
 *
 * Note that this function takes additional argument of `Config` type in case
 * passed `command` needs it for its execution.
 */
function attachCommand(command, config) {
  // commander@9.x will internally push commands into an array structure!
  // Commands with duplicate names (e.g. from config) must be reduced before
  // calling this function.
  // https://unpkg.com/browse/commander@9.4.1/lib/command.js#L1308
  if (program.commands.find(cmd => cmd.name() === command.name)) {
    throw new Error('Invariant Violation: Attempted to override an already registered ' + `command: '${command.name}'. This is not supported by the underlying ` + 'library and will cause bugs. Ensure a command with this `name` is ' + 'only registered once.');
  }
  const cmd = program.command(command.name).option('--verbose', 'Increase logging verbosity').action(async function handleAction(...args) {
    const passedOptions = this.opts();
    const argv = Array.from(args).slice(0, -1);
    try {
      if (isDetachedCommand(command)) {
        await command.func(argv, passedOptions, config);
      } else if (isAttachedCommand(command)) {
        await command.func(argv, config, passedOptions);
      } else {
        throw new Error('A command must be either attached or detached');
      }
    } catch (error) {
      handleError(error);
    }
  });
  if (command.description) {
    cmd.description(command.description);
  }
  cmd.addHelpText('after', printExamples(command.examples));
  for (const opt of command.options || []) {
    cmd.option(opt.name, opt.description ?? '', opt.parse || (val => val), typeof opt.default === 'function' ? opt.default(config) : opt.default);
  }
}

// Platform name is optional argument passed by out of tree platforms.
async function run(platformName) {
  try {
    await setupAndRun(platformName);
  } catch (e) {
    handleError(e);
  }
}
const isCommandPassed = commandName => {
  return process.argv.filter(arg => arg === commandName).length > 0;
};
async function setupAndRun(platformName) {
  // Commander is not available yet

  // when we run `config`, we don't want to output anything to the console. We
  // expect it to return valid JSON
  if (isCommandPassed('config')) {
    _cliTools().logger.disable();
  }
  _cliTools().logger.setVerbose(process.argv.includes('--verbose'));

  // We only have a setup script for UNIX envs currently
  if (process.platform !== 'win32') {
    const scriptName = 'setup_env.sh';
    const absolutePath = _path().default.join(__dirname, '..', scriptName);
    try {
      _child_process().default.execFileSync(absolutePath, {
        stdio: 'pipe'
      });
    } catch (error) {
      _cliTools().logger.warn(`Failed to run environment setup script "${scriptName}"\n\n${_chalk().default.red(error)}`);
      _cliTools().logger.info(`React Native CLI will continue to run if your local environment matches what React Native expects. If it does fail, check out "${absolutePath}" and adjust your environment to match it.`);
    }
  }
  let config;
  try {
    config = (0, _cliConfig().default)();
    _cliTools().logger.enable();
    const commands = {};

    // Reduce overridden commands before registering
    for (const command of [..._commands.projectCommands, ...config.commands]) {
      commands[command.name] = command;
    }
    for (const command of Object.values(commands)) {
      attachCommand(command, config);
    }
  } catch (error) {
    /**
     * When there is no `package.json` found, the CLI will enter `detached` mode and a subset
     * of commands will be available. That's why we don't throw on such kind of error.
     */
    if (error.message.includes("We couldn't find a package.json")) {
      _cliTools().logger.debug(error.message);
      _cliTools().logger.debug('Failed to load configuration of your project. Only a subset of commands will be available.');
    } else {
      throw new (_cliTools().CLIError)('Failed to load configuration of your project.', error);
    }
  } finally {
    for (const command of _commands.detachedCommands) {
      attachCommand(command, config);
    }
  }
  const argv = [...process.argv];

  // If out of tree platform specifices custom platform name, we need to pass it to argv array for the init command.
  if (isCommandPassed('init') && platformName) {
    argv.push('--platform-name', platformName);
  }
  program.parse(argv);
}
const bin = require.resolve('./bin');
exports.bin = bin;

//# sourceMappingURL=index.ts.map
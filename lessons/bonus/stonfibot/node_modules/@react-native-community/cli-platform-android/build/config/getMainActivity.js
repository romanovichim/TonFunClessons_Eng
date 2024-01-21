"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getMainActivity;
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _fastXmlParser() {
  const data = require("fast-xml-parser");
  _fastXmlParser = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const MAIN_ACTION = 'android.intent.action.MAIN';
const LAUNCHER = 'android.intent.category.LAUNCHER';
/**
 * Reads the AndroidManifest.xml file and returns the name of the main activity.
 */

function getMainActivity(manifestPath) {
  try {
    const xmlParser = new (_fastXmlParser().XMLParser)({
      ignoreAttributes: false
    });
    const manifestContent = _fs().default.readFileSync(manifestPath, {
      encoding: 'utf8'
    });
    if (_fastXmlParser().XMLValidator.validate(manifestContent)) {
      const {
        manifest
      } = xmlParser.parse(manifestContent);
      const application = manifest.application || {};
      const activity = application.activity || {};
      let activities = [];
      if (!Array.isArray(activity)) {
        activities = [activity];
      } else {
        activities = activity;
      }
      const mainActivity = activities.find(act => {
        let intentFilters = act['intent-filter'];
        if (!intentFilters) {
          return false;
        }
        if (!Array.isArray(intentFilters)) {
          intentFilters = [intentFilters];
        }
        return intentFilters.find(intentFilter => {
          const {
            action,
            category
          } = intentFilter;
          let actions;
          let categories;
          if (!Array.isArray(action)) {
            actions = [action];
          } else {
            actions = action;
          }
          if (!Array.isArray(category)) {
            categories = [category];
          } else {
            categories = category;
          }
          if (actions && categories) {
            const parsedActions = actions.map(({
              '@_android:name': name
            }) => name);
            const parsedCategories = categories.map(({
              '@_android:name': name
            }) => name);
            return parsedActions.includes(MAIN_ACTION) && parsedCategories.includes(LAUNCHER);
          }
          return false;
        });
      });
      return mainActivity ? mainActivity['@_android:name'] : null;
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

//# sourceMappingURL=getMainActivity.ts.map
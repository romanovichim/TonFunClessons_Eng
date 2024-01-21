"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AppQuery = void 0;
var _graphql = require("graphql");
var _graphqlTag = _interopRequireDefault(require("graphql-tag"));
var _client = require("../client");
var _app = require("../types/App");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const AppQuery = {
    async byIdAsync (projectId) {
        const data = await (0, _client).withErrorHandlingAsync(_client.graphqlClient.query(_graphqlTag.default`
            query AppByIdQuery($appId: String!) {
              app {
                byId(appId: $appId) {
                  id
                  ...AppFragment
                }
              }
            }
            ${(0, _graphql).print(_app.AppFragmentNode)}
          `, {
            appId: projectId
        }, {
            additionalTypenames: [
                "App"
            ]
        }).toPromise());
        return data.app.byId;
    }
};
exports.AppQuery = AppQuery;

//# sourceMappingURL=AppQuery.js.map
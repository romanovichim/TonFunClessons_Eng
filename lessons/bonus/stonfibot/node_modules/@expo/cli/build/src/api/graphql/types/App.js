"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AppFragmentNode = void 0;
var _graphqlTag = _interopRequireDefault(require("graphql-tag"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const AppFragmentNode = _graphqlTag.default`
  fragment AppFragment on App {
    id
    scopeKey
    ownerAccount {
      id
    }
  }
`;
exports.AppFragmentNode = AppFragmentNode;

//# sourceMappingURL=App.js.map
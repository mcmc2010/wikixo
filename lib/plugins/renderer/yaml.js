"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const js_yaml_1 = __importDefault(require("js-yaml"));
const hexo_front_matter_1 = require("hexo-front-matter");
const hexo_log_1 = __importDefault(require("hexo-log"));
let schema;
// FIXME: workaround for https://github.com/hexojs/hexo/issues/4917
try {
    schema = js_yaml_1.default.DEFAULT_SCHEMA.extend(require('js-yaml-js-types').all);
}
catch (e) {
    if (e instanceof js_yaml_1.default.YAMLException) {
        (0, hexo_log_1.default)().warn('YAMLException: please see https://github.com/hexojs/hexo/issues/4917');
    }
    else {
        throw e;
    }
}
function yamlHelper(data) {
    return js_yaml_1.default.load((0, hexo_front_matter_1.escape)(data.text), { schema });
}
module.exports = yamlHelper;
//# sourceMappingURL=yaml.js.map
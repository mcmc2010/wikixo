"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = require("path");
const hexo_fs_1 = require("hexo-fs");
const js_yaml_1 = __importDefault(require("js-yaml"));
const hexo_util_1 = require("hexo-util");
module.exports = (ctx) => function multiConfigPath(base, configPaths, outputDir) {
    const { log } = ctx;
    const defaultPath = (0, path_1.join)(base, '_config.yml');
    if (!configPaths) {
        log.w('No config file entered.');
        return (0, path_1.join)(base, '_config.yml');
    }
    let paths;
    // determine if comma or space separated
    if (configPaths.includes(',')) {
        paths = configPaths.replace(' ', '').split(',');
    }
    else {
        // only one config
        let configPath = (0, path_1.isAbsolute)(configPaths) ? configPaths : (0, path_1.resolve)(base, configPaths);
        if (!(0, hexo_fs_1.existsSync)(configPath)) {
            log.w(`Config file ${configPaths} not found, using default.`);
            configPath = defaultPath;
        }
        return configPath;
    }
    const numPaths = paths.length;
    // combine files
    let combinedConfig = {};
    let count = 0;
    for (let i = 0; i < numPaths; i++) {
        const configPath = (0, path_1.isAbsolute)(paths[i]) ? paths[i] : (0, path_1.join)(base, paths[i]);
        if (!(0, hexo_fs_1.existsSync)(configPath)) {
            log.w(`Config file ${paths[i]} not found.`);
            continue;
        }
        // files read synchronously to ensure proper overwrite order
        const file = (0, hexo_fs_1.readFileSync)(configPath);
        const ext = (0, path_1.extname)(paths[i]).toLowerCase();
        if (ext === '.yml') {
            combinedConfig = (0, hexo_util_1.deepMerge)(combinedConfig, js_yaml_1.default.load(file));
            count++;
        }
        else if (ext === '.json') {
            combinedConfig = (0, hexo_util_1.deepMerge)(combinedConfig, js_yaml_1.default.load(file, { json: true }));
            count++;
        }
        else {
            log.w(`Config file ${paths[i]} not supported type.`);
        }
    }
    if (count === 0) {
        log.e('No config files found. Using _config.yml.');
        return defaultPath;
    }
    log.i('Config based on', count.toString(), 'files');
    const multiconfigRoot = outputDir || base;
    const outputPath = (0, path_1.join)(multiconfigRoot, '_multiconfig.yml');
    log.d(`Writing _multiconfig.yml to ${outputPath}`);
    (0, hexo_fs_1.writeFileSync)(outputPath, js_yaml_1.default.dump(combinedConfig));
    // write file and return path
    return outputPath;
};
//# sourceMappingURL=multi_config_path.js.map
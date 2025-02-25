"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = require("path");
const moment_1 = __importDefault(require("moment"));
const bluebird_1 = __importDefault(require("bluebird"));
const hexo_util_1 = require("hexo-util");
const hexo_fs_1 = require("hexo-fs");
let permalink;
const reservedKeys = {
    year: true,
    month: true,
    i_month: true,
    day: true,
    i_day: true,
    title: true,
    hash: true
};
function newPostPathFilter(data = {}, replace) {
    const sourceDir = this.source_dir;
    const draftDir = (0, path_1.join)(sourceDir, '_drafts');
    const postDir = (0, path_1.join)(sourceDir, '_posts');
    const { config } = this;
    const newPostName = config.new_post_name;
    const permalinkDefaults = config.permalink_defaults;
    const { path, layout, slug } = data;
    if (!permalink || permalink.rule !== newPostName) {
        permalink = new hexo_util_1.Permalink(newPostName, {});
    }
    let target = '';
    if (path) {
        switch (layout) {
            case 'page':
                target = (0, path_1.join)(sourceDir, path);
                break;
            case 'draft':
                target = (0, path_1.join)(draftDir, path);
                break;
            default:
                target = (0, path_1.join)(postDir, path);
        }
    }
    else if (slug) {
        switch (layout) {
            case 'page':
                target = (0, path_1.join)(sourceDir, slug, 'index');
                break;
            case 'draft':
                target = (0, path_1.join)(draftDir, slug);
                break;
            default: {
                const date = (0, moment_1.default)(data.date || Date.now());
                const keys = Object.keys(data);
                const hash = (0, hexo_util_1.createSha1Hash)().update(slug + date.unix().toString())
                    .digest('hex').slice(0, 12);
                const filenameData = {
                    year: date.format('YYYY'),
                    month: date.format('MM'),
                    i_month: date.format('M'),
                    day: date.format('DD'),
                    i_day: date.format('D'),
                    title: slug,
                    hash
                };
                for (let i = 0, len = keys.length; i < len; i++) {
                    const key = keys[i];
                    if (!reservedKeys[key])
                        filenameData[key] = data[key];
                }
                target = (0, path_1.join)(postDir, permalink.stringify({
                    ...permalinkDefaults,
                    ...filenameData
                }));
            }
        }
    }
    else {
        return bluebird_1.default.reject(new TypeError('Either data.path or data.slug is required!'));
    }
    if (!(0, path_1.extname)(target)) {
        target += (0, path_1.extname)(newPostName) || '.md';
    }
    if (replace) {
        return bluebird_1.default.resolve(target);
    }
    return (0, hexo_fs_1.ensurePath)(target);
}
module.exports = newPostPathFilter;
//# sourceMappingURL=new_post_path.js.map
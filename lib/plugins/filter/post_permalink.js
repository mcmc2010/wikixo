"use strict";
const hexo_util_1 = require("hexo-util");
const path_1 = require("path");
let permalink;
function postPermalinkFilter(data) {
    const { config } = this;
    const { id, _id, slug, title, date } = data;
    let { __permalink } = data;
    const { post_asset_folder } = config;
    if (__permalink) {
        if (post_asset_folder && !__permalink.endsWith('/') && !__permalink.endsWith('.html')) {
            __permalink += '/';
        }
        if (!__permalink.startsWith('/'))
            return `/${__permalink}`;
        return __permalink;
    }
    const hash = slug && date
        ? (0, hexo_util_1.createSha1Hash)().update(slug + date.unix().toString()).digest('hex').slice(0, 12)
        : null;
    const meta = {
        id: id || _id,
        title: slug,
        name: typeof slug === 'string' ? (0, path_1.basename)(slug) : '',
        post_title: (0, hexo_util_1.slugize)(title, { transform: 1 }),
        year: date.format('YYYY'),
        month: date.format('MM'),
        day: date.format('DD'),
        hour: date.format('HH'),
        minute: date.format('mm'),
        second: date.format('ss'),
        i_month: date.format('M'),
        i_day: date.format('D'),
        hash,
        category: config.default_category
    };
    if (!permalink || permalink.rule !== config.permalink) {
        permalink = new hexo_util_1.Permalink(config.permalink, {});
    }
    const { categories } = data;
    if (categories.length) {
        meta.category = categories.last().slug;
    }
    const keys = Object.keys(data);
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(meta, key))
            continue;
        // Use Object.getOwnPropertyDescriptor to copy getters to avoid "Maximum call
        // stack size exceeded" error
        Object.defineProperty(meta, key, Object.getOwnPropertyDescriptor(data, key));
    }
    if (config.permalink_defaults) {
        const keys2 = Object.keys(config.permalink_defaults);
        for (const key of keys2) {
            if (Object.prototype.hasOwnProperty.call(meta, key))
                continue;
            meta[key] = config.permalink_defaults[key];
        }
    }
    const permalink_stringify = permalink.stringify(meta);
    if (post_asset_folder && !permalink_stringify.endsWith('/') && !permalink_stringify.endsWith('.html')) {
        return `${permalink_stringify}/`;
    }
    return permalink_stringify;
}
module.exports = postPermalinkFilter;
//# sourceMappingURL=post_permalink.js.map
"use strict";
const hexo_util_1 = require("hexo-util");
function tocHelper(str, options = {}) {
    options = Object.assign({
        min_depth: 1,
        max_depth: 6,
        max_items: Infinity,
        class: 'toc',
        class_item: '',
        class_link: '',
        class_text: '',
        class_child: '',
        class_number: '',
        class_level: '',
        list_number: true
    }, options);
    const data = getAndTruncateTocObj(str, { min_depth: options.min_depth, max_depth: options.max_depth }, options.max_items);
    if (!data.length)
        return '';
    const className = (0, hexo_util_1.escapeHTML)(options.class);
    const itemClassName = (0, hexo_util_1.escapeHTML)(options.class_item || options.class + '-item');
    const linkClassName = (0, hexo_util_1.escapeHTML)(options.class_link || options.class + '-link');
    const textClassName = (0, hexo_util_1.escapeHTML)(options.class_text || options.class + '-text');
    const childClassName = (0, hexo_util_1.escapeHTML)(options.class_child || options.class + '-child');
    const numberClassName = (0, hexo_util_1.escapeHTML)(options.class_number || options.class + '-number');
    const levelClassName = (0, hexo_util_1.escapeHTML)(options.class_level || options.class + '-level');
    const listNumber = options.list_number;
    let result = `<ol class="${className}">`;
    const lastNumber = [0, 0, 0, 0, 0, 0];
    let firstLevel = 0;
    let lastLevel = 0;
    for (let i = 0, len = data.length; i < len; i++) {
        const el = data[i];
        const { level, id, text } = el;
        const href = id ? `#${(0, hexo_util_1.encodeURL)(id)}` : null;
        if (!el.unnumbered) {
            lastNumber[level - 1]++;
        }
        for (let i = level; i <= 5; i++) {
            lastNumber[i] = 0;
        }
        if (firstLevel) {
            for (let i = level; i < lastLevel; i++) {
                result += '</li></ol>';
            }
            if (level > lastLevel) {
                result += `<ol class="${childClassName}">`;
            }
            else {
                result += '</li>';
            }
        }
        else {
            firstLevel = level;
        }
        result += `<li class="${itemClassName} ${levelClassName}-${level}">`;
        if (href) {
            result += `<a class="${linkClassName}" href="${href}">`;
        }
        else {
            result += `<a class="${linkClassName}">`;
        }
        if (listNumber && !el.unnumbered) {
            result += `<span class="${numberClassName}">`;
            for (let i = firstLevel - 1; i < level; i++) {
                result += `${lastNumber[i]}.`;
            }
            result += '</span> ';
        }
        result += `<span class="${textClassName}">${text}</span></a>`;
        lastLevel = level;
    }
    for (let i = firstLevel - 1; i < lastLevel; i++) {
        result += '</li></ol>';
    }
    return result;
}
function getAndTruncateTocObj(str, options, max_items) {
    let data = (0, hexo_util_1.tocObj)(str, { min_depth: options.min_depth, max_depth: options.max_depth });
    if (data.length === 0) {
        return data;
    }
    if (max_items < 1 || max_items === Infinity) {
        return data;
    }
    const levels = data.map(item => item.level);
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    for (let currentLevel = max; data.length > max_items && currentLevel > min; currentLevel--) {
        data = data.filter(item => item.level < currentLevel);
    }
    data = data.slice(0, max_items);
    return data;
}
module.exports = tocHelper;
//# sourceMappingURL=toc.js.map
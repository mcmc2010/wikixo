"use strict";
const hexo_util_1 = require("hexo-util");
const rUrl = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\w]*))?)/;
const rMetaDoubleQuote = /"?([^"]+)?"?/;
const rMetaSingleQuote = /'?([^']+)?'?/;
module.exports = (ctx) => {
    return function imgTag(args) {
        const classes = [];
        let src, width, height, title, alt;
        // Find image URL and class name
        while (args.length > 0) {
            const item = args.shift();
            if (rUrl.test(item) || item.startsWith('/')) {
                src = hexo_util_1.url_for.call(ctx, item);
                break;
            }
            else {
                classes.push(item);
            }
        }
        // Find image width and height
        if (args && args.length) {
            if (!/\D+/.test(args[0])) {
                width = args.shift();
                if (args.length && !/\D+/.test(args[0])) {
                    height = args.shift();
                }
            }
            const meta = args.join(' ');
            const rMetaTitle = meta.startsWith('"') ? rMetaDoubleQuote : rMetaSingleQuote;
            const rMetaAlt = meta.endsWith('"') ? rMetaDoubleQuote : rMetaSingleQuote;
            const match = new RegExp(`${rMetaTitle.source}\\s*${rMetaAlt.source}`).exec(meta);
            // Find image title and alt
            if (match != null) {
                title = match[1];
                alt = match[2];
            }
        }
        const attrs = {
            src,
            class: classes.join(' '),
            width,
            height,
            title,
            alt
        };
        return (0, hexo_util_1.htmlTag)('img', attrs);
    };
};
//# sourceMappingURL=img.js.map
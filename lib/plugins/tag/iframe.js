"use strict";
const hexo_util_1 = require("hexo-util");
/**
* Iframe tag
*
* Syntax:
*   {% iframe url [width] [height] %}
*/
function iframeTag(args) {
    const src = args[0];
    const width = args[1] && args[1] !== 'default' ? args[1] : '100%';
    const height = args[2] && args[2] !== 'default' ? args[2] : '300';
    const attrs = {
        src,
        width,
        height,
        frameborder: '0',
        loading: 'lazy',
        allowfullscreen: true
    };
    return (0, hexo_util_1.htmlTag)('iframe', attrs, '');
}
module.exports = iframeTag;
//# sourceMappingURL=iframe.js.map
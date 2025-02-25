"use strict";
module.exports = (ctx) => {
    const { renderer } = ctx.extend;
    const plain = require('./plain');
    renderer.register('htm', 'html', plain, true);
    renderer.register('html', 'html', plain, true);
    renderer.register('css', 'css', plain, true);
    renderer.register('js', 'js', plain, true);
    renderer.register('json', 'json', require('./json'), true);
    const yaml = require('./yaml');
    renderer.register('yml', 'json', yaml, true);
    renderer.register('yaml', 'json', yaml, true);
    const nunjucks = require('./nunjucks');
    renderer.register('njk', 'html', nunjucks, true);
    renderer.register('j2', 'html', nunjucks, true);
};
//# sourceMappingURL=index.js.map
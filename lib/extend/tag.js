"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const hexo_util_1 = require("hexo-util");
const picocolors_1 = require("picocolors");
const nunjucks_1 = require("nunjucks");
const bluebird_1 = __importDefault(require("bluebird"));
const rSwigRawFullBlock = /{% *raw *%}/;
const rCodeTag = /<code[^<>]*>[\s\S]+?<\/code>/g;
const escapeSwigTag = (str) => str.replace(/{/g, '&#123;').replace(/}/g, '&#125;');
class NunjucksTag {
    constructor(name, fn) {
        this.tags = [name];
        this.fn = fn;
    }
    parse(parser, nodes, lexer) {
        const node = this._parseArgs(parser, nodes, lexer);
        return new nodes.CallExtension(this, 'run', node, []);
    }
    _parseArgs(parser, nodes, lexer) {
        const tag = parser.nextToken();
        const node = new nodes.NodeList(tag.lineno, tag.colno);
        const argarray = new nodes.Array(tag.lineno, tag.colno);
        let token;
        let argitem = '';
        while ((token = parser.nextToken(true))) {
            if (token.type === lexer.TOKEN_WHITESPACE || token.type === lexer.TOKEN_BLOCK_END) {
                if (argitem !== '') {
                    const argnode = new nodes.Literal(tag.lineno, tag.colno, argitem.trim());
                    argarray.addChild(argnode);
                    argitem = '';
                }
                if (token.type === lexer.TOKEN_BLOCK_END) {
                    break;
                }
            }
            else {
                argitem += token.value;
            }
        }
        node.addChild(argarray);
        return node;
    }
    run(context, args, body, callback) {
        return this._run(context, args, '');
    }
    _run(context, args, body) {
        return Reflect.apply(this.fn, context.ctx, [args, body]);
    }
}
const trimBody = (body) => {
    return (0, hexo_util_1.stripIndent)(body()).replace(/^\n?|\n?$/g, '');
};
class NunjucksBlock extends NunjucksTag {
    parse(parser, nodes, lexer) {
        const node = this._parseArgs(parser, nodes, lexer);
        const body = this._parseBody(parser, nodes, lexer);
        return new nodes.CallExtension(this, 'run', node, [body]);
    }
    _parseBody(parser, nodes, lexer) {
        const body = parser.parseUntilBlocks(`end${this.tags[0]}`);
        parser.advanceAfterBlockEnd();
        return body;
    }
    run(context, args, body, callback) {
        return this._run(context, args, trimBody(body));
    }
}
class NunjucksAsyncTag extends NunjucksTag {
    parse(parser, nodes, lexer) {
        const node = this._parseArgs(parser, nodes, lexer);
        return new nodes.CallExtensionAsync(this, 'run', node, []);
    }
    run(context, args, callback) {
        return this._run(context, args, '').then(result => {
            callback(null, result);
        }, callback);
    }
}
class NunjucksAsyncBlock extends NunjucksBlock {
    parse(parser, nodes, lexer) {
        const node = this._parseArgs(parser, nodes, lexer);
        const body = this._parseBody(parser, nodes, lexer);
        return new nodes.CallExtensionAsync(this, 'run', node, [body]);
    }
    run(context, args, body, callback) {
        // enable async tag nesting
        body((err, result) => {
            // wrapper for trimBody expecting
            // body to be a function
            body = () => result || '';
            this._run(context, args, trimBody(body)).then(result => {
                callback(err, result);
            });
        });
    }
}
const getContextLineNums = (min, max, center, amplitude) => {
    const result = [];
    let lbound = Math.max(min, center - amplitude);
    const hbound = Math.min(max, center + amplitude);
    while (lbound <= hbound)
        result.push(lbound++);
    return result;
};
const LINES_OF_CONTEXT = 5;
const getContext = (lines, errLine, location, type) => {
    const message = [
        location + ' ' + (0, picocolors_1.red)(type),
        (0, picocolors_1.cyan)('    =====               Context Dump               ====='),
        (0, picocolors_1.cyan)('    === (line number probably different from source) ===')
    ];
    message.push(
    // get LINES_OF_CONTEXT lines surrounding `errLine`
    ...getContextLineNums(1, lines.length, errLine, LINES_OF_CONTEXT)
        .map(lnNum => {
        const line = '  ' + lnNum + ' | ' + lines[lnNum - 1];
        if (lnNum === errLine) {
            return (0, picocolors_1.cyan)((0, picocolors_1.bold)(line));
        }
        return (0, picocolors_1.cyan)(line);
    }));
    message.push((0, picocolors_1.cyan)('    =====             Context Dump Ends            ====='));
    return message;
};
class NunjucksError extends Error {
}
/**
 * Provide context for Nunjucks error
 * @param  {Error}    err Nunjucks error
 * @param  {string}   str string input for Nunjucks
 * @return {Error}    New error object with embedded context
 */
const formatNunjucksError = (err, input, source = '') => {
    err.message = err.message.replace('(unknown path)', source ? (0, picocolors_1.magenta)(source) : '');
    const match = err.message.match(/Line (\d+), Column \d+/);
    if (!match)
        return err;
    const errLine = parseInt(match[1], 10);
    if (isNaN(errLine))
        return err;
    // trim useless info from Nunjucks Error
    const splitted = err.message.split('\n');
    const e = new NunjucksError();
    e.name = 'Nunjucks Error';
    e.line = errLine;
    e.location = splitted[0];
    e.type = splitted[1].trim();
    e.message = getContext(input.split(/\r?\n/), errLine, e.location, e.type).join('\n');
    return e;
};
class Tag {
    constructor() {
        this.env = new nunjucks_1.Environment(null, {
            autoescape: false
        });
    }
    register(name, fn, options) {
        if (!name)
            throw new TypeError('name is required');
        if (typeof fn !== 'function')
            throw new TypeError('fn must be a function');
        if (options == null || typeof options === 'boolean') {
            options = { ends: options };
        }
        let tag;
        if (options.async) {
            let asyncFn;
            if (fn.length > 2) {
                asyncFn = bluebird_1.default.promisify(fn);
            }
            else {
                asyncFn = bluebird_1.default.method(fn);
            }
            if (options.ends) {
                tag = new NunjucksAsyncBlock(name, asyncFn);
            }
            else {
                tag = new NunjucksAsyncTag(name, asyncFn);
            }
        }
        else if (options.ends) {
            tag = new NunjucksBlock(name, fn);
        }
        else {
            tag = new NunjucksTag(name, fn);
        }
        this.env.addExtension(name, tag);
    }
    unregister(name) {
        if (!name)
            throw new TypeError('name is required');
        const { env } = this;
        if (env.hasExtension(name))
            env.removeExtension(name);
    }
    render(str, options = {}, callback) {
        if (!callback && typeof options === 'function') {
            callback = options;
            options = {};
        }
        // Get path of post from source
        const { source = '' } = options;
        return bluebird_1.default.fromCallback(cb => {
            this.env.renderString(str.replace(rCodeTag, s => {
                // https://hexo.io/docs/tag-plugins#Raw
                // https://mozilla.github.io/nunjucks/templating.html#raw
                // Only escape code block when there is no raw tag included
                return s.match(rSwigRawFullBlock) ? s : escapeSwigTag(s);
            }), options, cb);
        }).catch(err => {
            return bluebird_1.default.reject(formatNunjucksError(err, str, source));
        })
            .asCallback(callback);
    }
}
module.exports = Tag;
//# sourceMappingURL=tag.js.map
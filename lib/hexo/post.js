"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const assert_1 = __importDefault(require("assert"));
const moment_1 = __importDefault(require("moment"));
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = require("path");
const picocolors_1 = require("picocolors");
const js_yaml_1 = require("js-yaml");
const hexo_util_1 = require("hexo-util");
const hexo_fs_1 = require("hexo-fs");
const hexo_front_matter_1 = require("hexo-front-matter");
const preservedKeys = ['title', 'slug', 'path', 'layout', 'date', 'content'];
const rHexoPostRenderEscape = /<hexoPostRenderCodeBlock>([\s\S]+?)<\/hexoPostRenderCodeBlock>/g;
const rSwigPlaceHolder = /(?:<|&lt;)!--swig\uFFFC(\d+)--(?:>|&gt;)/g;
const rCodeBlockPlaceHolder = /(?:<|&lt;)!--code\uFFFC(\d+)--(?:>|&gt;)/g;
const STATE_PLAINTEXT = Symbol('plaintext');
const STATE_SWIG_VAR = Symbol('swig_var');
const STATE_SWIG_COMMENT = Symbol('swig_comment');
const STATE_SWIG_TAG = Symbol('swig_tag');
const STATE_SWIG_FULL_TAG = Symbol('swig_full_tag');
const isNonWhiteSpaceChar = (char) => char !== '\r'
    && char !== '\n'
    && char !== '\t'
    && char !== '\f'
    && char !== '\v'
    && char !== ' ';
class PostRenderEscape {
    constructor() {
        this.stored = [];
    }
    static escapeContent(cache, flag, str) {
        return `<!--${flag}\uFFFC${cache.push(str) - 1}-->`;
    }
    static restoreContent(cache) {
        return (_, index) => {
            (0, assert_1.default)(cache[index]);
            const value = cache[index];
            cache[index] = null;
            return value;
        };
    }
    restoreAllSwigTags(str) {
        const restored = str.replace(rSwigPlaceHolder, PostRenderEscape.restoreContent(this.stored));
        return restored;
    }
    restoreCodeBlocks(str) {
        return str.replace(rCodeBlockPlaceHolder, PostRenderEscape.restoreContent(this.stored));
    }
    escapeCodeBlocks(str) {
        return str.replace(rHexoPostRenderEscape, (_, content) => PostRenderEscape.escapeContent(this.stored, 'code', content));
    }
    /**
     * @param {string} str
     * @returns string
     */
    escapeAllSwigTags(str) {
        if (!/(\{\{.+?\}\})|(\{#.+?#\})|(\{%.+?%\})/s.test(str)) {
            return str;
        }
        let state = STATE_PLAINTEXT;
        let buffer = '';
        let output = '';
        let swig_tag_name_begin = false;
        let swig_tag_name_end = false;
        let swig_tag_name = '';
        let swig_full_tag_start_buffer = '';
        const { length } = str;
        for (let idx = 0; idx < length; idx++) {
            const char = str[idx];
            const next_char = str[idx + 1];
            if (state === STATE_PLAINTEXT) { // From plain text to swig
                if (char === '{') {
                    // check if it is a complete tag {{ }}
                    if (next_char === '{') {
                        state = STATE_SWIG_VAR;
                        idx++;
                    }
                    else if (next_char === '#') {
                        state = STATE_SWIG_COMMENT;
                        idx++;
                    }
                    else if (next_char === '%') {
                        state = STATE_SWIG_TAG;
                        idx++;
                        swig_tag_name = '';
                        swig_full_tag_start_buffer = '';
                        swig_tag_name_begin = false; // Mark if it is the first non white space char in the swig tag
                        swig_tag_name_end = false;
                    }
                    else {
                        output += char;
                    }
                }
                else {
                    output += char;
                }
            }
            else if (state === STATE_SWIG_TAG) {
                if (char === '%' && next_char === '}') { // From swig back to plain text
                    idx++;
                    if (swig_tag_name !== '' && str.includes(`end${swig_tag_name}`)) {
                        state = STATE_SWIG_FULL_TAG;
                    }
                    else {
                        swig_tag_name = '';
                        state = STATE_PLAINTEXT;
                        output += PostRenderEscape.escapeContent(this.stored, 'swig', `{%${buffer}%}`);
                    }
                    buffer = '';
                }
                else {
                    buffer = buffer + char;
                    swig_full_tag_start_buffer = swig_full_tag_start_buffer + char;
                    if (isNonWhiteSpaceChar(char)) {
                        if (!swig_tag_name_begin && !swig_tag_name_end) {
                            swig_tag_name_begin = true;
                        }
                        if (swig_tag_name_begin) {
                            swig_tag_name += char;
                        }
                    }
                    else {
                        if (swig_tag_name_begin === true) {
                            swig_tag_name_begin = false;
                            swig_tag_name_end = true;
                        }
                    }
                }
            }
            else if (state === STATE_SWIG_VAR) {
                if (char === '}' && next_char === '}') {
                    idx++;
                    state = STATE_PLAINTEXT;
                    output += PostRenderEscape.escapeContent(this.stored, 'swig', `{{${buffer}}}`);
                    buffer = '';
                }
                else {
                    buffer = buffer + char;
                }
            }
            else if (state === STATE_SWIG_COMMENT) { // From swig back to plain text
                if (char === '#' && next_char === '}') {
                    idx++;
                    state = STATE_PLAINTEXT;
                    buffer = '';
                }
            }
            else if (state === STATE_SWIG_FULL_TAG) {
                if (char === '{' && next_char === '%') {
                    let swig_full_tag_end_buffer = '';
                    let _idx = idx + 2;
                    for (; _idx < length; _idx++) {
                        const _char = str[_idx];
                        const _next_char = str[_idx + 1];
                        if (_char === '%' && _next_char === '}') {
                            _idx++;
                            break;
                        }
                        swig_full_tag_end_buffer = swig_full_tag_end_buffer + _char;
                    }
                    if (swig_full_tag_end_buffer.includes(`end${swig_tag_name}`)) {
                        state = STATE_PLAINTEXT;
                        output += PostRenderEscape.escapeContent(this.stored, 'swig', `{%${swig_full_tag_start_buffer}%}${buffer}{%${swig_full_tag_end_buffer}%}`);
                        idx = _idx;
                        swig_full_tag_start_buffer = '';
                        swig_full_tag_end_buffer = '';
                        buffer = '';
                    }
                    else {
                        buffer += char;
                    }
                }
                else {
                    buffer += char;
                }
            }
        }
        return output;
    }
}
const prepareFrontMatter = (data, jsonMode) => {
    for (const [key, item] of Object.entries(data)) {
        if (moment_1.default.isMoment(item)) {
            data[key] = item.utc().format('YYYY-MM-DD HH:mm:ss');
        }
        else if (moment_1.default.isDate(item)) {
            data[key] = moment_1.default.utc(item).format('YYYY-MM-DD HH:mm:ss');
        }
        else if (typeof item === 'string') {
            if (jsonMode || item.includes(':') || item.startsWith('#') || item.startsWith('!!')
                || item.includes('{') || item.includes('}') || item.includes('[') || item.includes(']')
                || item.includes('\'') || item.includes('"'))
                data[key] = `"${item.replace(/"/g, '\\"')}"`;
        }
    }
    return data;
};
const removeExtname = (str) => {
    return str.substring(0, str.length - (0, path_1.extname)(str).length);
};
const createAssetFolder = (path, assetFolder) => {
    if (!assetFolder)
        return bluebird_1.default.resolve();
    const target = removeExtname(path);
    if ((0, path_1.basename)(target) === 'index')
        return bluebird_1.default.resolve();
    return (0, hexo_fs_1.exists)(target).then(exist => {
        if (!exist)
            return (0, hexo_fs_1.mkdirs)(target);
    });
};
class Post {
    constructor(context) {
        this.context = context;
    }
    create(data, replace, callback) {
        if (!callback && typeof replace === 'function') {
            callback = replace;
            replace = false;
        }
        const ctx = this.context;
        const { config } = ctx;
        data.slug = (0, hexo_util_1.slugize)((data.slug || data.title).toString(), { transform: config.filename_case });
        data.layout = (data.layout || config.default_layout).toLowerCase();
        data.date = data.date ? (0, moment_1.default)(data.date) : (0, moment_1.default)();
        return bluebird_1.default.all([
            // Get the post path
            ctx.execFilter('new_post_path', data, {
                args: [replace],
                context: ctx
            }),
            this._renderScaffold(data)
        ]).spread((path, content) => {
            const result = { path, content };
            return bluebird_1.default.all([
                // Write content to file
                (0, hexo_fs_1.writeFile)(path, content),
                // Create asset folder
                createAssetFolder(path, config.post_asset_folder)
            ]).then(() => {
                ctx.emit('new', result);
                return result;
            });
        }).asCallback(callback);
    }
    _getScaffold(layout) {
        const ctx = this.context;
        return ctx.scaffold.get(layout).then(result => {
            if (result != null)
                return result;
            return ctx.scaffold.get('normal');
        });
    }
    _renderScaffold(data) {
        const { tag } = this.context.extend;
        let splitted;
        return this._getScaffold(data.layout).then(scaffold => {
            splitted = (0, hexo_front_matter_1.split)(scaffold);
            const jsonMode = splitted.separator.startsWith(';');
            const frontMatter = prepareFrontMatter({ ...data }, jsonMode);
            return tag.render(splitted.data, frontMatter);
        }).then(frontMatter => {
            const { separator } = splitted;
            const jsonMode = separator.startsWith(';');
            // Parse front-matter
            let obj = jsonMode ? JSON.parse(`{${frontMatter}}`) : (0, js_yaml_1.load)(frontMatter);
            obj = (0, hexo_util_1.deepMerge)(obj, Object.fromEntries(Object.entries(data).filter(([key, value]) => !preservedKeys.includes(key) && value != null)));
            let content = '';
            // Prepend the separator
            if (splitted.prefixSeparator)
                content += `${separator}\n`;
            content += (0, hexo_front_matter_1.stringify)(obj, {
                mode: jsonMode ? 'json' : ''
            });
            // Concat content
            content += splitted.content;
            if (data.content) {
                content += `\n${data.content}`;
            }
            return content;
        });
    }
    publish(data, replace, callback) {
        if (!callback && typeof replace === 'function') {
            callback = replace;
            replace = false;
        }
        if (data.layout === 'draft')
            data.layout = 'post';
        const ctx = this.context;
        const { config } = ctx;
        const draftDir = (0, path_1.join)(ctx.source_dir, '_drafts');
        const slug = (0, hexo_util_1.slugize)(data.slug.toString(), { transform: config.filename_case });
        data.slug = slug;
        const regex = new RegExp(`^${(0, hexo_util_1.escapeRegExp)(slug)}(?:[^\\/\\\\]+)`);
        let src = '';
        const result = {};
        data.layout = (data.layout || config.default_layout).toLowerCase();
        // Find the draft
        return (0, hexo_fs_1.listDir)(draftDir).then(list => {
            const item = list.find(item => regex.test(item));
            if (!item)
                throw new Error(`Draft "${slug}" does not exist.`);
            // Read the content
            src = (0, path_1.join)(draftDir, item);
            return (0, hexo_fs_1.readFile)(src);
        }).then(content => {
            // Create post
            Object.assign(data, (0, hexo_front_matter_1.parse)(content));
            data.content = data._content;
            data._content = undefined;
            return this.create(data, replace);
        }).then(post => {
            result.path = post.path;
            result.content = post.content;
            return (0, hexo_fs_1.unlink)(src);
        }).then(() => {
            if (!config.post_asset_folder)
                return;
            // Copy assets
            const assetSrc = removeExtname(src);
            const assetDest = removeExtname(result.path);
            return (0, hexo_fs_1.exists)(assetSrc).then(exist => {
                if (!exist)
                    return;
                return (0, hexo_fs_1.copyDir)(assetSrc, assetDest).then(() => (0, hexo_fs_1.rmdir)(assetSrc));
            });
        }).thenReturn(result).asCallback(callback);
    }
    render(source, data = {}, callback) {
        const ctx = this.context;
        const { config } = ctx;
        const { tag } = ctx.extend;
        const ext = data.engine || (source ? (0, path_1.extname)(source) : '');
        let promise;
        if (data.content != null) {
            promise = bluebird_1.default.resolve(data.content);
        }
        else if (source) {
            // Read content from files
            promise = (0, hexo_fs_1.readFile)(source);
        }
        else {
            return bluebird_1.default.reject(new Error('No input file or string!')).asCallback(callback);
        }
        // Files like js and css are also processed by this function, but they do not require preprocessing like markdown
        // data.source does not exist when tag plugins call the markdown renderer
        const isPost = !data.source || ['html', 'htm'].includes(ctx.render.getOutput(data.source));
        if (!isPost) {
            return promise.then(content => {
                data.content = content;
                ctx.log.debug('Rendering file: %s', (0, picocolors_1.magenta)(source));
                return ctx.render.render({
                    text: data.content,
                    path: source,
                    engine: data.engine,
                    toString: true
                });
            }).then(content => {
                data.content = content;
                return data;
            }).asCallback(callback);
        }
        // disable Nunjucks when the renderer specify that.
        let disableNunjucks = ext && ctx.render.renderer.get(ext) && !!ctx.render.renderer.get(ext).disableNunjucks;
        // front-matter overrides renderer's option
        if (typeof data.disableNunjucks === 'boolean')
            disableNunjucks = data.disableNunjucks;
        const cacheObj = new PostRenderEscape();
        return promise.then(content => {
            data.content = content;
            // Run "before_post_render" filters
            return ctx.execFilter('before_post_render', data, { context: ctx });
        }).then(() => {
            data.content = cacheObj.escapeCodeBlocks(data.content);
            // Escape all Nunjucks/Swig tags
            if (disableNunjucks === false) {
                data.content = cacheObj.escapeAllSwigTags(data.content);
            }
            const options = data.markdown || {};
            if (!config.syntax_highlighter)
                options.highlight = null;
            ctx.log.debug('Rendering post: %s', (0, picocolors_1.magenta)(source));
            // Render with markdown or other renderer
            return ctx.render.render({
                text: data.content,
                path: source,
                engine: data.engine,
                toString: true,
                onRenderEnd(content) {
                    // Replace cache data with real contents
                    data.content = cacheObj.restoreAllSwigTags(content);
                    // Return content after replace the placeholders
                    if (disableNunjucks)
                        return data.content;
                    // Render with Nunjucks
                    return tag.render(data.content, data);
                }
            }, options);
        }).then(content => {
            data.content = cacheObj.restoreCodeBlocks(content);
            // Run "after_post_render" filters
            return ctx.execFilter('after_post_render', data, { context: ctx });
        }).asCallback(callback);
    }
}
module.exports = Post;
//# sourceMappingURL=post.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postFindOneFactory = postFindOneFactory;
const moize_1 = __importDefault(require("moize"));
exports.default = (ctx) => {
    const { tag } = ctx.extend;
    const blockquote = require('./blockquote')(ctx);
    tag.register('quote', blockquote, true);
    tag.register('blockquote', blockquote, true);
    const code = require('./code')(ctx);
    tag.register('code', code, true);
    tag.register('codeblock', code, true);
    tag.register('iframe', require('./iframe'));
    const img = require('./img')(ctx);
    tag.register('img', img);
    tag.register('image', img);
    const includeCode = require('./include_code')(ctx);
    tag.register('include_code', includeCode, { async: true });
    tag.register('include-code', includeCode, { async: true });
    const link = require('./link');
    tag.register('a', link);
    tag.register('link', link);
    tag.register('anchor', link);
    tag.register('post_path', require('./post_path')(ctx));
    tag.register('post_link', require('./post_link')(ctx));
    tag.register('asset_path', require('./asset_path')(ctx));
    tag.register('asset_link', require('./asset_link')(ctx));
    const assetImg = require('./asset_img')(ctx);
    tag.register('asset_img', assetImg);
    tag.register('asset_image', assetImg);
    tag.register('pullquote', require('./pullquote')(ctx), true);
    tag.register('url_for', require('./url_for')(ctx));
    tag.register('full_url_for', require('./full_url_for')(ctx));
};
// Use WeakMap to track different ctx (in case there is any)
const moized = new WeakMap();
function postFindOneFactory(ctx) {
    if (moized.has(ctx)) {
        return moized.get(ctx);
    }
    const moizedPostFindOne = (0, moize_1.default)(createPostFindOne(ctx), {
        isDeepEqual: true,
        maxSize: 20
    });
    moized.set(ctx, moizedPostFindOne);
    return moizedPostFindOne;
}
function createPostFindOne(ctx) {
    const Post = ctx.model('Post');
    return Post.findOne.bind(Post);
}
//# sourceMappingURL=index.js.map
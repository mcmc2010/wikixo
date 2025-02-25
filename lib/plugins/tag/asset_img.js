"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const img_1 = __importDefault(require("./img"));
const hexo_util_1 = require("hexo-util");
module.exports = (ctx) => {
    const PostAsset = ctx.model('PostAsset');
    return function assetImgTag(args) {
        const len = args.length;
        // Find image URL
        for (let i = 0; i < len; i++) {
            const asset = PostAsset.findOne({ post: this._id, slug: args[i] });
            if (asset) {
                // img tag will call url_for so no need to call it here
                args[i] = (0, hexo_util_1.encodeURL)(new URL(asset.path, ctx.config.url).pathname);
                return (0, img_1.default)(ctx)(args);
            }
        }
    };
};
//# sourceMappingURL=asset_img.js.map
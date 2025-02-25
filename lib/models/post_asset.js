"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const warehouse_1 = __importDefault(require("warehouse"));
const path_1 = require("path");
module.exports = (ctx) => {
    const PostAsset = new warehouse_1.default.Schema({
        _id: { type: String, required: true },
        slug: { type: String, required: true },
        modified: { type: Boolean, default: true },
        post: { type: warehouse_1.default.Schema.Types.CUID, ref: 'Post' },
        renderable: { type: Boolean, default: true }
    });
    PostAsset.virtual('path').get(function () {
        const Post = ctx.model('Post');
        const post = Post.findById(this.post);
        if (!post)
            return;
        // PostAsset.path is file path relative to `public_dir`
        // no need to urlescape, #1562
        // strip /\.html?$/ extensions on permalink, #2134
        // Use path.posix.join to avoid path.join introducing unwanted backslashes on Windows.
        return path_1.posix.join(post.path.replace(/\.html?$/, ''), this.slug);
    });
    PostAsset.virtual('source').get(function () {
        return (0, path_1.join)(ctx.base_dir, this._id);
    });
    return PostAsset;
};
//# sourceMappingURL=post_asset.js.map
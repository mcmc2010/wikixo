"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const warehouse_1 = __importDefault(require("warehouse"));
const hexo_util_1 = require("hexo-util");
const { hasOwnProperty: hasOwn } = Object.prototype;
module.exports = (ctx) => {
    const Tag = new warehouse_1.default.Schema({
        name: { type: String, required: true }
    });
    Tag.virtual('slug').get(function () {
        const map = ctx.config.tag_map || {};
        let name = this.name;
        if (!name)
            return;
        if (Reflect.apply(hasOwn, map, [name])) {
            name = map[name] || name;
        }
        return (0, hexo_util_1.slugize)(name, { transform: ctx.config.filename_case });
    });
    Tag.virtual('path').get(function () {
        let tagDir = ctx.config.tag_dir;
        if (!tagDir.endsWith('/'))
            tagDir += '/';
        return `${tagDir + this.slug}/`;
    });
    Tag.virtual('permalink').get(function () {
        return hexo_util_1.full_url_for.call(ctx, this.path);
    });
    Tag.virtual('posts').get(function () {
        const PostTag = ctx.model('PostTag');
        const ids = PostTag.find({ tag_id: this._id }).map(item => item.post_id);
        return ctx.locals.get('posts').find({
            _id: { $in: ids }
        });
    });
    Tag.virtual('length').get(function () {
        // Note: this.posts.length is also working
        // But it's slow because `find` has to iterate over all posts
        const PostTag = ctx.model('PostTag');
        return PostTag.find({ tag_id: this._id }).length;
    });
    // Check whether a tag exists
    Tag.pre('save', data => {
        const { name } = data;
        if (!name)
            return;
        const Tag = ctx.model('Tag');
        const tag = Tag.findOne({ name }, { lean: true });
        if (tag) {
            throw new Error(`Tag \`${name}\` has already existed!`);
        }
    });
    // Remove PostTag references
    Tag.pre('remove', data => {
        const PostTag = ctx.model('PostTag');
        return PostTag.remove({ tag_id: data._id });
    });
    return Tag;
};
//# sourceMappingURL=tag.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const common_1 = require("./common");
const bluebird_1 = __importDefault(require("bluebird"));
const hexo_front_matter_1 = require("hexo-front-matter");
const path_1 = require("path");
const hexo_fs_1 = require("hexo-fs");
const hexo_util_1 = require("hexo-util");
const picocolors_1 = require("picocolors");
const postDir = '_posts/';
const draftDir = '_drafts/';
let permalink;
const preservedKeys = {
    title: true,
    year: true,
    month: true,
    day: true,
    i_month: true,
    i_day: true,
    hash: true
};
function processPost(ctx, file) {
    const Post = ctx.model('Post');
    const { path } = file.params;
    const doc = Post.findOne({ source: file.path });
    const { config } = ctx;
    const { timezone: timezoneCfg, updated_option, use_slug_as_post_title } = config;
    let categories, tags;
    if (file.type === 'skip' && doc) {
        return;
    }
    if (file.type === 'delete') {
        if (doc) {
            return doc.remove();
        }
        return;
    }
    return bluebird_1.default.all([
        file.stat(),
        file.read()
    ]).spread((stats, content) => {
        const data = (0, hexo_front_matter_1.parse)(content);
        const info = parseFilename(config.new_post_name, path);
        const keys = Object.keys(info);
        data.source = file.path;
        data.raw = content;
        data.slug = info.title;
        if (file.params.published) {
            if (!Object.prototype.hasOwnProperty.call(data, 'published'))
                data.published = true;
        }
        else {
            data.published = false;
        }
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            if (!preservedKeys[key])
                data[key] = info[key];
        }
        // use `slug` as `title` of post when `title` is not specified.
        // https://github.com/hexojs/hexo/issues/5372
        if (use_slug_as_post_title && !('title' in data)) {
            data.title = info.title;
        }
        if (data.date) {
            data.date = (0, common_1.toDate)(data.date);
        }
        else if (info && info.year && (info.month || info.i_month) && (info.day || info.i_day)) {
            data.date = new Date(info.year, parseInt(info.month || info.i_month, 10) - 1, parseInt(info.day || info.i_day, 10));
        }
        if (data.date) {
            if (timezoneCfg)
                data.date = (0, common_1.timezone)(data.date, timezoneCfg);
        }
        else {
            data.date = stats.birthtime;
        }
        data.updated = (0, common_1.toDate)(data.updated);
        if (data.updated) {
            if (timezoneCfg)
                data.updated = (0, common_1.timezone)(data.updated, timezoneCfg);
        }
        else if (updated_option === 'date') {
            data.updated = data.date;
        }
        else if (updated_option === 'empty') {
            data.updated = undefined;
        }
        else {
            data.updated = stats.mtime;
        }
        if (data.category && !data.categories) {
            data.categories = data.category;
            data.category = undefined;
        }
        if (data.tag && !data.tags) {
            data.tags = data.tag;
            data.tag = undefined;
        }
        categories = data.categories || [];
        tags = data.tags || [];
        if (!Array.isArray(categories))
            categories = [categories];
        if (!Array.isArray(tags))
            tags = [tags];
        if (data.photo && !data.photos) {
            data.photos = data.photo;
            data.photo = undefined;
        }
        if (data.photos && !Array.isArray(data.photos)) {
            data.photos = [data.photos];
        }
        if (data.permalink) {
            data.__permalink = data.permalink;
            data.permalink = undefined;
        }
        if (doc) {
            if (file.type !== 'update') {
                ctx.log.warn(`Trying to "create" ${(0, picocolors_1.magenta)(file.path)}, but the file already exists!`);
            }
            return doc.replace(data);
        }
        return Post.insert(data);
    }).then(doc => bluebird_1.default.all([
        doc.setCategories(categories),
        doc.setTags(tags),
        scanAssetDir(ctx, doc)
    ]));
}
function parseFilename(config, path) {
    config = config.substring(0, config.length - (0, path_1.extname)(config).length);
    path = path.substring(0, path.length - (0, path_1.extname)(path).length);
    if (!permalink || permalink.rule !== config) {
        permalink = new hexo_util_1.Permalink(config, {
            segments: {
                year: /(\d{4})/,
                month: /(\d{2})/,
                day: /(\d{2})/,
                i_month: /(\d{1,2})/,
                i_day: /(\d{1,2})/,
                hash: /([0-9a-f]{12})/
            }
        });
    }
    const data = permalink.parse(path);
    if (data) {
        if (data.title !== undefined) {
            return data;
        }
        return Object.assign(data, {
            title: (0, hexo_util_1.slugize)(path)
        });
    }
    return {
        title: (0, hexo_util_1.slugize)(path)
    };
}
function scanAssetDir(ctx, post) {
    if (!ctx.config.post_asset_folder)
        return;
    const assetDir = post.asset_dir;
    const baseDir = ctx.base_dir;
    const sourceDir = ctx.config.source_dir;
    const baseDirLength = baseDir.length;
    const sourceDirLength = sourceDir.length;
    const PostAsset = ctx.model('PostAsset');
    return (0, hexo_fs_1.stat)(assetDir).then(stats => {
        if (!stats.isDirectory())
            return [];
        return (0, hexo_fs_1.listDir)(assetDir);
    }).catch(err => {
        if (err && err.code === 'ENOENT')
            return [];
        throw err;
    }).filter(item => !(0, common_1.isExcludedFile)(item, ctx.config)).map(item => {
        const id = (0, path_1.join)(assetDir, item).substring(baseDirLength).replace(/\\/g, '/');
        const renderablePath = id.substring(sourceDirLength + 1);
        const asset = PostAsset.findById(id);
        if (shouldSkipAsset(ctx, post, asset))
            return undefined;
        return PostAsset.save({
            _id: id,
            post: post._id,
            slug: item,
            modified: true,
            renderable: ctx.render.isRenderable(renderablePath) && !(0, common_1.isMatch)(renderablePath, ctx.config.skip_render)
        });
    });
}
function shouldSkipAsset(ctx, post, asset) {
    if (!ctx._showDrafts()) {
        if (post.published === false && asset) {
            // delete existing draft assets if draft posts are hidden
            asset.remove();
        }
        if (post.published === false) {
            // skip draft assets if draft posts are hidden
            return true;
        }
    }
    return asset !== undefined; // skip already existing assets
}
function processAsset(ctx, file) {
    const PostAsset = ctx.model('PostAsset');
    const Post = ctx.model('Post');
    const id = file.source.substring(ctx.base_dir.length).replace(/\\/g, '/');
    const postAsset = PostAsset.findById(id);
    if (file.type === 'delete' || Post.length === 0) {
        if (postAsset) {
            return postAsset.remove();
        }
        return;
    }
    const savePostAsset = (post) => {
        return PostAsset.save({
            _id: id,
            slug: file.source.substring(post.asset_dir.length),
            post: post._id,
            modified: file.type !== 'skip',
            renderable: file.params.renderable
        });
    };
    if (postAsset) {
        // `postAsset.post` is `Post.id`.
        const post = Post.findById(postAsset.post);
        if (post != null && (post.published || ctx._showDrafts())) {
            return savePostAsset(post);
        }
    }
    const assetDir = id.slice(0, id.lastIndexOf(path_1.sep));
    const post = Post.findOne(p => p.asset_dir.endsWith(path_1.posix.join(assetDir, '/')));
    if (post != null && (post.published || ctx._showDrafts())) {
        return savePostAsset(post);
    }
    // NOTE: Probably, unreachable.
    if (postAsset) {
        return postAsset.remove();
    }
}
module.exports = (ctx) => {
    return {
        pattern: new hexo_util_1.Pattern(path => {
            if ((0, common_1.isTmpFile)(path))
                return;
            let result;
            if (path.startsWith(postDir)) {
                result = {
                    published: true,
                    path: path.substring(postDir.length)
                };
            }
            else if (path.startsWith(draftDir)) {
                result = {
                    published: false,
                    path: path.substring(draftDir.length)
                };
            }
            if (!result || (0, common_1.isHiddenFile)(result.path))
                return;
            // checks only if there is a renderer for the file type or if is included in skip_render
            result.renderable = ctx.render.isRenderable(path) && !(0, common_1.isMatch)(path, ctx.config.skip_render);
            // if post_asset_folder is set, restrict renderable files to default file extension
            if (result.renderable && ctx.config.post_asset_folder) {
                result.renderable = ((0, path_1.extname)(ctx.config.new_post_name) === (0, path_1.extname)(path));
            }
            return result;
        }),
        process: function postProcessor(file) {
            if (file.params.renderable) {
                return processPost(ctx, file);
            }
            else if (ctx.config.post_asset_folder) {
                return processAsset(ctx, file);
            }
        }
    };
};
//# sourceMappingURL=post.js.map
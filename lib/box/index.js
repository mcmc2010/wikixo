"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const bluebird_1 = __importDefault(require("bluebird"));
const file_1 = __importDefault(require("./file"));
const hexo_util_1 = require("hexo-util");
const hexo_fs_1 = require("hexo-fs");
const picocolors_1 = require("picocolors");
const events_1 = require("events");
const micromatch_1 = require("micromatch");
const defaultPattern = new hexo_util_1.Pattern(() => ({}));
class Box extends events_1.EventEmitter {
    constructor(ctx, base, options) {
        super();
        this.options = Object.assign({
            persistent: true,
            awaitWriteFinish: {
                stabilityThreshold: 200
            }
        }, options);
        if (!base.endsWith(path_1.sep)) {
            base += path_1.sep;
        }
        this.context = ctx;
        this.base = base;
        this.processors = [];
        this._processingFiles = {};
        this.watcher = null;
        this.Cache = ctx.model('Cache');
        this.File = this._createFileClass();
        let targets = this.options.ignored || [];
        if (ctx.config.ignore && ctx.config.ignore.length) {
            targets = targets.concat(ctx.config.ignore);
        }
        this.ignore = targets;
        this.options.ignored = targets.map(s => toRegExp(ctx, s)).filter(x => x);
    }
    _createFileClass() {
        const ctx = this.context;
        class _File extends file_1.default {
            render(options) {
                return ctx.render.render({
                    path: this.source
                }, options);
            }
            renderSync(options) {
                return ctx.render.renderSync({
                    path: this.source
                }, options);
            }
        }
        _File.prototype.box = this;
        return _File;
    }
    addProcessor(pattern, fn) {
        if (!fn && typeof pattern === 'function') {
            fn = pattern;
            pattern = defaultPattern;
        }
        if (typeof fn !== 'function')
            throw new TypeError('fn must be a function');
        if (!(pattern instanceof hexo_util_1.Pattern))
            pattern = new hexo_util_1.Pattern(pattern);
        this.processors.push({
            pattern,
            process: fn
        });
    }
    _readDir(base, prefix = '') {
        const { context: ctx } = this;
        const results = [];
        return readDirWalker(ctx, base, results, this.ignore, prefix)
            .return(results)
            .map(path => this._checkFileStatus(path))
            .map(file => this._processFile(file.type, file.path).return(file.path));
    }
    _checkFileStatus(path) {
        const { Cache, context: ctx } = this;
        const src = (0, path_1.join)(this.base, path);
        return Cache.compareFile(escapeBackslash(src.substring(ctx.base_dir.length)), () => getHash(src), () => (0, hexo_fs_1.stat)(src)).then(result => ({
            type: result.type,
            path
        }));
    }
    process(callback) {
        const { base, Cache, context: ctx } = this;
        return (0, hexo_fs_1.stat)(base).then(stats => {
            if (!stats.isDirectory())
                return;
            // Check existing files in cache
            const relativeBase = escapeBackslash(base.substring(ctx.base_dir.length));
            const cacheFiles = Cache.filter(item => item._id.startsWith(relativeBase)).map(item => item._id.substring(relativeBase.length));
            // Handle deleted files
            return this._readDir(base)
                .then((files) => cacheFiles.filter((path) => !files.includes(path)))
                .map((path) => this._processFile(file_1.default.TYPE_DELETE, path));
        }).catch(err => {
            if (err && err.code !== 'ENOENT')
                throw err;
        }).asCallback(callback);
    }
    _processFile(type, path) {
        if (this._processingFiles[path]) {
            return bluebird_1.default.resolve();
        }
        this._processingFiles[path] = true;
        const { base, File, context: ctx } = this;
        this.emit('processBefore', {
            type,
            path
        });
        return bluebird_1.default.reduce(this.processors, (count, processor) => {
            const params = processor.pattern.match(path);
            if (!params)
                return count;
            const file = new File({
                // source is used for filesystem path, keep backslashes on Windows
                source: (0, path_1.join)(base, path),
                // path is used for URL path, replace backslashes on Windows
                path: escapeBackslash(path),
                params,
                type
            });
            return Reflect.apply(bluebird_1.default.method(processor.process), ctx, [file])
                .thenReturn(count + 1);
        }, 0).then(count => {
            if (count) {
                ctx.log.debug('Processed: %s', (0, picocolors_1.magenta)(path));
            }
            this.emit('processAfter', {
                type,
                path
            });
        }).catch(err => {
            ctx.log.error({ err }, 'Process failed: %s', (0, picocolors_1.magenta)(path));
        }).finally(() => {
            this._processingFiles[path] = false;
        }).thenReturn(path);
    }
    watch(callback) {
        if (this.isWatching()) {
            return bluebird_1.default.reject(new Error('Watcher has already started.')).asCallback(callback);
        }
        const { base } = this;
        function getPath(path) {
            return escapeBackslash(path.substring(base.length));
        }
        return this.process().then(() => (0, hexo_fs_1.watch)(base, this.options)).then(watcher => {
            this.watcher = watcher;
            watcher.on('add', path => {
                this._processFile(file_1.default.TYPE_CREATE, getPath(path));
            });
            watcher.on('change', path => {
                this._processFile(file_1.default.TYPE_UPDATE, getPath(path));
            });
            watcher.on('unlink', path => {
                this._processFile(file_1.default.TYPE_DELETE, getPath(path));
            });
            watcher.on('addDir', path => {
                let prefix = getPath(path);
                if (prefix)
                    prefix += '/';
                this._readDir(path, prefix);
            });
        }).asCallback(callback);
    }
    unwatch() {
        if (!this.isWatching())
            return;
        this.watcher.close();
        this.watcher = null;
    }
    isWatching() {
        return Boolean(this.watcher);
    }
}
function escapeBackslash(path) {
    // Replace backslashes on Windows
    return path.replace(/\\/g, '/');
}
function getHash(path) {
    const src = (0, hexo_fs_1.createReadStream)(path);
    const hasher = (0, hexo_util_1.createSha1Hash)();
    const finishedPromise = new bluebird_1.default((resolve, reject) => {
        src.once('error', reject);
        src.once('end', resolve);
    });
    src.on('data', chunk => { hasher.update(chunk); });
    return finishedPromise.then(() => hasher.digest('hex'));
}
function toRegExp(ctx, arg) {
    if (!arg)
        return null;
    if (typeof arg !== 'string') {
        ctx.log.warn('A value of "ignore:" section in "_config.yml" is not invalid (not a string)');
        return null;
    }
    const result = (0, micromatch_1.makeRe)(arg);
    if (!result) {
        ctx.log.warn('A value of "ignore:" section in "_config.yml" can not be converted to RegExp:' + arg);
        return null;
    }
    return result;
}
function isIgnoreMatch(path, ignore) {
    return path && ignore && ignore.length && (0, micromatch_1.isMatch)(path, ignore);
}
function readDirWalker(ctx, base, results, ignore, prefix) {
    if (isIgnoreMatch(base, ignore))
        return bluebird_1.default.resolve();
    return bluebird_1.default.map((0, hexo_fs_1.readdir)(base).catch(err => {
        ctx.log.error({ err }, 'Failed to read directory: %s', base);
        if (err && err.code === 'ENOENT')
            return [];
        throw err;
    }), async (path) => {
        const fullpath = (0, path_1.join)(base, path);
        const stats = await (0, hexo_fs_1.stat)(fullpath).catch(err => {
            ctx.log.error({ err }, 'Failed to stat file: %s', fullpath);
            if (err && err.code === 'ENOENT')
                return null;
            throw err;
        });
        const prefixPath = `${prefix}${path}`;
        if (stats) {
            if (stats.isDirectory()) {
                return readDirWalker(ctx, fullpath, results, ignore, `${prefixPath}/`);
            }
            if (!isIgnoreMatch(fullpath, ignore)) {
                results.push(prefixPath);
            }
        }
    });
}
exports.default = Box;
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const hexo_fs_1 = require("hexo-fs");
const path_1 = require("path");
const bluebird_1 = __importDefault(require("bluebird"));
const pretty_hrtime_1 = __importDefault(require("pretty-hrtime"));
const picocolors_1 = require("picocolors");
const tildify_1 = __importDefault(require("tildify"));
const stream_1 = require("stream");
const hexo_util_1 = require("hexo-util");
class Generater {
    constructor(ctx, args) {
        this.context = ctx;
        this.force = args.f || args.force;
        this.bail = args.b || args.bail;
        this.concurrency = args.c || args.concurrency;
        this.watch = args.w || args.watch;
        this.deploy = args.d || args.deploy;
        this.generatingFiles = new Set();
        this.start = process.hrtime();
        this.args = args;
    }
    generateFile(path) {
        const publicDir = this.context.public_dir;
        const { generatingFiles } = this;
        const { route } = this.context;
        // Skip if the file is generating
        if (generatingFiles.has(path))
            return bluebird_1.default.resolve();
        // Lock the file
        generatingFiles.add(path);
        let promise;
        if (this.force) {
            promise = this.writeFile(path, true);
        }
        else {
            const dest = (0, path_1.join)(publicDir, path);
            promise = (0, hexo_fs_1.exists)(dest).then(exist => {
                if (!exist)
                    return this.writeFile(path, true);
                if (route.isModified(path))
                    return this.writeFile(path);
            });
        }
        return promise.finally(() => {
            // Unlock the file
            generatingFiles.delete(path);
        });
    }
    writeFile(path, force) {
        const { route, log } = this.context;
        const publicDir = this.context.public_dir;
        const Cache = this.context.model('Cache');
        const dataStream = this.wrapDataStream(route.get(path));
        const buffers = [];
        const hasher = (0, hexo_util_1.createSha1Hash)();
        const finishedPromise = new bluebird_1.default((resolve, reject) => {
            dataStream.once('error', reject);
            dataStream.once('end', resolve);
        });
        // Get data => Cache data => Calculate hash
        dataStream.on('data', chunk => {
            buffers.push(chunk);
            hasher.update(chunk);
        });
        return finishedPromise.then(() => {
            const dest = (0, path_1.join)(publicDir, path);
            const cacheId = `public/${path}`;
            const cache = Cache.findById(cacheId);
            const hash = hasher.digest('hex');
            // Skip generating if hash is unchanged
            if (!force && cache && cache.hash === hash) {
                return;
            }
            // Save new hash to cache
            return Cache.save({
                _id: cacheId,
                hash
            }).then(() => // Write cache data to public folder
             (0, hexo_fs_1.writeFile)(dest, Buffer.concat(buffers))).then(() => {
                log.info('Generated: %s', (0, picocolors_1.magenta)(path));
                return true;
            });
        });
    }
    deleteFile(path) {
        const { log } = this.context;
        const publicDir = this.context.public_dir;
        const dest = (0, path_1.join)(publicDir, path);
        return (0, hexo_fs_1.unlink)(dest).then(() => {
            log.info('Deleted: %s', (0, picocolors_1.magenta)(path));
        }, err => {
            // Skip ENOENT errors (file was deleted)
            if (err && err.code === 'ENOENT')
                return;
            throw err;
        });
    }
    wrapDataStream(dataStream) {
        const { log } = this.context;
        // Pass original stream with all data and errors
        if (this.bail) {
            return dataStream;
        }
        // Pass all data, but don't populate errors
        dataStream.on('error', err => {
            log.error(err);
        });
        return dataStream.pipe(new stream_1.PassThrough());
    }
    firstGenerate() {
        const { concurrency } = this;
        const { route, log } = this.context;
        const publicDir = this.context.public_dir;
        const Cache = this.context.model('Cache');
        // Show the loading time
        const interval = (0, pretty_hrtime_1.default)(process.hrtime(this.start));
        log.info('Files loaded in %s', (0, picocolors_1.cyan)(interval));
        // Reset the timer for later usage
        this.start = process.hrtime();
        // Check the public folder
        return (0, hexo_fs_1.stat)(publicDir).then(stats => {
            if (!stats.isDirectory()) {
                throw new Error(`${(0, picocolors_1.magenta)((0, tildify_1.default)(publicDir))} is not a directory`);
            }
        }).catch(err => {
            // Create public folder if not exists
            if (err && err.code === 'ENOENT') {
                return (0, hexo_fs_1.mkdirs)(publicDir);
            }
            throw err;
        }).then(() => {
            const task = (fn, path) => () => fn.call(this, path);
            const doTask = fn => fn();
            const routeList = route.list();
            const publicFiles = Cache.filter(item => item._id.startsWith('public/')).map(item => item._id.substring(7));
            const tasks = publicFiles.filter(path => !routeList.includes(path))
                // Clean files
                .map(path => task(this.deleteFile, path))
                // Generate files
                .concat(routeList.map(path => task(this.generateFile, path)));
            return bluebird_1.default.all(bluebird_1.default.map(tasks, doTask, { concurrency: parseFloat(concurrency || 'Infinity') }));
        }).then(result => {
            const interval = (0, pretty_hrtime_1.default)(process.hrtime(this.start));
            const count = result.filter(Boolean).length;
            log.info('%d files generated in %s', count.toString(), (0, picocolors_1.cyan)(interval));
        });
    }
    execWatch() {
        const { route, log } = this.context;
        return this.context.watch().then(() => this.firstGenerate()).then(() => {
            log.info('Hexo is watching for file changes. Press Ctrl+C to exit.');
            // Watch changes of the route
            route.on('update', path => {
                const modified = route.isModified(path);
                if (!modified)
                    return;
                this.generateFile(path);
            }).on('remove', path => {
                this.deleteFile(path);
            });
        });
    }
    execDeploy() {
        return this.context.call('deploy', this.args);
    }
}
function generateConsole(args = {}) {
    const generator = new Generater(this, args);
    if (generator.watch) {
        return generator.execWatch();
    }
    return this.load().then(() => generator.firstGenerate()).then(() => {
        if (generator.deploy) {
            return generator.execDeploy();
        }
    });
}
module.exports = generateConsole;
//# sourceMappingURL=generate.js.map
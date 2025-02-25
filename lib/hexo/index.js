"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = require("path");
const tildify_1 = __importDefault(require("tildify"));
const warehouse_1 = __importDefault(require("warehouse"));
const picocolors_1 = require("picocolors");
const events_1 = require("events");
const hexo_fs_1 = require("hexo-fs");
const module_1 = __importDefault(require("module"));
const vm_1 = require("vm");
const { version } = require('../../package.json');
const hexo_log_1 = __importDefault(require("hexo-log"));
const extend_1 = require("../extend");
const render_1 = __importDefault(require("./render"));
const register_models_1 = __importDefault(require("./register_models"));
const post_1 = __importDefault(require("./post"));
const scaffold_1 = __importDefault(require("./scaffold"));
const source_1 = __importDefault(require("./source"));
const router_1 = __importDefault(require("./router"));
const theme_1 = __importDefault(require("../theme"));
const locals_1 = __importDefault(require("./locals"));
const default_config_1 = __importDefault(require("./default_config"));
const load_database_1 = __importDefault(require("./load_database"));
const multi_config_path_1 = __importDefault(require("./multi_config_path"));
const hexo_util_1 = require("hexo-util");
const libDir = (0, path_1.dirname)(__dirname);
const dbVersion = 1;
const stopWatcher = (box) => { if (box.isWatching())
    box.unwatch(); };
const routeCache = new WeakMap();
const castArray = (obj) => { return Array.isArray(obj) ? obj : [obj]; };
// eslint-disable-next-line no-use-before-define
const mergeCtxThemeConfig = (ctx) => {
    // Merge hexo.config.theme_config into hexo.theme.config before post rendering & generating
    // config.theme_config has "_config.[theme].yml" merged in load_theme_config.js
    if (ctx.config.theme_config) {
        ctx.theme.config = (0, hexo_util_1.deepMerge)(ctx.theme.config, ctx.config.theme_config);
    }
};
// eslint-disable-next-line no-use-before-define
const createLoadThemeRoute = function (generatorResult, locals, ctx) {
    const { log, theme } = ctx;
    const { path, cache: useCache } = locals;
    const layout = [...new Set(castArray(generatorResult.layout))];
    const layoutLength = layout.length;
    // always use cache in fragment_cache
    locals.cache = true;
    return () => {
        if (useCache && routeCache.has(generatorResult))
            return routeCache.get(generatorResult);
        for (let i = 0; i < layoutLength; i++) {
            const name = layout[i];
            const view = theme.getView(name);
            if (view) {
                log.debug(`Rendering HTML ${name}: ${(0, picocolors_1.magenta)(path)}`);
                return view.render(locals)
                    .then(result => ctx.extend.injector.exec(result, locals))
                    .then(result => ctx.execFilter('_after_html_render', result, {
                    context: ctx,
                    args: [locals]
                }))
                    .tap(result => {
                    if (useCache) {
                        routeCache.set(generatorResult, result);
                    }
                }).tapCatch(err => {
                    log.error({ err }, `Render HTML failed: ${(0, picocolors_1.magenta)(path)}`);
                });
            }
        }
        log.warn(`No layout: ${(0, picocolors_1.magenta)(path)}`);
    };
};
function debounce(func, wait) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this);
        }, wait);
    };
}
class Hexo extends events_1.EventEmitter {
    constructor(base = process.cwd(), args = {}) {
        super();
        this.base_dir = base + path_1.sep;
        this.public_dir = (0, path_1.join)(base, 'public') + path_1.sep;
        this.source_dir = (0, path_1.join)(base, 'source') + path_1.sep;
        this.plugin_dir = (0, path_1.join)(base, 'node_modules') + path_1.sep;
        this.script_dir = (0, path_1.join)(base, 'scripts') + path_1.sep;
        this.scaffold_dir = (0, path_1.join)(base, 'scaffolds') + path_1.sep;
        this.theme_dir = (0, path_1.join)(base, 'themes', default_config_1.default.theme) + path_1.sep;
        this.theme_script_dir = (0, path_1.join)(this.theme_dir, 'scripts') + path_1.sep;
        this.env = {
            args,
            debug: Boolean(args.debug),
            safe: Boolean(args.safe),
            silent: Boolean(args.silent),
            env: process.env.NODE_ENV || 'development',
            version,
            cmd: args._ ? args._[0] : '',
            init: false
        };
        this.extend = {
            console: new extend_1.Console(),
            deployer: new extend_1.Deployer(),
            filter: new extend_1.Filter(),
            generator: new extend_1.Generator(),
            helper: new extend_1.Helper(),
            highlight: new extend_1.Highlight(),
            injector: new extend_1.Injector(),
            migrator: new extend_1.Migrator(),
            processor: new extend_1.Processor(),
            renderer: new extend_1.Renderer(),
            tag: new extend_1.Tag()
        };
        this.config = { ...default_config_1.default };
        this.log = (0, hexo_log_1.default)(this.env);
        this.render = new render_1.default(this);
        this.route = new router_1.default();
        this.post = new post_1.default(this);
        this.scaffold = new scaffold_1.default(this);
        this._dbLoaded = false;
        this._isGenerating = false;
        // If `output` is provided, use that as the
        // root for saving the db. Otherwise default to `base`.
        const dbPath = args.output || base;
        if (/^(init|new|g|publish|s|deploy|render|migrate)/.test(this.env.cmd)) {
            this.log.d(`Writing database to ${(0, path_1.join)(dbPath, 'db.json')}`);
        }
        this.database = new warehouse_1.default({
            version: dbVersion,
            path: (0, path_1.join)(dbPath, 'db.json')
        });
        const mcp = (0, multi_config_path_1.default)(this);
        this.config_path = args.config ? mcp(base, args.config, args.output)
            : (0, path_1.join)(base, '_config.yml');
        (0, register_models_1.default)(this);
        this.source = new source_1.default(this);
        this.theme = new theme_1.default(this);
        this.locals = new locals_1.default();
        this._bindLocals();
    }
    _bindLocals() {
        const db = this.database;
        const { locals } = this;
        locals.set('posts', () => {
            const query = {};
            if (!this.config.future) {
                query.date = { $lte: Date.now() };
            }
            if (!this._showDrafts()) {
                query.published = true;
            }
            return db.model('Post').find(query);
        });
        locals.set('pages', () => {
            const query = {};
            if (!this.config.future) {
                query.date = { $lte: Date.now() };
            }
            return db.model('Page').find(query);
        });
        locals.set('categories', () => {
            // Ignore categories with zero posts
            return db.model('Category').filter(category => category.length);
        });
        locals.set('tags', () => {
            // Ignore tags with zero posts
            return db.model('Tag').filter(tag => tag.length);
        });
        locals.set('data', () => {
            const obj = {};
            db.model('Data').forEach(data => {
                obj[data._id] = data.data;
            });
            return obj;
        });
    }
    init() {
        this.log.debug('Hexo version: %s', (0, picocolors_1.magenta)(this.version));
        this.log.debug('Working directory: %s', (0, picocolors_1.magenta)((0, tildify_1.default)(this.base_dir)));
        // Load internal plugins
        require('../plugins/console')(this);
        require('../plugins/filter')(this);
        require('../plugins/generator')(this);
        require('../plugins/helper')(this);
        require('../plugins/highlight')(this);
        require('../plugins/injector')(this);
        require('../plugins/processor')(this);
        require('../plugins/renderer')(this);
        require('../plugins/tag').default(this);
        // Load config
        return bluebird_1.default.each([
            'update_package', // Update package.json
            'load_config', // Load config
            'load_theme_config', // Load alternate theme config
            'load_plugins' // Load external plugins & scripts
        ], name => require(`./${name}`)(this)).then(() => this.execFilter('after_init', null, { context: this })).then(() => {
            // Ready to go!
            this.emit('ready');
        });
    }
    call(name, args, callback) {
        if (!callback && typeof args === 'function') {
            callback = args;
            args = {};
        }
        const c = this.extend.console.get(name);
        if (c)
            return Reflect.apply(c, this, [args]).asCallback(callback);
        return bluebird_1.default.reject(new Error(`Console \`${name}\` has not been registered yet!`));
    }
    model(name, schema) {
        return this.database.model(name, schema);
    }
    resolvePlugin(name, basedir) {
        try {
            // Try to resolve the plugin with the Node.js's built-in require.resolve.
            return require.resolve(name, { paths: [basedir] });
        }
        catch (err) {
            // There was an error (likely the node_modules is corrupt or from early version of npm),
            // so return a possibly non-existing path that a later part of the resolution process will check.
            return (0, path_1.join)(basedir, 'node_modules', name);
        }
    }
    loadPlugin(path, callback) {
        return (0, hexo_fs_1.readFile)(path).then(script => {
            // Based on: https://github.com/nodejs/node-v0.x-archive/blob/v0.10.33/src/node.js#L516
            const module = new module_1.default(path);
            module.filename = path;
            module.paths = module_1.default._nodeModulePaths(path);
            function req(path) {
                return module.require(path);
            }
            req.resolve = (request) => module_1.default._resolveFilename(request, module);
            req.main = require.main;
            req.extensions = module_1.default._extensions;
            req.cache = module_1.default._cache;
            script = `(async function(exports, require, module, __filename, __dirname, hexo){${script}\n});`;
            const fn = (0, vm_1.runInThisContext)(script, path);
            return fn(module.exports, req, module, path, (0, path_1.dirname)(path), this);
        }).asCallback(callback);
    }
    _showDrafts() {
        const { args } = this.env;
        return args.draft || args.drafts || this.config.render_drafts;
    }
    load(callback) {
        return (0, load_database_1.default)(this).then(() => {
            this.log.info('Start processing');
            return bluebird_1.default.all([
                this.source.process(),
                this.theme.process()
            ]);
        }).then(() => {
            mergeCtxThemeConfig(this);
            return this._generate({ cache: false });
        }).asCallback(callback);
    }
    watch(callback) {
        let useCache = false;
        const { cache } = Object.assign({
            cache: false
        }, this.config.server);
        const { alias } = this.extend.console;
        if (alias[this.env.cmd] === 'server' && cache) {
            // enable cache when run hexo server
            useCache = true;
        }
        this._watchBox = debounce(() => this._generate({ cache: useCache }), 100);
        return (0, load_database_1.default)(this).then(() => {
            this.log.info('Start processing');
            return bluebird_1.default.all([
                this.source.watch(),
                this.theme.watch()
            ]);
        }).then(() => {
            mergeCtxThemeConfig(this);
            this.source.on('processAfter', this._watchBox);
            this.theme.on('processAfter', () => {
                this._watchBox();
                mergeCtxThemeConfig(this);
            });
            return this._generate({ cache: useCache });
        }).asCallback(callback);
    }
    unwatch() {
        if (this._watchBox != null) {
            this.source.removeListener('processAfter', this._watchBox);
            this.theme.removeListener('processAfter', this._watchBox);
            this._watchBox = null;
        }
        stopWatcher(this.source);
        stopWatcher(this.theme);
    }
    _generateLocals() {
        const { config, env, theme, theme_dir } = this;
        const ctx = { config: { url: this.config.url } };
        const localsObj = this.locals.toObject();
        class Locals {
            constructor(path, locals) {
                this.page = { ...locals };
                if (this.page.path == null)
                    this.page.path = path;
                this.path = path;
                this.url = hexo_util_1.full_url_for.call(ctx, path);
                this.config = config;
                this.theme = theme.config;
                this.layout = 'layout';
                this.env = env;
                this.view_dir = (0, path_1.join)(theme_dir, 'layout') + path_1.sep;
                this.site = localsObj;
            }
        }
        return Locals;
    }
    _runGenerators() {
        this.locals.invalidate();
        const siteLocals = this.locals.toObject();
        const generators = this.extend.generator.list();
        const { log } = this;
        // Run generators
        return bluebird_1.default.map(Object.keys(generators), key => {
            const generator = generators[key];
            log.debug('Generator: %s', (0, picocolors_1.magenta)(key));
            return Reflect.apply(generator, this, [siteLocals]);
        }).reduce((result, data) => {
            return data ? result.concat(data) : result;
        }, []);
    }
    _routerRefresh(runningGenerators, useCache) {
        const { route } = this;
        const routeList = route.list();
        const Locals = this._generateLocals();
        Locals.prototype.cache = useCache;
        return runningGenerators.map((generatorResult) => {
            if (typeof generatorResult !== 'object' || generatorResult.path == null)
                return undefined;
            // add Route
            const path = route.format(generatorResult.path);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const { data, layout } = generatorResult;
            if (!layout) {
                route.set(path, data);
                return path;
            }
            return this.execFilter('template_locals', new Locals(path, data), { context: this })
                .then(locals => { route.set(path, createLoadThemeRoute(generatorResult, locals, this)); })
                .thenReturn(path);
        }).then(newRouteList => {
            // Remove old routes
            for (let i = 0, len = routeList.length; i < len; i++) {
                const item = routeList[i];
                if (!newRouteList.includes(item)) {
                    route.remove(item);
                }
            }
        });
    }
    _generate(options = {}) {
        if (this._isGenerating)
            return;
        const useCache = options.cache;
        this._isGenerating = true;
        this.emit('generateBefore');
        // Run before_generate filters
        return this.execFilter('before_generate', null, { context: this })
            .then(() => this._routerRefresh(this._runGenerators(), useCache)).then(() => {
            this.emit('generateAfter');
            // Run after_generate filters
            return this.execFilter('after_generate', null, { context: this });
        }).finally(() => {
            this._isGenerating = false;
        });
    }
    exit(err) {
        if (err) {
            this.log.fatal({ err }, 'Something\'s wrong. Maybe you can find the solution here: %s', (0, picocolors_1.underline)('https://hexo.io/docs/troubleshooting.html'));
        }
        return this.execFilter('before_exit', null, { context: this }).then(() => {
            this.emit('exit', err);
        });
    }
    execFilter(type, data, options) {
        return this.extend.filter.exec(type, data, options);
    }
    execFilterSync(type, data, options) {
        return this.extend.filter.execSync(type, data, options);
    }
}
Hexo.lib_dir = libDir + path_1.sep;
Hexo.prototype.lib_dir = Hexo.lib_dir;
Hexo.core_dir = (0, path_1.dirname)(libDir) + path_1.sep;
Hexo.prototype.core_dir = Hexo.core_dir;
Hexo.version = version;
Hexo.prototype.version = Hexo.version;
module.exports = Hexo;
//# sourceMappingURL=index.js.map
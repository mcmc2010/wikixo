"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const bluebird_1 = __importDefault(require("bluebird"));
const typeAlias = {
    pre: 'before_post_render',
    post: 'after_post_render',
    'after_render:html': '_after_html_render'
};
class Filter {
    constructor() {
        this.store = {};
    }
    list(type) {
        if (!type)
            return this.store;
        return this.store[type] || [];
    }
    register(type, fn, priority) {
        if (!priority) {
            if (typeof type === 'function') {
                priority = fn;
                fn = type;
                type = 'after_post_render';
            }
        }
        if (typeof fn !== 'function')
            throw new TypeError('fn must be a function');
        type = typeAlias[type] || type;
        priority = priority == null ? 10 : priority;
        const store = this.store[type] || [];
        this.store[type] = store;
        fn.priority = priority;
        store.push(fn);
        store.sort((a, b) => a.priority - b.priority);
    }
    unregister(type, fn) {
        if (!type)
            throw new TypeError('type is required');
        if (typeof fn !== 'function')
            throw new TypeError('fn must be a function');
        type = typeAlias[type] || type;
        const list = this.list(type);
        if (!list || !list.length)
            return;
        const index = list.indexOf(fn);
        if (index !== -1)
            list.splice(index, 1);
    }
    exec(type, data, options = {}) {
        const filters = this.list(type);
        if (filters.length === 0)
            return bluebird_1.default.resolve(data);
        const ctx = options.context;
        const args = options.args || [];
        args.unshift(data);
        return bluebird_1.default.each(filters, filter => Reflect.apply(bluebird_1.default.method(filter), ctx, args).then(result => {
            args[0] = result == null ? args[0] : result;
            return args[0];
        })).then(() => args[0]);
    }
    execSync(type, data, options = {}) {
        const filters = this.list(type);
        const filtersLen = filters.length;
        if (filtersLen === 0)
            return data;
        const ctx = options.context;
        const args = options.args || [];
        args.unshift(data);
        for (let i = 0, len = filtersLen; i < len; i++) {
            const result = Reflect.apply(filters[i], ctx, args);
            args[0] = result == null ? args[0] : result;
        }
        return args[0];
    }
}
module.exports = Filter;
//# sourceMappingURL=filter.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const warehouse_1 = __importDefault(require("warehouse"));
const bluebird_1 = __importDefault(require("bluebird"));
module.exports = (ctx) => {
    const Cache = new warehouse_1.default.Schema({
        _id: { type: String, required: true },
        hash: { type: String, default: '' },
        modified: { type: Number, default: Date.now() } // UnixTime
    });
    Cache.static('compareFile', function (id, hashFn, statFn) {
        const cache = this.findById(id);
        // If cache does not exist, then it must be a new file. We have to get both
        // file hash and stats.
        if (!cache) {
            return bluebird_1.default.all([hashFn(id), statFn(id)]).spread((hash, stats) => this.insert({
                _id: id,
                hash,
                modified: stats.mtime.getTime()
            })).thenReturn({
                type: 'create'
            });
        }
        let mtime;
        // Get file stats
        return statFn(id).then(stats => {
            mtime = stats.mtime.getTime();
            // Skip the file if the modified time is unchanged
            if (cache.modified === mtime) {
                return {
                    type: 'skip'
                };
            }
            // Get file hash
            return hashFn(id);
        }).then(result => {
            // If the result is an object, skip the following steps because it's an
            // unchanged file
            if (typeof result === 'object')
                return result;
            const hash = result;
            // Skip the file if the hash is unchanged
            if (cache.hash === hash) {
                return {
                    type: 'skip'
                };
            }
            // Update cache info
            cache.hash = hash;
            cache.modified = mtime;
            return cache.save().thenReturn({
                type: 'update'
            });
        });
    });
    return Cache;
};
//# sourceMappingURL=cache.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const warehouse_1 = __importDefault(require("warehouse"));
const date_1 = require("../../plugins/helper/date");
// It'll pollute the moment module.
// declare module 'moment' {
//   export default interface Moment extends moment.Moment {
//     _d: Date;
//   // eslint-disable-next-line semi
//   }
// }
class SchemaTypeMoment extends warehouse_1.default.SchemaType {
    constructor(name, options = {}) {
        super(name, options);
    }
    cast(value, data) {
        value = super.cast(value, data);
        if (value == null)
            return value;
        const { options } = this;
        value = toMoment(value);
        if (options.language)
            value = value.locale((0, date_1.toMomentLocale)(options.language));
        if (options.timezone)
            value = value.tz(options.timezone);
        return value;
    }
    validate(value, data) {
        value = super.validate(value, data);
        if (value == null)
            return value;
        value = toMoment(value);
        if (!value.isValid()) {
            throw new Error('`' + value + '` is not a valid date!');
        }
        return value;
    }
    match(value, query, data) {
        return value ? value.valueOf() === query.valueOf() : false;
    }
    compare(a, b) {
        if (a) {
            if (b)
                return a - b;
            return 1;
        }
        if (b)
            return -1;
        return 0;
    }
    parse(value) {
        if (value)
            return toMoment(value);
    }
    value(value, data) {
        // FIXME: Same as above. Also a dirty hack.
        return value ? value._d.toISOString() : value;
    }
    q$day(value, query, data) {
        return value ? value.date() === query : false;
    }
    q$month(value, query, data) {
        return value ? value.month() === query : false;
    }
    q$year(value, query, data) {
        return value ? value.year() === query : false;
    }
    u$inc(value, update, data) {
        if (!value)
            return value;
        return value.add(update);
    }
    u$dec(value, update, data) {
        if (!value)
            return value;
        return value.subtract(update);
    }
}
function toMoment(value) {
    // FIXME: Something is wrong when using a moment instance. I try to get the
    // original date object and create a new moment object again.
    if (date_1.moment.isMoment(value))
        return (0, date_1.moment)(value._d);
    return (0, date_1.moment)(value);
}
module.exports = SchemaTypeMoment;
//# sourceMappingURL=moment.js.map
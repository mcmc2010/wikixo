"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMomentLocale = exports.moment = void 0;
exports.date = dateHelper;
exports.date_xml = toISOString;
exports.time = timeHelper;
exports.full_date = fullDateHelper;
exports.relative_date = relativeDateHelper;
exports.time_tag = timeTagHelper;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
exports.moment = moment_timezone_1.default;
const { isMoment } = moment_timezone_1.default;
const moize_1 = __importDefault(require("moize"));
const isDate = (value) => typeof value === 'object' && value instanceof Date && !isNaN(value.getTime());
function getMoment(date, lang, timezone) {
    if (date == null)
        date = (0, moment_timezone_1.default)();
    if (!isMoment(date))
        date = (0, moment_timezone_1.default)(isDate(date) ? date : new Date(date));
    lang = _toMomentLocale(lang);
    if (lang)
        date = date.locale(lang);
    if (timezone)
        date = date.tz(timezone);
    return date;
}
function toISOString(date) {
    if (date == null) {
        return new Date().toISOString();
    }
    if (date instanceof Date || isMoment(date)) {
        return date.toISOString();
    }
    return new Date(date).toISOString();
}
function dateHelper(date, format) {
    const { config } = this;
    const moment = getMoment(date, getLanguage(this), config.timezone);
    return moment.format(format || config.date_format);
}
function timeHelper(date, format) {
    const { config } = this;
    const moment = getMoment(date, getLanguage(this), config.timezone);
    return moment.format(format || config.time_format);
}
function fullDateHelper(date, format) {
    if (format) {
        const moment = getMoment(date, getLanguage(this), this.config.timezone);
        return moment.format(format);
    }
    return `${this.date(date)} ${this.time(date)}`;
}
function relativeDateHelper(date) {
    const { config } = this;
    const moment = getMoment(date, getLanguage(this), config.timezone);
    return moment.fromNow();
}
function timeTagHelper(date, format) {
    return `<time datetime="${toISOString(date)}">${this.date(date, format)}</time>`;
}
function getLanguage(ctx) {
    return ctx.page.lang || ctx.page.language || ctx.config.language;
}
/**
 * Convert Hexo language code to Moment locale code.
 * examples:
 *   default => en
 *   zh-CN => zh-cn
 *
 * Moment defined locales: https://github.com/moment/moment/tree/master/locale
 */
function _toMomentLocale(lang) {
    if (lang === undefined) {
        return undefined;
    }
    // moment.locale('') equals moment.locale('en')
    // moment.locale(null) equals moment.locale('en')
    if (!lang || lang === 'en' || lang === 'default') {
        return 'en';
    }
    return lang.toLowerCase().replace('_', '-');
}
exports.toMomentLocale = moize_1.default.shallow(_toMomentLocale);
//# sourceMappingURL=date.js.map
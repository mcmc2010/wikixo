"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.current = isCurrentHelper;
exports.home = isHomeHelper;
exports.home_first_page = isHomeFirstPageHelper;
exports.post = isPostHelper;
exports.page = isPageHelper;
exports.archive = isArchiveHelper;
exports.year = isYearHelper;
exports.month = isMonthHelper;
exports.category = isCategoryHelper;
exports.tag = isTagHelper;
function isCurrentHelper(path = '/', strict) {
    const currentPath = this.path.replace(/^[^/].*/, '/$&');
    if (strict) {
        if (path.endsWith('/'))
            path += 'index.html';
        path = path.replace(/^[^/].*/, '/$&');
        return currentPath === path;
    }
    path = path.replace(/\/index\.html$/, '/');
    if (path === '/')
        return currentPath === '/index.html';
    path = path.replace(/^[^/].*/, '/$&');
    return currentPath.startsWith(path);
}
function isHomeHelper() {
    return Boolean(this.page.__index);
}
function isHomeFirstPageHelper() {
    return Boolean(this.page.__index) && this.page.current === 1;
}
function isPostHelper() {
    return Boolean(this.page.__post);
}
function isPageHelper() {
    return Boolean(this.page.__page);
}
function isArchiveHelper() {
    return Boolean(this.page.archive);
}
function isYearHelper(year) {
    const { page } = this;
    if (!page.archive)
        return false;
    if (year) {
        return page.year === year;
    }
    return Boolean(page.year);
}
function isMonthHelper(year, month) {
    const { page } = this;
    if (!page.archive)
        return false;
    if (year) {
        if (month) {
            return page.year === year && page.month === month;
        }
        return page.month === year;
    }
    return Boolean(page.year && page.month);
}
function isCategoryHelper(category) {
    if (category) {
        return this.page.category === category;
    }
    return Boolean(this.page.category);
}
function isTagHelper(tag) {
    if (tag) {
        return this.page.tag === tag;
    }
    return Boolean(this.page.tag);
}
//# sourceMappingURL=is.js.map
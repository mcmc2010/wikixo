import type Hexo from '../../hexo';


module.exports = (ctx: Hexo) => {

    const { filter } = ctx.extend;

    filter.register("after_generate", require("./image_compress"))
};
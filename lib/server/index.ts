
import Path from 'path';
import Koa from 'koa';
import KoaLogger from 'koa-logger';
import KoaRouter from 'koa-router';
import KoaStaticPath from 'koa-static';
//
import Generate from "../generator";

//
const HTTP_PORT = 4000;
const ROOT_PATH = "www";


//
let app = null;
let router = null;
let http_server = null;

//
async function init() : Promise<Boolean>
{
    if(!await Generate())
    {
        return false;
    }
    return true;
}

//
function start_server()
{
    app = new Koa();
    router = new KoaRouter();

    //
    let root_path = process.env.ROOT_PATH || ROOT_PATH;
    let work_path = Path.resolve(`${process.cwd()}`);
    let public_dir = Path.resolve(`${work_path}`, `${root_path}/public`);

    // 使用 koa-logger 中间件
    app.use(KoaLogger());

    //
    app.use(KoaStaticPath(public_dir));
    console.log(`Server Root : ${public_dir}`);

    app.use(router.routes());
    app.use(router.allowedMethods());

    // 启动 Koa 服务
    http_server = app.listen(HTTP_PORT, () => {
        //
        console.log(`Server is running at http://localhost:${HTTP_PORT}`);
    
    });
}


//
function main()
{
    init().then((result) => {
        if(result)
        {
            start_server();
        }
    });
    return 0;
}

export = main;
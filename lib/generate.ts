
import FS from "fs"
import Path from "path";
import Args from "minimist";
import Hexo from "./hexo";

//
const ROOT_PATH = "www";

//
export async function Generate(pathname:string = "", rootpath = "", enable_debug = false) : Promise<Boolean> 
{
    //
    if(pathname == null || pathname.length == 0)
    {
        pathname = process.cwd();
    }
    
    if(!FS.existsSync(pathname))
    {
        return false;
    }

    //
    let hexo = new Hexo(pathname, 
    { 
        debug: enable_debug
    }, rootpath);

    let result:Boolean = true;

    try {
        await hexo.init();
        console.log('Hexo initialized.');
        console.log('Hexo Application at:', hexo.root_dir);
        console.log('Hexo content generated at:', hexo.base_dir);
        
        //
        await hexo.call('generate'); // 生成静态文件
        
    } catch (err) {
        console.error('Error generating Hexo content:', err);
        result = false;
    } finally {
        await hexo.exit();
    }

    return result;
}

///
export async function Clean(pathname:string = "") : Promise<Boolean> 
{
    //
    if(pathname == null || pathname.length == 0)
    {
        pathname = process.cwd();
    }
    
    if(!FS.existsSync(pathname))
    {
        return false;
    }

    //
    let hexo = new Hexo(pathname, 
    { 
        debug: true

    });

    let result:Boolean = true;

    try {
        await hexo.init();
        console.log('Hexo initialized.');

        //
        await hexo.call('clean'); // 生成静态文件
        console.log('Hexo content clean at:', hexo.base_dir);
    } catch (err) {
        console.error('Error content:', err);
        result = false;
    } finally {
        await hexo.exit();
    }

    return result;
}

function main()
{
    //
    let base_dir = Path.resolve(`${__dirname}/../`, `${ROOT_PATH}`);
    let root_dir = Path.resolve(`${__dirname}/../`, ``);

    // 解析命令行参数
    let args = Args(process.argv.slice(2));
    if (args.clean) {
        Clean(base_dir);
    } else {
        Generate(base_dir, root_dir, true);
    }
}

export default main;

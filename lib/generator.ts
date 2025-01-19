
import OS from 'os';
import FS from "fs"
import Path, { basename } from "path";
import Args from "minimist";
import Hexo from "./hexo";

//
const ROOT_PATH = "www";

//
export async function Generate(pathname:string = "", rootpath = "", enable_debug = false) : Promise<Boolean> 
{
    //
    pathname = (pathname||"").trim();
    if(pathname.length == 0)
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
        console.log('Hexo Generated at:', hexo.base_dir);
        
        //
        await hexo.call('generate'); // 生成静态文件
        
    } catch (err) {
        console.error('(Error) Hexo generating:', err);
        result = false;
    } finally {
        await hexo.exit();
    }

    return result;
}

///
export async function NewPost(pathname:string, filename:string, enable_debug = false) : Promise<Boolean>  
{
    //
    pathname = (pathname||"").trim();
    if(pathname.length == 0)
    {
        pathname = process.cwd();
    }
    
    if(!FS.existsSync(pathname))
    {
        return false;
    }

    //
    filename = (filename || "").trim();
    
    //  文件名为null
    if(filename.length == 0)
    {
        return false;  
    }

    //
    let basename = Path.basename(filename);
    let dirname = Path.dirname(filename);
    if(dirname.length == 0)
    {
        dirname = process.cwd();
    }

    let home_dirname = OS.homedir();

    // 检查运行当前是否有文件
    filename = Path.resolve(Path.join(dirname, basename));
    if(!FS.existsSync(filename))
    {
        console.log('Hexo new : (file) not found ', filename);

        // 如果文件不存在
        filename = Path.resolve(Path.join(home_dirname, "Desktop", basename));
        if(!FS.existsSync(filename))
        {
            return false;
        }
    }

    //
    let hexo = new Hexo(pathname, 
    { 
        debug: enable_debug
    });
    let result:Boolean = true;

    try {
        await hexo.init();
        console.log('Hexo initialized.');
        console.log('Hexo generating content at:', hexo.base_dir);
        console.log('Hexo new : (file) ', filename);
        //
        await hexo.call('new', { _:"", path: filename}); // 生成静态文件
        
    } catch (err) {
        console.error('(Error) Hexo generating content:', err);
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
        debug: false
    });

    let result:Boolean = true;

    try {
        await hexo.init();
        console.log('Hexo initialized.');

        //
        await hexo.call('clean'); // 生成静态文件
        console.log('Hexo clean at:', hexo.base_dir);
    } catch (err) {
        console.error('(Error) Hexo clean:', err);
        result = false;
    } finally {
        await hexo.exit();
    }

    return result;
}

function main()
{
    let root_path = process.env.ROOT_PATH || ROOT_PATH;

    //
    let base_dir = Path.resolve(`${__dirname}/../`, `${root_path}`);
    let root_dir = Path.resolve(`${__dirname}/../`, ``);

    // 解析命令行参数
    let args = Args(process.argv.slice(2));
    if (args.clean) {
        return Clean(base_dir);
    } else if(args.new && (args.filename || "").length > 0) {
        return NewPost(base_dir, args.filename, true);
    } else {
        return Generate(base_dir, root_dir, true);
    }
    return false;
}

// Javascript using the method
export const generate = main;
// Typescript using the method
export default main;

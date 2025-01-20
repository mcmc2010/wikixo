
//
import FS, { writeFileSync } from "fs";
import Path from "path";
import Crypto from "crypto";
import CRC from "crc";

//
import Hexo from '../../hexo';

// 最新版本已是ESM，在CJS中不支持运行
import Imagemin from "imagemin";
import ImageminWebp from "imagemin-webp";
import ImageminMozjpeg from "imagemin-mozjpeg";
import ImageminPngquant from "imagemin-pngquant";

///
function SanitizeFileName(filename:string) : string
{
    // 定义非法字符集
    let illegal_chars = ['@', '#', '?', '$', ',', ".", '!', '%', '*', "~", "`", "^", '<', '>', "[",  "]", "{",  "}", ':', ";", '"', '\'', '/', '\\', '|', '+', '='];
    // 创建正则表达式，只匹配非法字符集合
    let regex = new RegExp(`[${illegal_chars.map(char => '\\' + char).join('')}]`, 'g');
    let detected = filename.match(regex);
    if(detected)
    {
        
    }
    filename = filename.replace(regex, '_') // 替换非法字符为下划线
    .replace(/\s+/g, '_') // 替换空格为下划线
    .trim(); // 去除首尾空格
    return filename;
}

///
// 计算 MD5 值
function MD5(buffer:Crypto.BinaryLike) :string {
    let hash = Crypto.createHash("md5");
    hash.update(buffer);
    let digest = hash.digest("hex");
    return digest.toUpperCase();
}

function SHA1(buffer:Crypto.BinaryLike) :string {
    let hash = Crypto.createHash("sha1");
    hash.update(buffer);
    let digest = hash.digest("hex");
    return digest.toUpperCase();
}

///
function CRC32(buffer:string|Uint8Array|Buffer) :string {
    let data = new ArrayBuffer();
    if (typeof buffer === 'string') {
        // 如果输入是字符串，使用 UTF-8 编码转换为 Buffer
        data = Buffer.from(buffer, 'utf-8');
    } else if (buffer instanceof Uint8Array) {
        // 如果输入是 Uint8Array，直接转换为 Buffer
        data = Buffer.from(buffer);
    } else {
        // 如果输入已经是 Buffer，直接使用
        data = buffer;
    }
    let digest = CRC.crc32(data).toString(16).padStart(8, '0');
    return digest.toUpperCase();
}

//
// 计算文件的 MD5 值
function HashMD5File(filename:string) : any
{
    let buffer = FS.readFileSync(filename);
    let hash = MD5(buffer);
    return { hash:hash, length:buffer.byteLength} ;
}

///
function LoadFileIndexes(ctx: Hexo, filename:string) : any {

    //
    let indexes_data = {
        items:[

        ]
    };

    try
    {

        if (!FS.existsSync(filename)) {
            let text = JSON.stringify(indexes_data, null, "\t");
            FS.writeFileSync(filename, text, "utf-8");
        }
        else
        {
            let text = FS.readFileSync(filename, "utf-8");
            if(text.length > 0)
            {
                let data = JSON.parse(text);
                if(!data.items) {
                    data.items = [];
                }
                indexes_data = data;
            }
        }

    } catch (e) {
        ctx.log.error({e}, 'Load indexes failed: %s', filename);
    }

    return indexes_data;
}

///
function SaveFileIndexes(ctx: Hexo, filename:string, data:any = null) : any {

    //
    let indexes_data = {
        items:[

        ]
    };

    if(!data)
    {
        data = indexes_data;
    }

    try
    {
        let text = JSON.stringify(data, null, "\t");
        FS.writeFileSync(filename, text, "utf-8");

    } catch (e) {
        ctx.log.error({e}, 'Save indexes failed: %s', filename);
    }

    return indexes_data;
}

////
async function ImageCompressOneFile(ctx: Hexo, input_filename:string, output_filename:string, quality = 0.8)
{
    try
    {
        //
        if (!FS.existsSync(input_filename)) {
            return false;
        }

        let files = await Imagemin([input_filename], {
            glob: false,
            plugins: [
                ImageminWebp({ quality: quality * 100 }),
                //ImageminMozjpeg({ quality: quality * 100 }),
                //ImageminPngquant({ quality: [0.6, quality] })
            ]
        });

        if (files.length > 0 && files[0].data)
        {
            FS.writeFileSync(output_filename, files[0].data);
        }
    } catch (e) {
        ctx.log.error({e}, 'Image Compress failed: %s, Error:%s', input_filename, e.message);
    }

    return true;
}

///
async function ImageCompressFiles(ctx: Hexo, files:string[], source_dir:string, target_dir:string, indexes:any = null) 
{
    if(files.length == 0) {
        return false;
    }

    // 定义支持的图像扩展名数组
    let supported_exts = [".jpg", ".jpeg", ".png", ".webp"];
    //
    let now = new Date();

    for(let file of files)
    {
        let filename = Path.join(source_dir, file);
        // 跳过非文件
        if (!FS.statSync(filename).isFile()) {
            continue;
        }

        let dirname = Path.dirname(filename);
        let basename = Path.basename(filename, Path.extname(filename));
        let ext = Path.extname(filename).toLowerCase();
        // 检查扩展名是否在支持的扩展名数组中
        if (!supported_exts.includes(ext)) {
            continue;
        }

        if(ext == ".jpeg") { ext = ".jpg" }

        //
        let text = Path.join(dirname, `${basename}${ext}`);
        let hash_name = CRC32(text);
        let new_filename = `${hash_name}${ext}`;

        let hash = HashMD5File(filename);

        let item_data = {   
            index : hash_name,
            filename : new_filename,
            pathname : encodeURI(filename),
            hash: hash.hash,
            length: hash.length,
            datetime: now.toISOString(),
        };

        new_filename = `${hash_name}.webp`;

        if(indexes != null)
        {
            let index = indexes.items.findIndex(item => item.index === hash_name);
            if(index < 0)
            {
                indexes.items.push(item_data);
            }
            else if(indexes.items[index].hash != hash)
            {
                indexes.items[index] = item_data;
            }
            else
            {
                continue;
            }
        }

        ctx.log.info(`Image : (Compress) ${filename} -> ${new_filename}`)
        
        new_filename = Path.join(target_dir, new_filename);

        await ImageCompressOneFile(ctx, filename, new_filename);
    }
}

// 
module.exports = async function ImageCompressFilter (this: Hexo)
{
    let source_dir = Path.resolve(this.source_dir, "_images");
    let target_dir = Path.resolve(this.public_dir, "images");
    let indexes_filename = Path.resolve(this.base_dir, "files.json");

    let indexes_data = LoadFileIndexes(this, indexes_filename);



    // 确保输出目录存在
    if (!FS.existsSync(target_dir)) 
    {
        FS.mkdirSync(target_dir);
    }

    if(!FS.existsSync(source_dir))
    {
        return;
    }

    let now = new Date();

    // 定义支持的图像扩展名数组
    let supported_exts = [".jpg", ".jpeg", ".png", ".webp"];

    let files = FS.readdirSync(source_dir);
    await ImageCompressFiles(this, files, source_dir, target_dir, indexes_data);

    //
    SaveFileIndexes(this, indexes_filename, indexes_data);
}
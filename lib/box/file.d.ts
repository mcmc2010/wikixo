import type Promise from 'bluebird';
import { type ReadFileOptions } from 'hexo-fs';
import type fs from 'fs';
declare class File {
    source: string;
    path: string;
    params: any;
    type: string;
    static TYPE_CREATE: 'create';
    static TYPE_UPDATE: 'update';
    static TYPE_SKIP: 'skip';
    static TYPE_DELETE: 'delete';
    constructor({ source, path, params, type }: {
        source: any;
        path: any;
        params: any;
        type: any;
    });
    read(options?: ReadFileOptions): Promise<string>;
    readSync(options?: ReadFileOptions): string;
    stat(): Promise<fs.Stats>;
    statSync(): fs.Stats;
}
export = File;

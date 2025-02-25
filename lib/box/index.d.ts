import BlueBirdPromise from 'bluebird';
import File from './file';
import { Pattern } from 'hexo-util';
import { EventEmitter } from 'events';
import type Hexo from '../hexo';
import type { NodeJSLikeCallback } from '../types';
interface Processor {
    pattern: Pattern;
    process: (file?: File) => any;
}
declare class Box extends EventEmitter {
    options: any;
    context: Hexo;
    base: string;
    processors: Processor[];
    _processingFiles: any;
    watcher: any;
    Cache: any;
    File: any;
    ignore: any[];
    source: any;
    constructor(ctx: Hexo, base: string, options?: object);
    _createFileClass(): {
        new ({ source, path, params, type }: {
            source: any;
            path: any;
            params: any;
            type: any;
        }): {
            box: Box;
            render(options?: object): BlueBirdPromise<any>;
            renderSync(options?: object): any;
            source: string;
            path: string;
            params: any;
            type: string;
            read(options?: import("hexo-fs").ReadFileOptions): BlueBirdPromise<string>;
            readSync(options?: import("hexo-fs").ReadFileOptions): string;
            stat(): BlueBirdPromise<import("fs").Stats>;
            statSync(): import("fs").Stats;
        };
        TYPE_CREATE: "create";
        TYPE_UPDATE: "update";
        TYPE_SKIP: "skip";
        TYPE_DELETE: "delete";
    };
    addProcessor(pattern: (...args: any[]) => any): void;
    addProcessor(pattern: string | RegExp | Pattern | ((...args: any[]) => any), fn: (...args: any[]) => any): void;
    _readDir(base: string, prefix?: string): BlueBirdPromise<any>;
    _checkFileStatus(path: string): any;
    process(callback?: NodeJSLikeCallback<any>): BlueBirdPromise<any>;
    _processFile(type: string, path: string): BlueBirdPromise<void> | BlueBirdPromise<string>;
    watch(callback?: NodeJSLikeCallback<never>): BlueBirdPromise<void>;
    unwatch(): void;
    isWatching(): boolean;
}
export interface _File extends File {
    box: Box;
    render(options?: any): any;
    renderSync(options?: any): any;
}
export default Box;

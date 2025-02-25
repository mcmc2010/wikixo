import Promise from 'bluebird';
interface FilterOptions {
    context?: any;
    args?: any[];
}
interface StoreFunction {
    (data?: any, ...args: any[]): any;
    priority?: number;
}
interface Store {
    [key: string]: StoreFunction[];
}
declare class Filter {
    store: Store;
    constructor();
    list(): Store;
    list(type: string): StoreFunction[];
    register(fn: StoreFunction): void;
    register(fn: StoreFunction, priority: number): void;
    register(type: string, fn: StoreFunction): void;
    register(type: string, fn: StoreFunction, priority: number): void;
    unregister(type: string, fn: StoreFunction): void;
    exec(type: string, data: any, options?: FilterOptions): Promise<any>;
    execSync(type: string, data: any, options?: FilterOptions): any;
}
export = Filter;

interface Options {
    href?: string;
    title?: string;
    class?: string | string[];
    subject?: string;
    cc?: string | string[];
    bcc?: string | string[];
    id?: string;
    body?: string;
}
declare function mailToHelper(path: string | string[], text?: string, options?: Options): string;
declare const _default: import("moize").Moized<typeof mailToHelper, Partial<{
    isDeepEqual: boolean;
    isPromise: boolean;
    isReact: boolean;
    isSerialized: boolean;
    isShallowEqual: boolean;
    matchesArg: import("moize").IsEqual;
    matchesKey: import("moize").IsMatchingKey;
    maxAge: number;
    maxArgs: number;
    maxSize: number;
    onCacheAdd: import("moize").OnCacheOperation<typeof mailToHelper>;
    onCacheChange: import("moize").OnCacheOperation<typeof mailToHelper>;
    onCacheHit: import("moize").OnCacheOperation<typeof mailToHelper>;
    onExpire: import("moize").OnExpire;
    profileName: string;
    serializer: import("moize").Serialize;
    transformArgs: import("moize").TransformKey;
    updateCacheForKey: import("moize").UpdateCacheForKey;
    updateExpire: boolean;
}> & Partial<{
    isDeepEqual: boolean;
    isPromise: boolean;
    isReact: boolean;
    isSerialized: boolean;
    isShallowEqual: boolean;
    matchesArg: import("moize").IsEqual;
    matchesKey: import("moize").IsMatchingKey;
    maxAge: number;
    maxArgs: number;
    maxSize: number;
    onCacheAdd: import("moize").OnCacheOperation<import("moize").Moizeable>;
    onCacheChange: import("moize").OnCacheOperation<import("moize").Moizeable>;
    onCacheHit: import("moize").OnCacheOperation<import("moize").Moizeable>;
    onExpire: import("moize").OnExpire;
    profileName: string;
    serializer: import("moize").Serialize;
    transformArgs: import("moize").TransformKey;
    updateCacheForKey: import("moize").UpdateCacheForKey;
    updateExpire: boolean;
}> & {
    maxSize: number;
    isDeepEqual: true;
}>;
export = _default;

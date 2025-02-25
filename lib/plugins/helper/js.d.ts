import type { LocalsType } from '../../types';
declare function jsHelper(this: LocalsType, ...args: any[]): string;
declare const _default: import("moize").Moized<typeof jsHelper, Partial<{
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
    onCacheAdd: import("moize").OnCacheOperation<typeof jsHelper>;
    onCacheChange: import("moize").OnCacheOperation<typeof jsHelper>;
    onCacheHit: import("moize").OnCacheOperation<typeof jsHelper>;
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
    updateCacheForKey(): boolean;
}>;
export = _default;

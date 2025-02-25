import type { LocalsType } from '../../types';
interface Options {
    class?: string;
    text?: string | null;
    button?: string | boolean;
}
declare function searchFormHelper(this: LocalsType, options?: Options): string;
declare const _default: import("moize").Moized<typeof searchFormHelper, Partial<{
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
    onCacheAdd: import("moize").OnCacheOperation<typeof searchFormHelper>;
    onCacheChange: import("moize").OnCacheOperation<typeof searchFormHelper>;
    onCacheHit: import("moize").OnCacheOperation<typeof searchFormHelper>;
    onExpire: import("moize").OnExpire;
    profileName: string;
    serializer: import("moize").Serialize;
    transformArgs: import("moize").TransformKey;
    updateCacheForKey: import("moize").UpdateCacheForKey;
    updateExpire: boolean;
}> & {
    isDeepEqual: true;
}>;
export = _default;

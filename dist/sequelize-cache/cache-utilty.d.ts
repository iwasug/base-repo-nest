import { FindOptions } from 'sequelize';
export interface CacheKeyAtt {
    readonly attributes: readonly string[];
    readonly havingAttributes?: readonly string[];
    readonly order?: readonly string[];
    readonly group?: readonly string[];
}
export interface CacheKey {
    readonly [key: string]: CacheKeyAtt;
}
export declare class CacheUtility {
    static setKey(name: string, key: string | number, options?: string): string;
    static setQueryOptions(options?: FindOptions): string;
    static getKeyTime(key: string): number;
    static setResult(result: string): any;
    static setOneQueryOptions(options?: FindOptions): string;
    private static cleanOptions;
    private static cleanIncludeOptions;
}
export default CacheUtility;

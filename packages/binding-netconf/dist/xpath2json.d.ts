export declare function isPlainObject(a: unknown): boolean;
export declare function json2xpath(json: any, index: number, str: Array<string>): string[];
export declare function xpath2json(xpath: string, namespaces: Record<string, string>): Record<string, unknown>;
export declare function addLeaves(xpath: string, payload: unknown): string;

import Thing from "./thing-description";
export { default as Thing } from "./thing-description";
export * from "./thing-description";
export * from "./td-parser";
export * from "./td-helpers";
export * from "./thing-model-helpers";
export * from "./util/asset-interface-description";
declare type DeepPartial<T> = T extends Record<string, unknown> ? {
    [P in keyof T]?: T[P] extends Array<infer I> ? Array<DeepPartial<I>> : DeepPartial<T[P]>;
} : T;
export declare type ThingModel = DeepPartial<Thing>;

export interface Resolver {
    fetch(uri: string): Promise<unknown>;
}
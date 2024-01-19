import { Token } from "client-oauth2";
import { Request } from "node-fetch";
import { BasicSecurityScheme, APIKeySecurityScheme, BearerSecurityScheme } from "@node-wot/td-tools";
import { TuyaCustomBearerSecurityScheme } from "./http";
export declare abstract class Credential {
    abstract sign(request: Request): Promise<Request>;
}
export interface BasicCredentialConfiguration {
    username: string;
    password: string;
}
export declare class BasicCredential extends Credential {
    private readonly username;
    private readonly password;
    private readonly options?;
    constructor({ username, password }: BasicCredentialConfiguration, options?: BasicSecurityScheme);
    sign(request: Request): Promise<Request>;
}
export interface BearerCredentialConfiguration {
    token: string;
}
export declare class BearerCredential extends Credential {
    private readonly token;
    private readonly options;
    constructor({ token }: BearerCredentialConfiguration, options: BearerSecurityScheme);
    sign(request: Request): Promise<Request>;
}
export interface BasicKeyCredentialConfiguration {
    apiKey: string;
}
export declare class BasicKeyCredential extends Credential {
    private readonly apiKey;
    private readonly options;
    constructor({ apiKey }: BasicKeyCredentialConfiguration, options: APIKeySecurityScheme);
    sign(request: Request): Promise<Request>;
}
export declare class OAuthCredential extends Credential {
    private token;
    private readonly refresh?;
    constructor(token: Token | Promise<Token>, refresh?: () => Promise<Token>);
    sign(request: Request): Promise<Request>;
    refreshToken(): Promise<OAuthCredential>;
}
export interface TuyaCustomBearerCredentialConfiguration {
    key: string;
    secret: string;
}
export declare class TuyaCustomBearer extends Credential {
    protected key: string;
    protected secret: string;
    protected baseUri: string;
    protected token?: string;
    protected refreshToken?: string;
    protected expireTime?: Date;
    constructor(credentials: TuyaCustomBearerCredentialConfiguration, scheme: TuyaCustomBearerSecurityScheme);
    sign(request: Request): Promise<Request>;
    protected requestAndRefreshToken(refresh: boolean): Promise<void>;
    private getHeaders;
    private requestSign;
    private isTokenExpired;
}
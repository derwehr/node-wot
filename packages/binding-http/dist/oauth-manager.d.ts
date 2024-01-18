import { OAuth2SecurityScheme } from "@node-wot/td-tools";
import { OAuthCredential } from "./credential";
export interface OAuthClientConfiguration {
    clientId: string;
    clientSecret: string;
}
export interface OAuthResourceOwnerConfiguration extends OAuthClientConfiguration {
    username: string;
    password: string;
}
export default class OAuthManager {
    private tokenStore;
    handleClient(securityScheme: OAuth2SecurityScheme, credentials: OAuthClientConfiguration): OAuthCredential;
    handleResourceOwnerCredential(securityScheme: OAuth2SecurityScheme, credentials: OAuthResourceOwnerConfiguration): OAuthCredential;
}

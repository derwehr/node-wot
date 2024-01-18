export declare class AssetInterfaceDescriptionUtil {
    transformAAS2TD(aas: string, template?: string, submodelRegex?: string): string;
    transformSM2TD(aid: string, template?: string, submodelRegex?: string): string;
    transformTD2AAS(td: string, protocols?: string[]): string;
    transformTD2SM(tdAsString: string, protocols?: string[]): string;
    transformToTD(aid: string, template?: string, submodelRegex?: string): string;
    private createSemanticId;
    private replaceCharAt;
    private sanitizeIdShort;
    private getSimpleValueTypeXsd;
    private getProtocolPrefixes;
    private updateProtocolPrefixes;
    private getBaseFromEndpointMetadata;
    private getContentTypeFromEndpointMetadata;
    private updateRootMetadata;
    private createInteractionForm;
    private processSubmodel;
    private processSubmodelElement;
    private getSubmodelInformation;
    private _transform;
    private createEndpointMetadata;
    private getFormForProtocol;
    private hasOp;
    private addRequiredAidTermsForForm;
    private createInterfaceMetadata;
}

import { Subscription } from "rxjs/Subscription";
import { ProtocolClient, Content } from "@node-wot/core";
import { Form, SecurityScheme } from "@node-wot/td-tools";
import { DataType, IBasicSession } from "node-opcua-client";
import { NodeId, NodeIdLike } from "node-opcua-nodeid";
import { FormElementProperty } from "wot-thing-description-types";
export declare type Command = "Read" | "Write" | "Subscribe";
export interface NodeByBrowsePath {
    root: NodeIdLike;
    path: string;
}
export declare type NodeIdLike2 = NodeIdLike & {
    root: undefined;
    path: undefined;
};
export interface FormPartialNodeDescription {
    "opcua:nodeId": NodeIdLike | NodeByBrowsePath;
}
export interface OPCUAForm extends Form, FormPartialNodeDescription {
}
export interface OPCUAFormElement extends FormElementProperty, FormPartialNodeDescription {
}
export interface OPCUAFormInvoke extends OPCUAForm {
    "opcua:method": NodeIdLike | NodeByBrowsePath;
}
export interface OPCUAFormSubscribe extends OPCUAForm {
    "opcua:samplingInterval"?: number;
}
export declare function findBasicDataTypeC(session: IBasicSession, dataTypeId: NodeId, callback: (err: Error | null, dataType?: DataType) => void): void;
export declare class OPCUAProtocolClient implements ProtocolClient {
    private _connections;
    private _withConnection;
    private _withSession;
    private _withSubscription;
    private _resolveNodeId2;
    private _resolveNodeId;
    private _predictDataType;
    private _resolveMethodNodeId;
    readResource(form: OPCUAForm): Promise<Content>;
    writeResource(form: OPCUAForm, content: Content): Promise<void>;
    invokeResource(form: OPCUAFormInvoke, content: Content): Promise<Content>;
    subscribeResource(form: OPCUAForm, next: (content: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    private _unmonitor;
    unlinkResource(form: OPCUAForm): Promise<void>;
    requestThingDescription(uri: string): Promise<Content>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity(metadata: SecurityScheme[], credentials?: unknown): boolean;
    private _monitoredItems;
    private _dataValueToContent;
    private _contentToDataValue;
    private _contentToVariant;
    private _findBasicDataType;
    private _resolveInputArguments;
    private _resolveOutputArguments;
}

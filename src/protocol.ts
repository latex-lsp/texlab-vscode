import {
  NotificationType,
  RequestType,
  TextDocumentIdentifier,
} from 'vscode-languageclient';

export interface BuildTextDocumentParams {
  textDocument: TextDocumentIdentifier;
}

export enum BuildStatus {
  Success,
  Error,
  Failure,
}

export abstract class BuildTextDocumentRequest {
  public static type = new RequestType<
    BuildTextDocumentParams,
    BuildStatus,
    void,
    void
  >('textDocument/build');
}

export enum ServerStatus {
  Idle,
  Building,
  Indexing,
}

export interface StatusParams {
  status: ServerStatus;
  uri?: string;
}

export abstract class SetStatusNotification {
  public static type = new NotificationType<StatusParams, void>(
    'window/setStatus',
  );
}

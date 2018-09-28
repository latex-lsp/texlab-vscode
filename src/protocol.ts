import { RequestType, TextDocumentIdentifier } from 'vscode-languageclient';

export interface BuildTextDocumentParams {
  textDocument: TextDocumentIdentifier;
}

export enum BuildResult {
  Success,
  Error,
  Failure,
}

export abstract class BuildTextDocumentRequest {
  public static type = new RequestType<
    BuildTextDocumentParams,
    BuildResult,
    void,
    void
  >('textDocument/build');
}

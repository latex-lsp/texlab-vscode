import * as vscode from 'vscode';
import {
  LanguageClient,
  RequestType,
  TextDocumentIdentifier,
  TextDocumentPositionParams,
} from 'vscode-languageclient';

export interface BuildTextDocumentParams {
  textDocument: TextDocumentIdentifier;
}

export abstract class BuildTextDocumentRequest {
  public static type = new RequestType<
    BuildTextDocumentParams,
    BuildStatus,
    void,
    void
  >('textDocument/build');
}

export enum BuildStatus {
  Success,
  Error,
  Failure,
}

export abstract class ForwardSearchRequest {
  public static type = new RequestType<
    TextDocumentPositionParams,
    ForwardSearchStatus,
    void,
    void
  >('textDocument/forwardSearch');
}

export enum ForwardSearchStatus {
  Success,
  Error,
  Unconfigured,
}

export async function build(
  client: LanguageClient,
  document: vscode.TextDocument,
  cancellationToken: vscode.CancellationToken,
): Promise<BuildStatus> {
  const params: BuildTextDocumentParams = {
    textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(
      document,
    ),
  };

  return client.sendRequest(
    BuildTextDocumentRequest.type,
    params,
    cancellationToken,
  );
}

export async function forwardSearch(
  client: LanguageClient,
  document: vscode.TextDocument,
  position: vscode.Position,
): Promise<ForwardSearchStatus> {
  const params = client.code2ProtocolConverter.asTextDocumentPositionParams(
    document,
    position,
  );

  return client.sendRequest(ForwardSearchRequest.type, params);
}

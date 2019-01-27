import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  RequestType,
  ServerOptions,
  TextDocumentIdentifier,
  TextDocumentPositionParams,
} from 'vscode-languageclient';
import { ProgressFeature } from './progress';

export enum BuildStatus {
  Success,
  Error,
  Failure,
}

export interface BuildResult {
  status: BuildStatus;
}

export enum ForwardSearchStatus {
  Success,
  Error,
  Unconfigured,
}

export interface ForwardSearchResult {
  status: ForwardSearchStatus;
}

interface BuildTextDocumentParams {
  textDocument: TextDocumentIdentifier;
}

abstract class BuildTextDocumentRequest {
  public static type = new RequestType<
    BuildTextDocumentParams,
    BuildResult,
    void,
    void
  >('textDocument/build');
}

abstract class ForwardSearchRequest {
  public static type = new RequestType<
    TextDocumentPositionParams,
    ForwardSearchResult,
    void,
    void
  >('textDocument/forwardSearch');
}

export class CustomLanguageClient extends LanguageClient {
  constructor(
    name: string,
    serverOptions: ServerOptions,
    clientOptions: LanguageClientOptions,
  ) {
    super(name, serverOptions, clientOptions);
    this.registerFeature(new ProgressFeature(this));
  }

  public async build(
    document: vscode.TextDocument,
    cancellationToken: vscode.CancellationToken,
  ): Promise<BuildResult> {
    const params: BuildTextDocumentParams = {
      textDocument: this.code2ProtocolConverter.asTextDocumentIdentifier(
        document,
      ),
    };

    return this.sendRequest(
      BuildTextDocumentRequest.type,
      params,
      cancellationToken,
    );
  }

  public async forwardSearch(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<ForwardSearchResult> {
    const params = this.code2ProtocolConverter.asTextDocumentPositionParams(
      document,
      position,
    );

    return this.sendRequest(ForwardSearchRequest.type, params);
  }
}

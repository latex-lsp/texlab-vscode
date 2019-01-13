import * as vscode from 'vscode';
import {
  DocumentSelector,
  LanguageClient,
  RequestType,
  TextDocumentPositionParams,
} from 'vscode-languageclient';
import { ObservableFeature, Subscriber } from './observableFeature';

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

export class ForwardSearchFeature extends ObservableFeature<
  ForwardSearchStatus
> {
  private isSearching = false;
  private documentSelector: DocumentSelector = [
    { language: 'latex', scheme: 'file' },
  ];

  constructor(private client: LanguageClient, subscriber: Subscriber) {
    super(subscriber);
  }

  protected canExecute({ document }: vscode.TextEditor): boolean {
    return (
      !this.isSearching &&
      vscode.languages.match(this.documentSelector, document) > 0
    );
  }

  protected async execute({
    document,
    selection,
  }: vscode.TextEditor): Promise<ForwardSearchStatus> {
    this.isSearching = true;
    const params = this.client.code2ProtocolConverter.asTextDocumentPositionParams(
      document,
      selection.start,
    );

    const result = await this.client.sendRequest(
      ForwardSearchRequest.type,
      params,
    );

    this.isSearching = false;
    return result;
  }
}

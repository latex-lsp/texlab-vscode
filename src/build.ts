import * as vscode from 'vscode';
import {
  DocumentSelector,
  LanguageClient,
  RequestType,
  TextDocumentIdentifier,
} from 'vscode-languageclient';
import { ObservableFeature, Subscriber } from './observableFeature';

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

export class BuildFeature extends ObservableFeature<BuildStatus> {
  private isBuilding = false;
  private documentSelector: DocumentSelector = [
    { language: 'latex', scheme: 'file' },
    { language: 'bibtex', scheme: 'file' },
  ];

  constructor(private client: LanguageClient, subscriber: Subscriber) {
    super(subscriber);
  }

  protected canExecute({ document }: vscode.TextEditor): boolean {
    return (
      !this.isBuilding &&
      vscode.languages.match(this.documentSelector, document) > 0
    );
  }

  protected async execute({
    document,
  }: vscode.TextEditor): Promise<BuildStatus> {
    this.isBuilding = true;
    await document.save();

    const params: BuildTextDocumentParams = {
      textDocument: this.client.code2ProtocolConverter.asTextDocumentIdentifier(
        document,
      ),
    };

    const status = await this.client.sendRequest(
      BuildTextDocumentRequest.type,
      params,
    );

    this.isBuilding = false;
    return status;
  }
}

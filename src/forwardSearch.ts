import * as vscode from 'vscode';
import {
  DocumentSelector,
  LanguageClient,
  RequestType,
  TextDocumentPositionParams,
} from 'vscode-languageclient';
import { EventFeature } from './eventFeature';

abstract class ForwardSearchRequest {
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

export class ForwardSearchFeature extends EventFeature<ForwardSearchStatus> {
  private documentSelector: DocumentSelector = [
    { language: 'latex', scheme: 'file' },
  ];

  public get onSearchPerformed(): vscode.Event<ForwardSearchStatus> {
    return this.emitter.event;
  }

  constructor(private client: LanguageClient) {
    super();
  }

  protected register(): void | vscode.Disposable {
    return vscode.commands.registerTextEditorCommand(
      'latex.forwardSearch',
      async editor => this.forwardSearch(editor),
    );
  }

  private async forwardSearch({ document, selection }: vscode.TextEditor) {
    if (!vscode.languages.match(this.documentSelector, document)) {
      return;
    }

    const params = this.client.code2ProtocolConverter.asTextDocumentPositionParams(
      document,
      selection.start,
    );

    const status = await this.client.sendRequest(
      ForwardSearchRequest.type,
      params,
    );

    this.emitter.fire(status);
  }
}

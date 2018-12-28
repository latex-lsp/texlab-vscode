import * as vscode from 'vscode';
import {
  ClientCapabilities,
  DocumentSelector,
  LanguageClient,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';
import { BuildTextDocumentParams, BuildTextDocumentRequest } from './protocol';
import { StatusFeature } from './status';

export class BuildFeature implements StaticFeature {
  private subscription: vscode.Disposable | undefined;

  constructor(
    private client: LanguageClient,
    private statusFeature: StatusFeature,
  ) {}

  public fillClientCapabilities(_capabilities: ClientCapabilities) {}

  public initialize(
    _capabilities: ServerCapabilities,
    documentSelector: DocumentSelector,
  ) {
    if (this.subscription !== undefined) {
      return;
    }

    this.subscription = vscode.commands.registerTextEditorCommand(
      'latex.build',
      async editor => this.build(editor, documentSelector),
    );
  }

  public dispose() {
    if (this.subscription) {
      this.subscription.dispose();
      this.subscription = undefined;
    }
  }

  private async build(
    { document }: vscode.TextEditor,
    documentSelector: DocumentSelector,
  ) {
    if (!vscode.languages.match(documentSelector, document)) {
      return;
    }

    if (document.uri.scheme !== 'file') {
      return;
    }

    if (document.isDirty && (await !document.save())) {
      return;
    }

    const params: BuildTextDocumentParams = {
      textDocument: this.client.code2ProtocolConverter.asTextDocumentIdentifier(
        document,
      ),
    };

    const status = await this.client.sendRequest(
      BuildTextDocumentRequest.type,
      params,
    );

    this.statusFeature.setBuildStatus(status);
  }
}

import * as vscode from 'vscode';
import {
  ClientCapabilities,
  DocumentSelector,
  LanguageClient,
  RequestType,
  ServerCapabilities,
  StaticFeature,
  TextDocumentIdentifier,
} from 'vscode-languageclient';

interface BuildTextDocumentParams {
  textDocument: TextDocumentIdentifier;
}

abstract class BuildTextDocumentRequest {
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

export class BuildFeature implements StaticFeature {
  private readonly emitter: vscode.EventEmitter<BuildStatus>;
  private subscription: vscode.Disposable | undefined;
  private documentSelector: DocumentSelector = [
    { language: 'latex', scheme: 'file' },
    { language: 'bibtex', scheme: 'file' },
  ];

  public get onBuildFinished(): vscode.Event<BuildStatus> {
    return this.emitter.event;
  }

  constructor(private client: LanguageClient) {
    this.emitter = new vscode.EventEmitter();
  }

  public fillClientCapabilities(_capabilities: ClientCapabilities) {}

  public initialize(
    _capabilities: ServerCapabilities,
    _documentSelector: DocumentSelector,
  ) {
    if (this.subscription !== undefined) {
      return;
    }

    this.subscription = vscode.commands.registerTextEditorCommand(
      'latex.build',
      async editor => this.build(editor),
    );
  }

  public dispose() {
    this.emitter.dispose();

    if (this.subscription) {
      this.subscription.dispose();
      this.subscription = undefined;
    }
  }

  private async build({ document }: vscode.TextEditor) {
    if (!vscode.languages.match(this.documentSelector, document)) {
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

    this.emitter.fire(status);
  }
}

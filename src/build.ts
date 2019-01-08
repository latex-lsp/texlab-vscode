import * as vscode from 'vscode';
import {
  DocumentSelector,
  LanguageClient,
  RequestType,
  TextDocumentIdentifier,
} from 'vscode-languageclient';
import { EventFeature } from './eventFeature';

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

export class BuildFeature extends EventFeature<BuildStatus> {
  private documentSelector: DocumentSelector = [
    { language: 'latex', scheme: 'file' },
    { language: 'bibtex', scheme: 'file' },
  ];

  public get onBuildFinished(): vscode.Event<BuildStatus> {
    return this.emitter.event;
  }

  constructor(private client: LanguageClient) {
    super();
  }

  protected register(): vscode.Disposable | undefined {
    return vscode.commands.registerTextEditorCommand(
      'latex.build',
      async editor => this.build(editor),
    );
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

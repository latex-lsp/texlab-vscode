import * as vscode from 'vscode';
import {
  ClientCapabilities,
  DocumentSelector,
  LanguageClient,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';
import {
  BuildResult,
  BuildTextDocumentParams,
  BuildTextDocumentRequest,
} from './protocol';

const HIDE_AFTER_TIMEOUT = 5000;
const DOCUMENT_SAVE_ERROR =
  'An error occured while saving the current document.';
const BUILD_PROGRESS_MESSAGE = 'Building document...';
const BUILD_SUCCESS_INFO = 'Build succeeded';
const BUILD_ERROR =
  'A build error occured. Please check the problems tab and the build log for further information.';
const BUILD_FAILURE =
  'An error occured while executing the configured LaTeX build tool.';

export class BuildFeature implements StaticFeature {
  private subscription: vscode.Disposable | undefined;

  constructor(private client: LanguageClient) {}

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
    if (
      !vscode.languages.match(documentSelector, document) ||
      document.uri.scheme !== 'file'
    ) {
      return;
    }

    if (document.isDirty && (await !document.save())) {
      vscode.window.showErrorMessage(DOCUMENT_SAVE_ERROR);
      return;
    }

    await vscode.window.withProgress(
      {
        cancellable: false,
        location: vscode.ProgressLocation.Window,
        title: BUILD_PROGRESS_MESSAGE,
      },
      async () => {
        const params: BuildTextDocumentParams = {
          textDocument: this.client.code2ProtocolConverter.asTextDocumentIdentifier(
            document,
          ),
        };
        const result = await this.client.sendRequest(
          BuildTextDocumentRequest.type,
          params,
        );

        switch (result) {
          case BuildResult.Success:
            vscode.window.setStatusBarMessage(
              BUILD_SUCCESS_INFO,
              HIDE_AFTER_TIMEOUT,
            );
            break;
          case BuildResult.Error:
            vscode.window.showErrorMessage(BUILD_ERROR);
            break;
          case BuildResult.Failure:
            vscode.window.showErrorMessage(BUILD_FAILURE);
            break;
        }
      },
    );
  }
}

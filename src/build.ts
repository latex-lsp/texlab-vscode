import * as vscode from 'vscode';
import {
  CancellationTokenSource,
  DocumentSelector,
  LanguageClient,
  RequestType,
  TextDocumentIdentifier,
} from 'vscode-languageclient';
import { ObservableCommand, Subscriber } from './command';

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
  Cancelled,
}

const DOCUMENT_SELECTOR: DocumentSelector = [
  { language: 'latex', scheme: 'file' },
  { language: 'bibtex', scheme: 'file' },
];

export interface BuildState {
  isBuilding: boolean;
  cancellationTokenSource?: CancellationTokenSource;
}

export class BuildCommand extends ObservableCommand<BuildStatus> {
  public state: BuildState = {
    isBuilding: false,
    cancellationTokenSource: undefined,
  };

  constructor(private client: LanguageClient, subscriber: Subscriber) {
    super(subscriber);
  }

  protected canExecute({ document }: vscode.TextEditor): boolean {
    return (
      !this.state.isBuilding &&
      vscode.languages.match(DOCUMENT_SELECTOR, document) > 0
    );
  }

  protected async execute({
    document,
  }: vscode.TextEditor): Promise<BuildStatus> {
    this.state.isBuilding = true;
    await document.save();

    const params: BuildTextDocumentParams = {
      textDocument: this.client.code2ProtocolConverter.asTextDocumentIdentifier(
        document,
      ),
    };

    try {
      this.state.cancellationTokenSource = new CancellationTokenSource();
      return await this.client.sendRequest(
        BuildTextDocumentRequest.type,
        params,
        this.state.cancellationTokenSource.token,
      );
    } catch {
      return BuildStatus.Cancelled;
    } finally {
      this.state.isBuilding = false;
    }
  }
}

export class CancelBuildCommand extends ObservableCommand<{}> {
  constructor(subscriber: Subscriber, private state: BuildState) {
    super(subscriber);
  }

  protected canExecute(): boolean {
    return this.state.isBuilding;
  }

  protected async execute(): Promise<{}> {
    if (this.state.cancellationTokenSource) {
      this.state.cancellationTokenSource.cancel();
      this.state.cancellationTokenSource = undefined;
    }
    return {};
  }
}

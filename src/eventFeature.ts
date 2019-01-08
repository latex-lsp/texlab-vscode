import * as vscode from 'vscode';
import {
  ClientCapabilities,
  DocumentSelector,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';

export abstract class EventFeature<T> implements StaticFeature {
  protected readonly emitter = new vscode.EventEmitter<T>();
  private subscription: vscode.Disposable | undefined;

  public initialize(
    _capabilities: ServerCapabilities,
    _documentSelector: DocumentSelector,
  ) {
    if (this.subscription) {
      return;
    }

    const result = this.register();
    if (result) {
      this.subscription = result;
    }
  }

  public fillClientCapabilities(_capabilities: ClientCapabilities) {}

  public dispose() {
    this.emitter.dispose();

    if (this.subscription) {
      this.subscription.dispose();
      this.subscription = undefined;
    }
  }

  protected abstract register(): vscode.Disposable | void;
}

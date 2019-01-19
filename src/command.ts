import * as vscode from 'vscode';
import {
  ClientCapabilities,
  DocumentSelector,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';

export interface Subscriber {
  register(callback: (...args: any[]) => void): vscode.Disposable | void;
}

export abstract class ObservableCommand<T> implements StaticFeature {
  private readonly emitter = new vscode.EventEmitter<T>();
  private subscription: vscode.Disposable | undefined;

  public get onValueChanged(): vscode.Event<T> {
    return this.emitter.event;
  }

  constructor(private subscriber: Subscriber) {}

  public initialize(
    _capabilities: ServerCapabilities,
    _documentSelector: DocumentSelector,
  ) {
    if (this.subscription) {
      return;
    }

    const subscription = this.subscriber.register(async (...args) => {
      if (this.canExecute(...args)) {
        const result = await this.execute(...args);
        this.emitter.fire(result);
      }
    });

    if (subscription) {
      this.subscription = subscription;
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

  protected abstract canExecute(...args: any[]): boolean;

  protected abstract execute(...args: any[]): Promise<T>;
}

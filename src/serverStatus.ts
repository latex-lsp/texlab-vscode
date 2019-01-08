import * as vscode from 'vscode';
import {
  ClientCapabilities,
  DocumentSelector,
  LanguageClient,
  NotificationType,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';

export interface StatusParams {
  status: ServerStatus;
  uri?: string;
}

abstract class SetStatusNotification {
  public static type = new NotificationType<StatusParams, void>(
    'window/setStatus',
  );
}

export enum ServerStatus {
  Idle,
  Building,
  Indexing,
}

export class ServerStatusFeature implements StaticFeature {
  private readonly emitter: vscode.EventEmitter<StatusParams>;

  public get onStatusChanged(): vscode.Event<StatusParams> {
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
    this.client.onNotification(SetStatusNotification.type, params =>
      this.emitter.fire(params),
    );
  }

  public dispose() {
    this.emitter.dispose();
  }
}

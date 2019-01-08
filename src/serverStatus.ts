import * as vscode from 'vscode';
import { LanguageClient, NotificationType } from 'vscode-languageclient';
import { EventFeature } from './eventFeature';

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

export class ServerStatusFeature extends EventFeature<StatusParams> {
  public get onStatusChanged(): vscode.Event<StatusParams> {
    return this.emitter.event;
  }

  constructor(private client: LanguageClient) {
    super();
  }

  protected register() {
    this.client.onNotification(SetStatusNotification.type, params =>
      this.emitter.fire(params),
    );
  }
}

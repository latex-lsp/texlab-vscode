import { LanguageClient, NotificationType } from 'vscode-languageclient';
import { ObservableFeature, Subscriber } from './observableFeature';

export interface StatusParams {
  status: ServerStatus;
  uri?: string;
}

export abstract class SetStatusNotification {
  public static type = new NotificationType<StatusParams, void>(
    'window/setStatus',
  );
}

export enum ServerStatus {
  Idle,
  Building,
  Indexing,
}

export class ServerStatusFeature extends ObservableFeature<StatusParams> {
  constructor(subscriber: Subscriber) {
    super(subscriber);
  }

  protected canExecute(): boolean {
    return true;
  }

  protected execute(params: StatusParams): Promise<StatusParams> {
    return Promise.resolve(params);
  }
}

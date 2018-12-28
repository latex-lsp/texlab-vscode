import * as vscode from 'vscode';
import {
  ClientCapabilities,
  DocumentSelector,
  LanguageClient,
  ServerCapabilities,
  State,
  StateChangeEvent,
  StaticFeature,
} from 'vscode-languageclient';
import {
  BuildStatus,
  ServerStatus,
  SetStatusNotification,
  StatusParams,
} from './protocol';

const HIDE_AFTER_TIMEOUT = 5000;
const NORMAL_COLOR = new vscode.ThemeColor('statusBar.foreground');
const ERROR_COLOR = new vscode.ThemeColor('errorForeground');

const BUILD_SUCCESS_MESSAGE = 'Build succeeded';
const BUILD_ERROR_MESSAGE =
  'A build error occured. Please check the problems tab and the build log for further information.';
const BUILD_FAILURE_MESSAGE =
  'An error occured while executing the configured LaTeX build tool.';
const IDLE_STATUS_MESSAGE = 'TexLab is running...';
const ERROR_STATUS_MESSAGE = 'TexLab has stopped working!';

export class StatusFeature implements StaticFeature {
  private statusBarItem: vscode.StatusBarItem;
  private subscription: vscode.Disposable | undefined;

  constructor(private client: LanguageClient) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
    );
  }

  public fillClientCapabilities(_capabilities: ClientCapabilities) {}

  public initialize(
    _capabilities: ServerCapabilities,
    _documentSelector: DocumentSelector,
  ) {
    if (this.subscription !== undefined) {
      return;
    }

    this.subscription = this.client.onDidChangeState(
      this.onServerStateChanged,
      this,
    );
    this.client.onNotification(
      SetStatusNotification.type,
      this.onServerStatusChanged.bind(this),
    );

    this.statusBarItem.show();
  }

  public dispose() {
    this.statusBarItem.dispose();

    if (this.subscription) {
      this.subscription.dispose();
      this.subscription = undefined;
    }
  }

  public setBuildStatus(status: BuildStatus) {
    switch (status) {
      case BuildStatus.Success:
        this.drawStatusBarItem(
          BUILD_SUCCESS_MESSAGE,
          '',
          NORMAL_COLOR,
          HIDE_AFTER_TIMEOUT,
        );
        break;
      case BuildStatus.Error:
        vscode.window.showErrorMessage(BUILD_ERROR_MESSAGE);
        break;
      case BuildStatus.Failure:
        vscode.window.showErrorMessage(BUILD_FAILURE_MESSAGE);
        break;
    }
  }

  private onServerStateChanged({ newState }: StateChangeEvent) {
    if (newState === State.Stopped) {
      this.drawStatusBarItem('', ERROR_STATUS_MESSAGE, ERROR_COLOR);
    }
  }

  private onServerStatusChanged({ status, uri }: StatusParams) {
    switch (status) {
      case ServerStatus.Idle:
        this.drawStatusBarItem('', IDLE_STATUS_MESSAGE, NORMAL_COLOR);
        break;
      case ServerStatus.Building:
        this.drawStatusBarItem(`Building ${uri}...`, '', NORMAL_COLOR);
        break;
      case ServerStatus.Indexing:
        this.drawStatusBarItem(`Indexing ${uri}...`, '', NORMAL_COLOR);
        break;
    }
  }

  private drawStatusBarItem(
    text: string,
    tooltip: string,
    color: vscode.ThemeColor,
    duration?: number,
  ) {
    if (duration) {
      const {
        text: oldText,
        tooltip: oldTooltip,
        color: oldColor,
      } = this.statusBarItem;

      setTimeout(() => {
        this.statusBarItem.text = oldText;
        this.statusBarItem.tooltip = oldTooltip;
        this.statusBarItem.color = oldColor;
      }, duration);
    }

    this.statusBarItem.text = `$(beaker) ${text}`;
    this.statusBarItem.tooltip = tooltip;
    this.statusBarItem.color = color;
  }
}

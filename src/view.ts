import * as vscode from 'vscode';
import { LanguageClient, State, StateChangeEvent } from 'vscode-languageclient';
import { BuildFeature, BuildStatus } from './build';
import {
  ServerStatus,
  ServerStatusFeature,
  StatusParams,
} from './serverStatus';

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

export class ExtensionView {
  private readonly subscriptions: vscode.Disposable[];
  private statusBarItem: vscode.StatusBarItem;

  constructor(
    client: LanguageClient,
    buildFeature: BuildFeature,
    serverStatusFeature: ServerStatusFeature,
  ) {
    this.subscriptions = [];
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
    );

    client.onDidChangeState(
      this.onServerStateChanged,
      this,
      this.subscriptions,
    );

    buildFeature.onBuildFinished(
      this.onBuildFinished,
      this,
      this.subscriptions,
    );

    serverStatusFeature.onStatusChanged(
      this.onServerStatusChanged,
      this,
      this.subscriptions,
    );
  }

  public show() {
    this.statusBarItem.show();
  }

  public dispose() {
    this.subscriptions.forEach(x => x.dispose());
    this.statusBarItem.dispose();
  }

  private onServerStateChanged({ newState }: StateChangeEvent) {
    switch (newState) {
      case State.Running:
        this.onServerStatusChanged({ status: ServerStatus.Idle });
        break;
      case State.Stopped:
        this.drawStatusBarItem('', ERROR_STATUS_MESSAGE, ERROR_COLOR);
        break;
    }
  }

  private onBuildFinished(status: BuildStatus) {
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

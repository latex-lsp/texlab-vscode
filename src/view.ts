import * as vscode from 'vscode';
import { LanguageClient, State, StateChangeEvent } from 'vscode-languageclient';
import { BuildCommand, BuildStatus } from './build';
import { ForwardSearchCommand, ForwardSearchStatus } from './forwardSearch';

const NORMAL_COLOR = new vscode.ThemeColor('statusBar.foreground');
const ERROR_COLOR = new vscode.ThemeColor('errorForeground');

const BUILD_ERROR_MESSAGE =
  'A build error occured. Please check the problems tab and the build log for further information.';
const BUILD_FAILURE_MESSAGE =
  'An error occured while executing the configured LaTeX build tool.';
const IDLE_STATUS_MESSAGE = 'TexLab is running...';
const ERROR_STATUS_MESSAGE = 'TexLab has stopped working!';
const FORWARD_SEARCH_ERROR_MESSAGE =
  'An error occured while executing the configured PDF viewer. Please see the README of this extension and the PDF viewer for further information.';
const FORWARD_SEARCH_UNCONFIGURED_MESSAGE =
  'The forward search feature is not configured. Please see the README for instructions.';

export class ExtensionView {
  private readonly subscriptions: vscode.Disposable[];
  private statusBarItem: vscode.StatusBarItem;

  constructor(
    client: LanguageClient,
    buildCommand: BuildCommand,
    forwardSearchCommand: ForwardSearchCommand,
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

    buildCommand.onValueChanged(this.onBuildFinished, this, this.subscriptions);

    forwardSearchCommand.onValueChanged(
      this.onSearchPerformed,
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
        this.drawStatusBarItem('', IDLE_STATUS_MESSAGE, NORMAL_COLOR);
        break;
      case State.Stopped:
        this.drawStatusBarItem('', ERROR_STATUS_MESSAGE, ERROR_COLOR);
        break;
    }
  }

  private onBuildFinished(status: BuildStatus) {
    switch (status) {
      case BuildStatus.Success:
        break;
      case BuildStatus.Error:
        vscode.window.showErrorMessage(BUILD_ERROR_MESSAGE);
        break;
      case BuildStatus.Failure:
        vscode.window.showErrorMessage(BUILD_FAILURE_MESSAGE);
        break;
      case BuildStatus.Cancelled:
        break;
    }
  }

  private onSearchPerformed(status: ForwardSearchStatus) {
    switch (status) {
      case ForwardSearchStatus.Success:
        break;
      case ForwardSearchStatus.Error:
        vscode.window.showErrorMessage(FORWARD_SEARCH_ERROR_MESSAGE);
        break;
      case ForwardSearchStatus.Unconfigured:
        vscode.window.showInformationMessage(
          FORWARD_SEARCH_UNCONFIGURED_MESSAGE,
        );
        break;
    }
  }

  private drawStatusBarItem(
    text: string,
    tooltip: string,
    color: vscode.ThemeColor,
  ) {
    this.statusBarItem.text = `$(beaker) ${text}`;
    this.statusBarItem.tooltip = tooltip;
    this.statusBarItem.color = color;
  }
}

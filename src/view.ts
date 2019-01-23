import { Observable, Subscription } from 'rxjs';
import * as vscode from 'vscode';
import { State } from 'vscode-languageclient';
import { BuildStatus, ForwardSearchStatus } from './protocol';

export type ViewStatus =
  | { type: 'server'; status: State }
  | { type: 'build'; status: BuildStatus }
  | { type: 'search'; status: ForwardSearchStatus };

abstract class Colors {
  public static NORMAL = new vscode.ThemeColor('statusBar.foreground');
  public static ERROR = new vscode.ThemeColor('errorForeground');
}

abstract class Messages {
  public static SERVER_RUNNING = 'TexLab is running...';

  public static SERVER_STOPPED = 'TexLab has stopped working!';

  public static BUILD_ERROR =
    'A build error occured. Please check the problems tab \
    and the build log for further information.';

  public static BUILD_FAILURE =
    'An error occured while executing the configured LaTeX build tool.';

  public static SEARCH_ERROR =
    'An error occured while executing the configured PDF viewer. \
    Please see the README of this extension and the PDF viewer for further information.';

  public static SEARCH_UNCONFIGURED =
    'The forward search feature is not configured. Please see the README for instructions.';
}

export class View {
  private statusBarItem: vscode.StatusBarItem;
  private subscription: Subscription;

  constructor(statusStream: Observable<ViewStatus>) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
    );

    this.subscription = statusStream.subscribe(x => {
      switch (x.type) {
        case 'server':
          this.onServerStateChanged(x.status);
          break;
        case 'build':
          this.onBuildFinished(x.status);
          break;
        case 'search':
          this.onSearchPerformed(x.status);
          break;
      }
    });
  }

  public show() {
    this.statusBarItem.show();
  }

  public dispose() {
    this.statusBarItem.dispose();
    this.subscription.unsubscribe();
  }

  private onServerStateChanged(state: State) {
    switch (state) {
      case State.Running:
        this.drawStatusBarItem('', Messages.SERVER_RUNNING);
        break;
      case State.Stopped:
        this.drawStatusBarItem('', Messages.SERVER_STOPPED, Colors.ERROR);
        break;
    }
  }

  private onBuildFinished(status: BuildStatus) {
    switch (status) {
      case BuildStatus.Success:
        break;
      case BuildStatus.Error:
        vscode.window.showErrorMessage(Messages.BUILD_ERROR);
        break;
      case BuildStatus.Failure:
        vscode.window.showErrorMessage(Messages.BUILD_FAILURE);
        break;
    }
  }

  private onSearchPerformed(status: ForwardSearchStatus) {
    switch (status) {
      case ForwardSearchStatus.Success:
        break;
      case ForwardSearchStatus.Error:
        vscode.window.showErrorMessage(Messages.SEARCH_ERROR);
        break;
      case ForwardSearchStatus.Unconfigured:
        vscode.window.showInformationMessage(Messages.SEARCH_UNCONFIGURED);
        break;
    }
  }

  private drawStatusBarItem(
    text: string,
    tooltip: string,
    color: vscode.ThemeColor = Colors.NORMAL,
  ) {
    this.statusBarItem.text = `$(beaker) ${text}`;
    this.statusBarItem.tooltip = tooltip;
    this.statusBarItem.color = color;
  }
}

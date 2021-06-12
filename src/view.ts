import * as vscode from 'vscode';

export abstract class Messages {
  public static SERVER_RUNNING = 'TexLab is running...';

  public static SERVER_CANCEL_BUILD = 'Click to cancel the build.';

  public static SERVER_STOPPED = 'TexLab has stopped working!';

  public static SERVER_NOT_INSTALLED =
    'The TexLab language server is not installed. Do you want to install it?';

  public static SERVER_NOT_INSTALLED_OK = 'Download';

  public static SERVER_NOT_INSTALLED_CANCEL = 'Cancel';

  public static BUILD_ERROR =
    'A build error occured. Please check the problems tab \
    and the build log for further information.';

  public static BUILD_FAILURE =
    'An error occured while executing the configured LaTeX build tool.';

  public static SEARCH_ERROR =
    'An error occured after executing the configured previewer. \
    Please see the documentation of your previewer for further information.';

  public static SEARCH_FAILURE =
    'An error occured while executing the configured PDF viewer. \
    Please see the README of this extension and the PDF viewer for further information.';

  public static SEARCH_UNCONFIGURED =
    'The forward search feature is not configured. Please see the README for instructions.';

  public static DOWNLOAD_TITLE = 'Downloading TexLab server';

  public static DOWNLOAD_ERROR =
    'An error occured while downloading the TexLab language server.';
}

abstract class Colors {
  public static NORMAL = new vscode.ThemeColor('statusBar.foreground');
  public static ERROR = new vscode.ThemeColor('errorForeground');
}

export enum ExtensionState {
  Running,
  Building,
  Stopped,
}

export class StatusIcon {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
    );
    this.statusBarItem.show();
  }

  public dispose() {
    this.statusBarItem.dispose();
  }

  public update(state: ExtensionState) {
    switch (state) {
      case ExtensionState.Running:
        this.drawIcon(Messages.SERVER_RUNNING, Colors.NORMAL);
        break;
      case ExtensionState.Building:
        this.statusBarItem.text = `$(beaker) Building...`;
        this.statusBarItem.color = Colors.NORMAL;
        break;
      case ExtensionState.Stopped:
        this.drawIcon(Messages.SERVER_STOPPED, Colors.ERROR);
        break;
    }
  }

  private drawIcon(tooltip: string, color: vscode.ThemeColor) {
    this.statusBarItem.text = `$(beaker)`;
    this.statusBarItem.tooltip = tooltip;
    this.statusBarItem.color = color;
  }
}

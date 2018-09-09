import * as vscode from 'vscode';
import { LanguageClient, State, StateChangeEvent } from 'vscode-languageclient';

export class ServerIcon {
  private item: vscode.StatusBarItem;
  private subscription: vscode.Disposable | undefined;

  constructor(client: LanguageClient) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
    );
    this.item.text = '$(beaker)';
    this.subscription = client.onDidChangeState(this.onStateChanged, this);
  }

  public show() {
    this.item.show();
  }

  public dispose() {
    if (this.subscription) {
      this.subscription.dispose();
    }

    this.item.dispose();
  }

  private onStateChanged(event: StateChangeEvent) {
    if (event.newState === State.Running) {
      this.item.color = new vscode.ThemeColor('statusBar.foreground');
      this.item.tooltip = 'TexLab is running...';
    } else {
      this.item.color = new vscode.ThemeColor('errorForeground');
      this.item.tooltip = 'TexLab stopped working!';
    }
  }
}

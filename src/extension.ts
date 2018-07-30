import * as vscode from 'vscode';
import * as latex from './latex';
import { ProtocolClient } from './protocol';
import { isLatexFile } from './util';

export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('LaTeX');
  const client = new ProtocolClient(outputChannel);

  context.subscriptions.push(outputChannel);
  context.subscriptions.push(client);
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('latex.build', editor => {
      vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Window,
          title: 'Building...',
        },
        async () => {
          try {
            if (await latex.build(editor.document, outputChannel)) {
              vscode.window.setStatusBarMessage('Build succeeded', 5000);
            } else {
              vscode.window.setStatusBarMessage('Build failed', 5000);
            }
          } catch {
            vscode.window.showErrorMessage(
              'Could not start the configured LaTeX build tool.',
            );
          }
        },
      );
    }),
  );

  await client.start();
}

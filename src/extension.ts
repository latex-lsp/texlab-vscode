import * as vscode from 'vscode';
import { BuildResult, BuildTool } from './latex';
import { ProtocolClient } from './protocol';
import { isLatexFile } from './util';

export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('LaTeX');
  const buildTool = new BuildTool(outputChannel);
  const client = new ProtocolClient(outputChannel);

  context.subscriptions.push(outputChannel);
  context.subscriptions.push(client);
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('latex.build', editor =>
      buildDocument(buildTool, editor.document),
    ),
  );

  await client.start();
}

function buildDocument(buildTool: BuildTool, document: vscode.TextDocument) {
  if (!isLatexFile(document) || buildTool.isBuilding) {
    return;
  }

  // TODO: Resolve master file.

  vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Window,
      title: 'Building...',
    },
    async () => {
      switch (await buildTool.build(document)) {
        case BuildResult.Success:
          vscode.window.setStatusBarMessage('Build succeeded', 5000);
          break;
        case BuildResult.Error:
          vscode.window.setStatusBarMessage('Build failed', 5000);
          break;
        case BuildResult.Failure:
          vscode.window.showErrorMessage(
            'Could not start the configured LaTeX build tool.',
          );
          break;
      }
    },
  );
}

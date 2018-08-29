import * as vscode from 'vscode';
import { BuildResult, BuildTool } from './build';
import { ProtocolClient } from './protocol';

export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('LaTeX');
  const buildTool = new BuildTool(outputChannel);
  const client = new ProtocolClient(outputChannel);

  context.subscriptions.push(
    outputChannel,
    client,
    vscode.commands.registerTextEditorCommand('latex.build', editor =>
      buildDocument(client, buildTool, editor.document),
    ),
  );

  await client.start();
}

const HIDE_AFTER_TIMEOUT = 5000;

async function buildDocument(
  client: ProtocolClient,
  buildTool: BuildTool,
  document: vscode.TextDocument,
): Promise<void> {
  if (buildTool.isBuilding) {
    return;
  }

  const ancestor = await client.getAncestor(document.uri);
  if (ancestor.scheme !== 'file') {
    return;
  }

  return vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Window,
      title: 'Building...',
    },
    async () => {
      switch (await buildTool.build(ancestor)) {
        case BuildResult.Success:
          vscode.window.setStatusBarMessage(
            'Build succeeded',
            HIDE_AFTER_TIMEOUT,
          );
          break;
        case BuildResult.Error:
          vscode.window.setStatusBarMessage('Build failed', HIDE_AFTER_TIMEOUT);
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

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { BuildCommand, CancelBuildCommand } from './build';
import { ForwardSearchCommand } from './forwardSearch';
import { ProgressFeature } from './progress';
import { ExtensionView } from './view';

export async function activate(context: vscode.ExtensionContext) {
  const { ELECTRON_RUN_AS_NODE, ...env } = process.env;
  const client = new LanguageClient(
    'texlab',
    {
      command: 'java',
      args: ['-jar', context.asAbsolutePath('server/texlab.jar')],
      options: {
        env,
      },
    },
    {
      documentSelector: [
        { language: 'latex', scheme: 'file' },
        { language: 'bibtex', scheme: 'file' },
        { language: 'latex', scheme: 'untitled' },
        { language: 'bibtex', scheme: 'untitled' },
      ],
      outputChannelName: 'LaTeX',
      uriConverters: {
        code2Protocol: uri => uri.toString(true),
        protocol2Code: value => vscode.Uri.parse(value),
      },
    },
  );

  const buildCommand = new BuildCommand(client, {
    register: callback =>
      vscode.commands.registerTextEditorCommand('latex.build', callback),
  });

  const cancelBuildCommand = new CancelBuildCommand(
    {
      register: callback =>
        vscode.commands.registerCommand('latex.build.cancel', callback),
    },
    buildCommand.state,
  );

  const forwardSearchCommand = new ForwardSearchCommand(client, {
    register: callback =>
      vscode.commands.registerTextEditorCommand(
        'latex.forwardSearch',
        callback,
      ),
  });

  const view = new ExtensionView(client, buildCommand, forwardSearchCommand);

  client.registerFeatures([
    new ProgressFeature(client),
    buildCommand,
    cancelBuildCommand,
    forwardSearchCommand,
  ]);

  context.subscriptions.push(
    client.start(),
    buildCommand,
    cancelBuildCommand,
    forwardSearchCommand,
    view,
  );

  view.show();
  await client.onReady();
}

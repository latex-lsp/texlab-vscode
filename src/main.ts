import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { BuildFeature } from './build';
import { ForwardSearchFeature } from './forwardSearch';
import { ServerStatusFeature, SetStatusNotification } from './serverStatus';
import { ExtensionView } from './view';

export async function activate(context: vscode.ExtensionContext) {
  const client = new LanguageClient(
    'texlab',
    {
      command: 'java',
      args: ['-jar', context.asAbsolutePath('server/texlab.jar')],
    },
    {
      documentSelector: [
        { language: 'latex', scheme: 'file' },
        { language: 'bibtex', scheme: 'file' },
        { language: 'latex', scheme: 'untitled' },
        { language: 'bibtex', scheme: 'untitled' },
      ],
      outputChannelName: 'LaTeX',
    },
  );

  const buildFeature = new BuildFeature(client, {
    register: callback =>
      vscode.commands.registerTextEditorCommand('latex.build', callback),
  });

  const forwardSearchFeature = new ForwardSearchFeature(client, {
    register: callback =>
      vscode.commands.registerTextEditorCommand(
        'latex.forwardSearch',
        callback,
      ),
  });

  const serverStatusFeature = new ServerStatusFeature({
    register: callback =>
      client.onNotification(SetStatusNotification.type, callback),
  });

  const view = new ExtensionView(
    client,
    buildFeature,
    forwardSearchFeature,
    serverStatusFeature,
  );

  client.registerFeatures([
    buildFeature,
    forwardSearchFeature,
    serverStatusFeature,
  ]);

  context.subscriptions.push(
    client.start(),
    buildFeature,
    forwardSearchFeature,
    serverStatusFeature,
    view,
  );

  view.show();
  await client.onReady();
}

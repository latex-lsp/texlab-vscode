import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { BuildFeature } from './build';
import { ForwardSearchFeature } from './forwardSearch';
import { ServerStatusFeature } from './serverStatus';
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

  const buildFeature = new BuildFeature(client);
  const serverStatusFeature = new ServerStatusFeature(client);
  const forwardSearchFeature = new ForwardSearchFeature(client);
  const view = new ExtensionView(
    client,
    buildFeature,
    serverStatusFeature,
    forwardSearchFeature,
  );

  client.registerFeatures([
    buildFeature,
    serverStatusFeature,
    forwardSearchFeature,
  ]);
  context.subscriptions.push(
    client.start(),
    buildFeature,
    serverStatusFeature,
    forwardSearchFeature,
    view,
  );

  view.show();
  await client.onReady();
}

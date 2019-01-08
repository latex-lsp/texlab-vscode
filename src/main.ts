import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { BuildFeature } from './build';
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
      uriConverters: {
        code2Protocol: uri => uri.toString(true),
        protocol2Code: value => vscode.Uri.parse(value),
      },
    },
  );

  const buildFeature = new BuildFeature(client);
  const serverStatusFeature = new ServerStatusFeature(client);
  const view = new ExtensionView(client, buildFeature, serverStatusFeature);

  client.registerFeatures([buildFeature, serverStatusFeature]);
  context.subscriptions.push(
    client.start(),
    buildFeature,
    serverStatusFeature,
    view,
  );

  view.show();
  await client.onReady();
}

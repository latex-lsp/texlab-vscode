import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient';
import { BuildFeature } from './build';
import { StatusFeature } from './status';

export async function activate(context: vscode.ExtensionContext) {
  const serverOptions: ServerOptions = {
    command: 'java',
    args: ['-jar', context.asAbsolutePath('server/texlab.jar')],
  };
  const clientOptions: LanguageClientOptions = {
    documentSelector: ['latex'],
    outputChannelName: 'LaTeX',
    uriConverters: {
      code2Protocol: uri => uri.toString(true),
      protocol2Code: value => vscode.Uri.parse(value),
    },
  };
  const client = new LanguageClient('texlab', serverOptions, clientOptions);
  const statusFeature = new StatusFeature(client);
  const buildFeature = new BuildFeature(client, statusFeature);

  client.registerFeature(statusFeature);
  client.registerFeature(buildFeature);

  context.subscriptions.push(client.start(), statusFeature, buildFeature);
  await client.onReady();
}

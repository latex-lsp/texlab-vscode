import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient';
import { BuildFeature } from './build';
import { ServerIcon } from './status';

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
  const icon = new ServerIcon(client);
  const buildFeature = new BuildFeature(client);

  client.registerFeature(buildFeature);
  context.subscriptions.push(client.start(), buildFeature, icon);
  await client.onReady();
  icon.show();
}

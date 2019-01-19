import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { BuildFeature, CancelBuildFeature } from './build';
import { ForwardSearchFeature } from './forwardSearch';
import { ServerStatusFeature, SetStatusNotification } from './serverStatus';
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

  const buildFeature = new BuildFeature(client, {
    register: callback =>
      vscode.commands.registerTextEditorCommand('latex.build', callback),
  });

  const cancelBuildFeature = new CancelBuildFeature(
    {
      register: callback =>
        vscode.commands.registerCommand('latex.build.cancel', callback),
    },
    buildFeature.state,
  );

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
    cancelBuildFeature,
    forwardSearchFeature,
    serverStatusFeature,
  ]);

  context.subscriptions.push(
    client.start(),
    buildFeature,
    cancelBuildFeature,
    forwardSearchFeature,
    serverStatusFeature,
    view,
  );

  view.show();
  await client.onReady();
}

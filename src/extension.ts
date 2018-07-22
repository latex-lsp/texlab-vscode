import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  createClientPipeTransport,
  generateRandomPipeName,
  LanguageClient,
  LanguageClientOptions,
  MessageTransports,
  ServerOptions,
} from 'vscode-languageclient';
import * as latex from './latex';
import { DEBUG } from './util';

function generatePipeName(): string {
  if (DEBUG) {
    return process.platform === 'win32'
      ? '\\\\.\\pipe\\texlab'
      : path.join(os.tmpdir(), `texlab.sock`);
  }

  return generateRandomPipeName();
}

async function createServerStream(): Promise<MessageTransports> {
  const name = generatePipeName();
  const transport = await createClientPipeTransport(name);
  const streams = await transport.onConnected();
  return Promise.resolve({ reader: streams[0], writer: streams[1] });
}

function createLanguageClient(
  outputChannel: vscode.OutputChannel,
): LanguageClient {
  const serverOptions: ServerOptions = createServerStream;
  const clientOptions: LanguageClientOptions = {
    documentSelector: ['latex'],
    outputChannel,
    uriConverters: {
      code2Protocol: uri => uri.toString(true),
      protocol2Code: path => vscode.Uri.file(path),
    },
  };

  return new LanguageClient('texlab', serverOptions, clientOptions);
}

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('LaTeX');
  const client = createLanguageClient(outputChannel);

  context.subscriptions.push(outputChannel);
  context.subscriptions.push(client.start());
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
}

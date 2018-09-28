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
  State,
} from 'vscode-languageclient';
import { BuildFeature } from './build';
import DEBUG from './debug';
import { ServerIcon } from './status';

export async function activate(context: vscode.ExtensionContext) {
  const serverOptions: ServerOptions = createRpcPipe;
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

const RPC_DEBUG_NAME = 'texlab';

function generatePipeName(debugName: string): string {
  if (DEBUG) {
    return process.platform === 'win32'
      ? `\\\\.\\pipe\\${debugName}`
      : path.join(os.tmpdir(), `${debugName}.sock`);
  }

  return generateRandomPipeName();
}

async function createRpcPipe(): Promise<MessageTransports> {
  const name = generatePipeName(RPC_DEBUG_NAME);
  const transport = await createClientPipeTransport(name);
  const streams = await transport.onConnected();
  return { reader: streams[0], writer: streams[1] };
}

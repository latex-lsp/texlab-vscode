import { tmpdir } from 'os';
import { join } from 'path';
import * as vscode from 'vscode';
import {
  createClientPipeTransport,
  generateRandomPipeName,
  LanguageClient,
  LanguageClientOptions,
  MessageTransports,
  ServerOptions,
} from 'vscode-languageclient';

declare var v8debug: any;
const DEBUG = typeof v8debug === 'object' || startedInDebugMode();

function startedInDebugMode(): boolean {
  const args: string[] = (process as any).execArgv;
  if (args) {
    return args.some(
      arg =>
        /^--debug=?/.test(arg) ||
        /^--debug-brk=?/.test(arg) ||
        /^--inspect=?/.test(arg) ||
        /^--inspect-brk=?/.test(arg),
    );
  }

  return false;
}

function generatePipeName(): string {
  if (DEBUG) {
    return process.platform === 'win32'
      ? '\\\\.\\pipe\\texlab'
      : join(tmpdir(), `texlab.sock`);
  }

  return generateRandomPipeName();
}

async function createServerStream(): Promise<MessageTransports> {
  const name = generatePipeName();
  const transport = await createClientPipeTransport(name);
  const streams = await transport.onConnected();
  return Promise.resolve({ reader: streams[0], writer: streams[1] });
}

export function activate(context: vscode.ExtensionContext) {
  const serverOptions: ServerOptions = createServerStream;

  const clientOptions: LanguageClientOptions = {
    documentSelector: ['latex', 'tex'],
  };

  const client = new LanguageClient(
    'texlab',
    'TexLab',
    serverOptions,
    clientOptions,
  );
  context.subscriptions.push(client.start());
}

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
  TextDocumentIdentifier,
} from 'vscode-languageclient';
import DEBUG from './debug';

const RPC_DEBUG_NAME = 'texlab';

interface AncestorParams {
  textDocument: TextDocumentIdentifier;
}

interface AncestorResult {
  textDocument: TextDocumentIdentifier;
}

interface DidBuildTextDocumentParams {
  textDocument: TextDocumentIdentifier;
}

export class ProtocolClient {
  public readonly languageClient: LanguageClient;
  private subscription: vscode.Disposable | undefined;

  constructor(outputChannel: vscode.OutputChannel) {
    const serverOptions: ServerOptions = createRpcPipe;
    const clientOptions: LanguageClientOptions = {
      documentSelector: ['latex'],
      outputChannel,
      uriConverters: {
        code2Protocol: uri => uri.toString(true),
        protocol2Code: value => vscode.Uri.parse(value),
      },
    };

    this.languageClient = new LanguageClient(
      'texlab',
      serverOptions,
      clientOptions,
    );
  }

  public async start(): Promise<void> {
    this.subscription = this.languageClient.start();
    await this.languageClient.onReady();
  }

  public async getAncestor(uri: vscode.Uri): Promise<vscode.Uri> {
    const params: AncestorParams = {
      textDocument: {
        uri: this.languageClient.code2ProtocolConverter.asUri(uri),
      },
    };

    const result = await this.languageClient.sendRequest<AncestorResult>(
      'textDocument/getAncestor',
      params,
    );

    return this.languageClient.protocol2CodeConverter.asUri(
      result.textDocument.uri,
    );
  }

  public didBuild(uri: vscode.Uri) {
    const params: DidBuildTextDocumentParams = {
      textDocument: {
        uri: this.languageClient.code2ProtocolConverter.asUri(uri),
      },
    };

    this.languageClient.sendNotification('textDocument/didBuild', params);
  }

  public dispose() {
    if (this.subscription) {
      this.subscription.dispose();
    }
  }
}

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

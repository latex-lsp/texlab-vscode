import { createServer } from 'net';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';
import {
  createClientPipeTransport,
  generateRandomPipeName,
  MessageTransports,
} from 'vscode-languageclient';
import { DEBUG } from './util';

const RPC_DEBUG_NAME = 'texlab';
const PDF_DEBUG_NAME = 'texlab-pdf';

function generatePipeName(debugName: string): string {
  if (DEBUG) {
    return process.platform === 'win32'
      ? `\\\\.\\pipe\\${debugName}`
      : path.join(os.tmpdir(), `${debugName}.sock`);
  }

  return generateRandomPipeName();
}

interface ReadablePipeTransport {
  onConnected(): Promise<Readable>;
}

function createReadablePipe(name: string): Promise<ReadablePipeTransport> {
  let connectResolve;
  const connected = new Promise<Readable>(resolve => {
    connectResolve = resolve;
  });

  return new Promise<ReadablePipeTransport>((resolve, reject) => {
    const server = createServer(socket => {
      server.close();
      connectResolve(socket);
    });

    server.on('error', reject);
    server.listen(name, () => {
      server.removeListener('error', reject);
      resolve({
        onConnected: () => {
          return connected;
        },
      });
    });
  });
}

export async function createPdfPipe(): Promise<Readable> {
  const name = generatePipeName(PDF_DEBUG_NAME);
  const transport = await createReadablePipe(name);
  return transport.onConnected();
}

export async function createRpcPipe(): Promise<MessageTransports> {
  const name = generatePipeName(RPC_DEBUG_NAME);
  const transport = await createClientPipeTransport(name);
  const streams = await transport.onConnected();
  return { reader: streams[0], writer: streams[1] };
}

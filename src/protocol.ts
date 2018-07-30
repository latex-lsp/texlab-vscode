import { Option } from 'funfix-core';
import { Readable } from 'stream';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  Protocol2CodeConverter,
  ServerOptions,
} from 'vscode-languageclient';
import { createPdfPipe, createRpcPipe } from './pipe';

export interface PdfPageItem {
  index: number;
  width: number;
  height: number;
}

export interface PdfDocumentItem {
  uri: vscode.Uri;
  pages: PdfPageItem[];
}

export interface PdfViewport {
  uri: vscode.Uri;
  zoom: number;
  firstPage: number;
  lastPage: number;
}

export interface RenderedPdfPage {
  index: number;
  viewport: PdfViewport;
  bitmap: Uint8ClampedArray;
}

interface DidOpenPdfDocumentParams {
  uri: string;
}

interface DidClosePdfDocumentParams {
  uri: string;
}

interface DidChangePdfViewportParams {
  viewport: any;
}

interface RenderPdfPageParams {
  index: number;
  width: number;
  height: number;
  viewport: any;
}

class BufferReader {
  private _position: number;

  public get position(): number {
    return this._position;
  }

  constructor(private buffer: Buffer) {
    this._position = 0;
  }

  public readInt32(): Option<number> {
    return this.read(x => this.buffer.readInt32LE(x), 4);
  }

  public readInt64(): Option<number> {
    return this.read(x => this.buffer.readIntLE(x, 8), 8);
  }

  public readDouble(): Option<number> {
    return this.read(x => this.buffer.readDoubleLE(x), 8);
  }

  public readBytes(length: number): Option<Buffer> {
    return this.read(x => this.buffer.slice(x, x + length), length);
  }

  public readString(): Option<string> {
    return this.readLEB128()
      .chain(x => this.readBytes(x))
      .map(x => x.toString());
  }

  private readLEB128(): Option<number> {
    const highestBitSet = x => (x & 0x80) === 0x80;

    let result = Option.some(0);
    let currentByte: Option<number>;
    let count = 0;

    do {
      currentByte = this.read(x => this.buffer.readUInt8(x), 1);
      result = Option.map2(
        result,
        currentByte,
        (x, y) => x | ((y & 0x7f) << (count * 7)),
      );
      count++;
    } while (currentByte.exists(highestBitSet));

    return result.filter(x => !highestBitSet(x));
  }

  private read<T>(extractor: (offset: number) => T, size: number): Option<T> {
    if (this._position + size > this.buffer.byteLength) {
      return Option.none();
    }

    const data = extractor(this._position);
    this._position += size;
    return Option.some(data);
  }
}

class PdfPageStream {
  private readonly emitter: vscode.EventEmitter<RenderedPdfPage>;
  private stream: Readable;
  private buffer: Buffer;

  public get onRendered(): vscode.Event<RenderedPdfPage> {
    return this.emitter.event;
  }

  constructor(private protocol2Code: Protocol2CodeConverter) {
    this.emitter = new vscode.EventEmitter<RenderedPdfPage>();
    this.buffer = Buffer.from([]);
  }

  public async listen(): Promise<void> {
    this.stream = await createPdfPipe();
    this.stream.addListener('data', this.onDataReceived.bind(this));
  }

  public dispose() {
    this.emitter.dispose();
    this.stream.removeAllListeners();
  }

  private onDataReceived(data: Buffer) {
    this.buffer = Buffer.concat(
      [this.buffer, data],
      this.buffer.length + data.length,
    );
    const reader = new BufferReader(this.buffer);
    const page = this.parse(reader);
    if (page.nonEmpty()) {
      this.emitter.fire(page.value);
      this.buffer = this.buffer.slice(reader.position);
    }
  }

  private parse(reader: BufferReader): Option<RenderedPdfPage> {
    return Option.map3(
      reader.readInt32(),
      this.parseViewport(reader),
      this.parseBitmap(reader),
      (index, viewport, bitmap): RenderedPdfPage => ({
        index,
        viewport,
        bitmap,
      }),
    );
  }

  private parseViewport(reader: BufferReader): Option<PdfViewport> {
    return Option.map4(
      reader.readString(),
      reader.readDouble(),
      reader.readInt32(),
      reader.readInt32(),
      (uri, zoom, firstPage, lastPage) => ({
        uri: this.protocol2Code.asUri(uri),
        zoom,
        firstPage,
        lastPage,
      }),
    );
  }

  private parseBitmap(reader: BufferReader): Option<Uint8ClampedArray> {
    return reader
      .readInt32()
      .chain(x => reader.readBytes(x))
      .map(x => new Uint8ClampedArray(x));
  }
}

export class ProtocolClient {
  private readonly client: LanguageClient;
  private stream: PdfPageStream;
  private disposable: vscode.Disposable;

  public get onPdfPageRendered(): vscode.Event<RenderedPdfPage> {
    return this.stream.onRendered;
  }

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

    this.client = new LanguageClient('texlab', serverOptions, clientOptions);
    this.stream = new PdfPageStream(this.client.protocol2CodeConverter);
  }

  public async start(): Promise<void> {
    this.disposable = this.client.start();
    await Promise.all([this.client.onReady(), this.stream.listen()]);
  }

  public async openPdfDocument(uri: vscode.Uri): Promise<PdfDocumentItem> {
    const params: DidOpenPdfDocumentParams = {
      uri: this.client.code2ProtocolConverter.asUri(uri),
    };

    const document = await this.client.sendRequest<any>(
      'pdfDocument/didOpen',
      params,
    );
    return {
      ...document,
      uri: this.client.protocol2CodeConverter.asUri(document.uri),
    };
  }

  public closePdfDocument(uri: vscode.Uri) {
    const params: DidClosePdfDocumentParams = {
      uri: this.client.code2ProtocolConverter.asUri(uri),
    };

    this.client.sendNotification('pdfDocument/didClose', params);
  }

  public changePdfViewport(viewport: PdfViewport) {
    const params: DidChangePdfViewportParams = {
      viewport: {
        ...viewport,
        uri: this.client.code2ProtocolConverter.asUri(viewport.uri),
      },
    };

    this.client.sendNotification('pdfDocument/didChangeViewport', params);
  }

  public renderPdfPage(
    index: number,
    width: number,
    height: number,
    viewport: PdfViewport,
  ) {
    const params: RenderPdfPageParams = {
      index,
      width,
      height,
      viewport: {
        ...viewport,
        uri: this.client.code2ProtocolConverter.asUri(viewport.uri),
      },
    };

    this.client.sendNotification('pdfDocument/renderPage', params);
  }

  public dispose() {
    this.stream.dispose();
    this.disposable.dispose();
  }
}

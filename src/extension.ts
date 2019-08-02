import * as fs from 'fs';
import * as os from 'os';
import * as request from 'request';
import * as tar from 'tar';
import * as unzipper from 'unzipper';
import * as util from 'util';
import * as vscode from 'vscode';
import { Proposed, ServerOptions } from 'vscode-languageclient';
import {
  BuildStatus,
  ForwardSearchStatus,
  LatexLanguageClient,
} from './client';
import {
  BIBTEX_FILE,
  BIBTEX_UNTITLED,
  LATEX_FILE,
  LATEX_UNTITLED,
} from './selectors';
import { Messages, StatusIcon } from './view';

export async function activate(context: vscode.ExtensionContext) {
  const serverPath = getServerPath(context);
  if (!fs.existsSync(serverPath)) {
    await vscode.window.withProgress(
      {
        title: Messages.DOWNLOAD_TITLE,
        location: vscode.ProgressLocation.Window,
        cancellable: false,
      },
      async () => {
        try {
          await downloadServer(context);
        } catch {
          vscode.window.showErrorMessage(Messages.DOWNLOAD_ERROR);
        }
      },
    );
  }

  const serverOptions = getServerOptions(serverPath);
  const client = new LatexLanguageClient('texlab', serverOptions, {
    documentSelector: [
      LATEX_FILE,
      LATEX_UNTITLED,
      BIBTEX_FILE,
      BIBTEX_UNTITLED,
    ],
    outputChannelName: 'LaTeX',
    uriConverters: {
      code2Protocol: uri => uri.toString(true),
      protocol2Code: value => vscode.Uri.parse(value),
    },
  });

  const icon = new StatusIcon();

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('latex.build', editor =>
      build(editor, client),
    ),
    vscode.commands.registerCommand('latex.build.cancel', () =>
      client.sendNotification(Proposed.ProgressCancelNotification.type, {
        id: 'texlab-build-*',
      }),
    ),
    vscode.commands.registerTextEditorCommand('latex.forwardSearch', editor =>
      forwardSearch(editor, client),
    ),
    client.onDidChangeState(({ newState }) => {
      icon.update(newState);
    }),
    client.start(),
    icon,
  );
}

function getServerPath(context: vscode.ExtensionContext): string {
  const name = os.platform() === 'win32' ? 'texlab.exe' : 'texlab';
  return context.asAbsolutePath(`./server/${name}`);
}

function getServerOptions(serverPath: string): ServerOptions {
  const { ELECTRON_RUN_AS_NODE, ...env } = process.env;
  return {
    run: {
      command: serverPath,
      options: {
        env,
      },
    },
    debug: {
      command: serverPath,
      args: ['-vvvv'],
      options: {
        env: {
          ...env,
          RUST_BACKTRACE: '1',
        },
      },
    },
  };
}

async function downloadServer(context: vscode.ExtensionContext): Promise<void> {
  const packageManifest = JSON.parse(
    await util.promisify(fs.readFile)(
      context.asAbsolutePath('package.json'),
      'utf-8',
    ),
  );
  const url = packageManifest.languageServer[os.platform()];
  const path = context.asAbsolutePath('server');
  const extract =
    os.platform() === 'win32'
      ? () => unzipper.Extract({ path })
      : () => tar.x({ C: path });

  return new Promise((resolve, reject) => {
    request(url)
      .pipe(extract())
      .on('close', () => resolve())
      .on('error', () => reject());
  });
}

async function build(
  { document }: vscode.TextEditor,
  client: LatexLanguageClient,
): Promise<void> {
  if (
    vscode.languages.match([LATEX_FILE, BIBTEX_FILE], document) <= 0 ||
    (document.isDirty && !(await document.save()))
  ) {
    return;
  }

  const result = await client.build(document);
  switch (result.status) {
    case BuildStatus.Success:
    case BuildStatus.Cancelled:
      break;
    case BuildStatus.Error:
      vscode.window.showErrorMessage(Messages.BUILD_ERROR);
      break;
    case BuildStatus.Failure:
      vscode.window.showErrorMessage(Messages.BUILD_FAILURE);
      break;
  }
}

async function forwardSearch(
  { document, selection }: vscode.TextEditor,
  client: LatexLanguageClient,
): Promise<void> {
  if (vscode.languages.match(LATEX_FILE, document) <= 0) {
    return;
  }

  const result = await client.forwardSearch(document, selection.start);
  switch (result.status) {
    case ForwardSearchStatus.Success:
      break;
    case ForwardSearchStatus.Error:
    case ForwardSearchStatus.Failure:
      vscode.window.showErrorMessage(Messages.SEARCH_FAILURE);
      break;
    case ForwardSearchStatus.Unconfigured:
      vscode.window.showInformationMessage(Messages.SEARCH_UNCONFIGURED);
      break;
  }
}

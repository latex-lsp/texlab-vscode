import * as os from 'os';
import * as vscode from 'vscode';
import { ServerOptions } from 'vscode-languageclient';
import { BuildEngine } from './build';
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

export function activate(context: vscode.ExtensionContext) {
  const serverOptions = getServerOptions(context);
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
  const buildEngine = new BuildEngine(client);

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('latex.build', editor =>
      build(editor, buildEngine),
    ),
    vscode.commands.registerTextEditorCommand('latex.forwardSearch', editor =>
      forwardSearch(editor, client),
    ),
    client.onDidChangeState(({ newState }) => {
      icon.update(newState);
    }),
    client.start(),
    buildEngine,
    icon,
  );
}

function getServerOptions(context: vscode.ExtensionContext): ServerOptions {
  const name = os.platform() === 'win32' ? 'texlab.exe' : 'texlab';
  const command = context.asAbsolutePath(`./server/${name}`);
  const { ELECTRON_RUN_AS_NODE, ...env } = process.env;
  return {
    run: {
      command,
      options: {
        env,
      },
    },
    debug: {
      command,
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

async function build(
  { document }: vscode.TextEditor,
  buildEngine: BuildEngine,
): Promise<void> {
  if (vscode.languages.match([LATEX_FILE, BIBTEX_FILE], document) <= 0) {
    return;
  }

  const result = await buildEngine.build(document);
  if (result === undefined) {
    return;
  }

  switch (result.status) {
    case BuildStatus.Success:
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

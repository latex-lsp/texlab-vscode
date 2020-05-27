import { sync as commandExists } from 'command-exists';
import * as fs from 'fs';
import * as os from 'os';
import * as request from 'request';
import * as tar from 'tar';
import * as unzipper from 'unzipper';
import * as util from 'util';
import * as vscode from 'vscode';
import {
  ServerOptions,
  WorkDoneProgressCancelNotification,
  State,
} from 'vscode-languageclient';
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
import { Messages, StatusIcon, ExtensionState } from './view';

export async function activate(context: vscode.ExtensionContext) {
  const serverConfig = vscode.workspace.getConfiguration('latex.server');
  const serverCommand = await findOrInstallServer(context, serverConfig);
  if (serverCommand === undefined) {
    return;
  }

  const serverOptions = getServerOptions(serverCommand, serverConfig);
  const icon = new StatusIcon();
  const client = new LatexLanguageClient(
    'texlab',
    serverOptions,
    {
      documentSelector: [
        LATEX_FILE,
        LATEX_UNTITLED,
        BIBTEX_FILE,
        BIBTEX_UNTITLED,
      ],
      outputChannelName: 'LaTeX',
      uriConverters: {
        code2Protocol: (uri) => uri.toString(true),
        protocol2Code: (value) => vscode.Uri.parse(value),
      },
    },
    icon,
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('latex.build', (editor) =>
      build(editor, client),
    ),
    vscode.commands.registerCommand('latex.build.cancel', () =>
      client.sendNotification(WorkDoneProgressCancelNotification.type, {
        token: 'texlab-build-*',
      }),
    ),
    vscode.commands.registerTextEditorCommand('latex.forwardSearch', (editor) =>
      forwardSearch(editor, client),
    ),
    client.onDidChangeState(({ newState }) => {
      icon.update(
        newState === State.Running
          ? ExtensionState.Running
          : ExtensionState.Stopped,
      );
    }),
    client.start(),
    icon,
  );
}

function getServerOptions(
  serverCommand: string,
  serverConfig: vscode.WorkspaceConfiguration,
): ServerOptions {
  const trace = serverConfig.get<boolean>('trace');
  const logFilePath = serverConfig.get<string | undefined>('logFile');
  const args = [];
  if (trace) {
    args.push('-vvvv');
  }
  if (logFilePath) {
    args.push('--log-file');
    args.push(logFilePath);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ELECTRON_RUN_AS_NODE, ...env } = process.env;
  return {
    run: {
      command: serverCommand,
      args,
      options: {
        env,
      },
    },
    debug: {
      command: serverCommand,
      args,
      options: {
        env: {
          ...env,
          RUST_BACKTRACE: '1',
        },
      },
    },
  };
}

async function findOrInstallServer(
  context: vscode.ExtensionContext,
  serverConfig: vscode.WorkspaceConfiguration,
): Promise<string | undefined> {
  const serverName = os.platform() === 'win32' ? 'texlab.exe' : 'texlab';
  const localServerPath = context.asAbsolutePath(`server/${serverName}`);
  if (fs.existsSync(localServerPath)) {
    return localServerPath;
  }

  if (commandExists(serverName)) {
    return serverName;
  }

  return (await installServer(context, serverConfig))
    ? localServerPath
    : undefined;
}

async function installServer(
  context: vscode.ExtensionContext,
  serverConfig: vscode.WorkspaceConfiguration,
): Promise<boolean> {
  const autoDownload = serverConfig.get<boolean>('autoDownload');

  let selection: string | undefined;
  if (!autoDownload) {
    selection = await vscode.window.showInformationMessage(
      Messages.SERVER_NOT_INSTALLED,
      Messages.SERVER_NOT_INSTALLED_OK,
      Messages.SERVER_NOT_INSTALLED_CANCEL,
    );
  }

  if (autoDownload || selection === Messages.SERVER_NOT_INSTALLED_OK) {
    serverConfig.update(
      'autoDownload',
      true,
      vscode.ConfigurationTarget.Global,
    );

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
          return false;
        }
      },
    );
  } else {
    return false;
  }

  return true;
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

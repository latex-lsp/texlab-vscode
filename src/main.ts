import { merge } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import * as vscode from 'vscode';
import { LanguageClient, StateChangeEvent } from 'vscode-languageclient';
import { BuildEngine } from './build';
import {
  filterDocument,
  fromCommand,
  fromEvent,
  fromTextEditorCommand,
} from './observable';
import { ProgressFeature } from './progress';
import { forwardSearch, ForwardSearchStatus } from './protocol';
import {
  BIBTEX_FILE,
  BIBTEX_UNTITLED,
  LATEX_FILE,
  LATEX_UNTITLED,
} from './selectors';
import { View, ViewStatus } from './view';

export async function activate(context: vscode.ExtensionContext) {
  const { subscriptions } = context;
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
    },
  );

  client.registerFeature(new ProgressFeature(client));

  const buildEngine = new BuildEngine(
    client,
    fromTextEditorCommand('latex.build', subscriptions),
    fromCommand('latex.build.cancel', subscriptions),
  );

  const forwardSearchStatusStream = fromTextEditorCommand(
    'latex.forwardSearch',
    subscriptions,
  ).pipe(
    filterDocument(LATEX_FILE),
    flatMap(({ document, selection }) =>
      forwardSearch(client, document, selection.start),
    ),
    map<ForwardSearchStatus, ViewStatus>(status => ({
      type: 'search',
      status,
    })),
  );

  const serverStateStream = fromEvent(
    client.onDidChangeState,
    subscriptions,
  ).pipe(
    map<StateChangeEvent, ViewStatus>(({ newState }) => ({
      type: 'server',
      status: newState,
    })),
  );

  const viewStatusStream = merge(
    buildEngine.statusStream,
    forwardSearchStatusStream,
    serverStateStream,
  );

  const view = new View(viewStatusStream);
  subscriptions.push(client.start(), buildEngine, view);
  view.show();

  await client.onReady();
}

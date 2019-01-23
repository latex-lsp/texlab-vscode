import { merge, Observable } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import * as vscode from 'vscode';
import { LanguageClient, State } from 'vscode-languageclient';
import { BuildEngine } from './build';
import {
  filterDocument,
  fromCommand,
  fromTextEditorCommand,
  skipNull,
} from './observable';
import { ProgressFeature } from './progress';
import { BuildStatus, forwardSearch, ForwardSearchStatus } from './protocol';
import {
  BIBTEX_FILE,
  BIBTEX_UNTITLED,
  LATEX_FILE,
  LATEX_UNTITLED,
} from './selectors';
import { View, ViewStatus } from './view';

export function activate(context: vscode.ExtensionContext) {
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

  const buildEngine = new BuildEngine(client);
  const view = new View();

  let subscriptions: vscode.Disposable[] = [];
  client.onDidChangeState(({ newState }) => {
    switch (newState) {
      case State.Running:
        view.subscribe(createStatusStream(client, buildEngine, subscriptions));
        break;
      case State.Stopped:
        view.unsubscribe();
        subscriptions.forEach(x => x.dispose());
        subscriptions = [];
        break;
    }
  });

  context.subscriptions.push(client.start(), view);
}

function createStatusStream(
  client: LanguageClient,
  buildEngine: BuildEngine,
  subscriptions: vscode.Disposable[],
): Observable<ViewStatus> {
  const buildStatusStream = fromTextEditorCommand(
    'latex.build',
    subscriptions,
  ).pipe(
    filterDocument([LATEX_FILE, BIBTEX_FILE]),
    flatMap(({ document }) => buildEngine.build(document)),
    skipNull(),
    map<BuildStatus, ViewStatus>(status => ({ type: 'build', status })),
  );

  const subscription = fromCommand(
    'latex.build.cancel',
    subscriptions,
  ).subscribe(() => buildEngine.cancel());

  subscriptions.push(new vscode.Disposable(() => subscription.unsubscribe()));

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

  return merge(buildStatusStream, forwardSearchStatusStream);
}

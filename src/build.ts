import { Observable, Subscription } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import * as vscode from 'vscode';
import { CancellationTokenSource, LanguageClient } from 'vscode-languageclient';
import { filterDocument, skipNull } from './observable';
import { build, BuildStatus } from './protocol';
import { BIBTEX_FILE, LATEX_FILE } from './selectors';
import { ViewStatus } from './view';

export class BuildEngine {
  private isBuilding: boolean = false;
  private cancellationTokenSource?: CancellationTokenSource;
  private subscription: Subscription;

  public get statusStream(): Observable<ViewStatus> {
    return this.buildCommandStream.pipe(
      filterDocument([LATEX_FILE, BIBTEX_FILE]),
      flatMap(({ document }) => this.build(document)),
      skipNull(),
      map<BuildStatus, ViewStatus>(status => ({ type: 'build', status })),
    );
  }

  constructor(
    private client: LanguageClient,
    private buildCommandStream: Observable<vscode.TextEditor>,
    cancelCommandStream: Observable<any>,
  ) {
    this.subscription = cancelCommandStream.subscribe(() => this.cancel());
  }

  public dispose() {
    if (this.cancellationTokenSource) {
      this.cancellationTokenSource.dispose();
    }

    this.subscription.unsubscribe();
  }

  private async build(
    document: vscode.TextDocument,
  ): Promise<BuildStatus | undefined> {
    if (this.isBuilding || (document.isDirty && !(await document.save()))) {
      return undefined;
    }

    this.isBuilding = true;
    this.cancellationTokenSource = new CancellationTokenSource();

    try {
      return build(this.client, document, this.cancellationTokenSource.token);
    } catch {
      return undefined;
    } finally {
      this.isBuilding = false;
    }
  }

  private cancel() {
    if (this.isBuilding && this.cancellationTokenSource) {
      this.cancellationTokenSource.cancel();
      this.cancellationTokenSource = undefined;
    }
  }
}

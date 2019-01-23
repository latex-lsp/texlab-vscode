import * as vscode from 'vscode';
import { CancellationTokenSource, LanguageClient } from 'vscode-languageclient';
import { build, BuildStatus } from './protocol';

export class BuildEngine {
  private isBuilding: boolean = false;
  private cancellationTokenSource?: CancellationTokenSource;

  constructor(private client: LanguageClient) {}

  public dispose() {
    if (this.cancellationTokenSource) {
      this.cancellationTokenSource.dispose();
    }
  }

  public async build(
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

  public cancel() {
    if (this.isBuilding && this.cancellationTokenSource) {
      this.cancellationTokenSource.cancel();
      this.cancellationTokenSource = undefined;
    }
  }
}

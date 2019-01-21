import * as vscode from 'vscode';
import {
  BaseLanguageClient,
  ClientCapabilities,
  NotificationType,
  StaticFeature,
} from 'vscode-languageclient';

interface ProgressClientCapabilities {
  /**
   * Experimental client capabilities.
   */
  experimental: {
    /**
     * The client has support for reporting progress.
     */
    progress?: boolean;
  };
}

interface ProgressParams {
  /**
   * A unique identifier to associate multiple progress notifications with the same progress.
   */
  id: string;

  /**
   * Mandatory title of the progress operation. Used to briefly inform about
   * the kind of operation being performed.
   * Examples: "Indexing" or "Linking dependencies".
   */
  title: string;

  /**
   * Optional, more detailed associated progress message. Contains
   * complementary information to the `title`.
   * Examples: "3/25 files", "project/src/module2", "node_modules/some_dep".
   * If unset, the previous progress message (if any) is still valid.
   */
  message?: string;

  /**
   * Optional progress percentage to display (value 100 is considered 100%).
   * If unset, the previous progress percentage (if any) is still valid.
   */
  percentage?: number;

  /**
   * Set to true on the final progress update.
   * No more progress notifications with the same ID should be sent.
   */
  done?: boolean;
}

abstract class ProgressNotification {
  public static type = new NotificationType<ProgressParams, void>(
    'window/progress',
  );
}

export class ProgressFeature implements StaticFeature {
  private progresses = new Map<string, Progress>();

  constructor(private client: BaseLanguageClient) {}

  public fillClientCapabilities(capabilities: ClientCapabilities): void {
    capabilities.experimental = capabilities.experimental || {};
    const progressCapabilities = capabilities as ProgressClientCapabilities;
    progressCapabilities.experimental.progress = true;
  }

  public initialize(): void {
    const handler = (params: ProgressParams) => {
      let progress = this.progresses.get(params.id);
      if (progress !== undefined) {
        progress.update(params);
      } else {
        vscode.window.withProgress(
          { location: vscode.ProgressLocation.Window },
          p => {
            progress = new Progress(p);
            this.progresses.set(params.id, progress);

            progress.update(params);
            return progress.promise;
          },
        );
      }

      if (params.done && progress !== undefined) {
        progress.finish();
        this.progresses.delete(params.id);
      }
    };

    this.client.onNotification(ProgressNotification.type, handler);
  }
}

class Progress {
  public promise: Promise<void>;
  private resolve:
    | ((value?: void | PromiseLike<void> | undefined) => void)
    | undefined;
  private reject: ((reason?: any) => void) | undefined;

  private progress: vscode.Progress<{ message?: string }>;

  private title: string | undefined;
  private message: string | undefined;

  constructor(progress: vscode.Progress<{ message?: string }>) {
    this.progress = progress;

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  public update(params: ProgressParams) {
    this.title = params.title;
    this.message = params.message || this.message;

    const details = this.message ? ` (${this.message})` : '';
    this.progress.report({ message: `${this.title}${details}` });
  }

  public finish() {
    if (this.resolve) {
      this.resolve();
    }
  }

  public cancel() {
    if (this.reject) {
      this.reject();
    }
  }
}

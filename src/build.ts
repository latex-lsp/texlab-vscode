import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

export enum BuildResult {
  Success,
  Error,
  Failure,
}

export class BuildTool {
  private _isBuilding: boolean;

  public get isBuilding() {
    return this._isBuilding;
  }

  constructor(private outputChannel: vscode.OutputChannel) {
    this._isBuilding = false;
  }

  public async build(uri: vscode.Uri): Promise<BuildResult> {
    if (this.isBuilding) {
      return BuildResult.Error;
    }
    this._isBuilding = true;

    const config = vscode.workspace.getConfiguration('latex.build');
    const executable = config.get<string>('executable')!;
    const args = config.get<string[]>('arguments')!;
    const process = cp.spawn(executable, args.concat(uri.fsPath), {
      cwd: path.dirname(uri.fsPath),
    });

    this.outputChannel.clear();
    this.outputChannel.show();
    process.stdout.on('data', this.appendOutput.bind(this));
    process.stderr.on('data', this.appendOutput.bind(this));

    const result = await this.waitForExit(process);
    this._isBuilding = false;
    return result;
  }

  private appendOutput(chunk: string | Buffer) {
    this.outputChannel.append(chunk.toString());
  }

  private waitForExit(process: cp.ChildProcess): Promise<BuildResult> {
    return new Promise(resolve => {
      process.on('error', () => resolve(BuildResult.Failure));
      process.on('exit', exitCode =>
        resolve(exitCode === 0 ? BuildResult.Success : BuildResult.Error),
      );
    });
  }
}

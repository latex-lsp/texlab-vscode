import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

let isBuilding: boolean = false;

export async function build(
  document: vscode.TextDocument,
  outputChannel: vscode.OutputChannel,
): Promise<boolean> {
  async function run() {
    if (
      document.uri.scheme !== 'file' ||
      (document.isDirty && !(await document.save()))
    ) {
      return;
    }

    const config = vscode.workspace.getConfiguration('latex.build');
    const executable = config.get<string>('executable');
    const args = config.get<string[]>('arguments').concat(document.fileName);

    const process = cp.spawn(executable, args, {
      cwd: path.dirname(document.fileName),
    });

    outputChannel.clear();
    outputChannel.show();
    const appendOutput = (chunk: string | Buffer) =>
      outputChannel.append(chunk.toString());
    process.stdout.on('data', appendOutput);
    process.stderr.on('data', appendOutput);

    return new Promise<boolean>((resolve, reject) => {
      process.addListener('error', reject);
      process.on('exit', exitCode => {
        resolve(exitCode === 0);
      });
    });
  }

  if (!isBuilding) {
    isBuilding = true;
    try {
      return await run();
    } finally {
      isBuilding = false;
    }
  }
}

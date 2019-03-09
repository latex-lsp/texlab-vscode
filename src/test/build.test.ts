import { assert } from 'chai';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { activate, load, sleep } from './utility';

describe('build', () => {
  before(activate);

  it('should be able to report build warnings', async () => {
    const pdf = `${vscode.workspace.rootPath}/build-error/main.pdf`;
    if (fs.existsSync(pdf)) {
      fs.unlinkSync(pdf);
    }

    const uri = await load('build-error/main.tex');
    const doc = await vscode.window.showTextDocument(uri);
    vscode.commands.executeCommand('latex.build', doc);
    await sleep(10);
    const diagnostics = vscode.languages.getDiagnostics(uri);
    assert.lengthOf(diagnostics, 1);
    assert.strictEqual(
      diagnostics[0].message,
      'Overfull \\hbox (757.50221pt too wide) in paragraph at lines 4--5',
    );
  });
});

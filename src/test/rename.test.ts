import { assert } from 'chai';
import * as vscode from 'vscode';
import { activate, load } from './utility';

interface Spec {
  file: string;
  line: number;
  character: number;
  newName: string;
  expected: vscode.TextEdit[];
}

describe('rename', () => {
  before(activate);

  async function run({ file, line, character, newName, expected }: Spec) {
    const uri = await load(file);
    const position = new vscode.Position(line, character);
    const actual = (await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
      'vscode.executeDocumentRenameProvider',
      uri,
      position,
      newName,
    ))!.get(uri);

    assert.lengthOf(actual, expected.length);
    for (let i = 0; i < expected.length; i++) {
      assert.deepEqual(actual[i].range, expected[i].range);
      assert.strictEqual(actual[i].newText, expected[i].newText);
    }
  }

  it('should provide rename support for environments', async () => {
    await run({
      file: 'rename-environment/main.tex',
      line: 0,
      character: 7,
      newName: 'bar',
      expected: [
        new vscode.TextEdit(new vscode.Range(0, 7, 0, 10), 'bar'),
        new vscode.TextEdit(new vscode.Range(1, 5, 1, 8), 'bar'),
      ],
    });
  });

  it('should provide rename support for labels', async () => {
    await run({
      file: 'rename-label/main.tex',
      line: 2,
      character: 5,
      newName: 'baz',
      expected: [
        new vscode.TextEdit(new vscode.Range(0, 7, 0, 10), 'baz'),
        new vscode.TextEdit(new vscode.Range(2, 5, 2, 8), 'baz'),
      ],
    });
  });
});

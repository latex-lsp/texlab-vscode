import { assert } from 'chai';
import * as vscode from 'vscode';
import { activate, load } from './utility';

interface Spec {
  uri: vscode.Uri;
  line: number;
  character: number;
  expected: vscode.Location[];
}

describe('definition', () => {
  before(activate);

  async function run({ uri, line, character, expected }: Spec) {
    const position = new vscode.Position(line, character);
    const actual = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeDefinitionProvider',
      uri,
      position,
    );

    assert.lengthOf(actual!, expected.length);
    for (let i = 0; i < expected.length; i++) {
      assert.deepEqual(actual![i].range, expected[i].range);
      assert.strictEqual(actual![i].uri.toString(), expected[i].uri.toString());
    }
  }

  it('should provide definitions for label references', async () => {
    const uri = await load('definition-label/main.tex');
    await run({
      uri,
      line: 8,
      character: 7,
      expected: [new vscode.Location(uri, new vscode.Range(5, 7, 5, 10))],
    });
  });

  it('should provide definitions for citations', async () => {
    const texUri = await load('definition-entry/main.tex');
    const bibUri = await load('definition-entry/bibliography.bib');
    await run({
      uri: texUri,
      line: 7,
      character: 8,
      expected: [new vscode.Location(bibUri, new vscode.Range(0, 9, 0, 16))],
    });
  });
});

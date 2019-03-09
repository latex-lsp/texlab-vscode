import { assert } from 'chai';
import * as vscode from 'vscode';
import { activate, load } from './utility';

describe('link', () => {
  before(activate);

  it('should provide links for file imports', async () => {
    const uri1 = await load('link-import/main.tex');
    const uri2 = await load('link-import/foo/bar.tex');
    const uri3 = await load('link-import/baz.tex');
    const actual = (await vscode.commands.executeCommand<vscode.DocumentLink[]>(
      'vscode.executeLinkProvider',
      uri1,
    ))!;

    assert.lengthOf(actual, 2);
    assert.deepEqual(actual[0].range, new vscode.Range(3, 13, 3, 20));
    assert.strictEqual(actual[0].target!.toString(), uri2.toString());
    assert.deepEqual(actual[1].range, new vscode.Range(5, 11, 5, 18));
    assert.strictEqual(actual[1].target!.toString(), uri3.toString());
  });
});

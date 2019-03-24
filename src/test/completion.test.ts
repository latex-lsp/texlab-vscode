import { assert } from 'chai';
import * as vscode from 'vscode';
import { activate, load } from './utility';

interface Spec {
  file: string;
  line: number;
  character: number;
  expected: string[];
}

describe('completion', () => {
  before(activate);

  async function run({ file, line, character, expected }: Spec): Promise<void> {
    const uri = await load(file);
    const position = new vscode.Position(line, character);
    const list = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider',
      uri,
      position,
    );
    expected.forEach(label => {
      assert.include(list!.items.map(item => item.label), label);
    });
  }

  it('should provide completion for kernel commands', async () => {
    await run({
      file: 'completion-kernel-command/main.tex',
      line: 0,
      character: 4,
      expected: ['document', 'documentclass', 'documentstyle'],
    });
    await run({
      file: 'completion-kernel-command/main.bib',
      line: 1,
      character: 15,
      expected: ['LaTeX'],
    });
  });

  it('should provide completion for kernel environments', async () => {
    await run({
      file: 'completion-kernel-environment/main.tex',
      line: 0,
      character: 7,
      expected: ['document', 'figure', 'table'],
    });
  });

  it('should provide completion for package commands', async () => {
    await run({
      file: 'completion-package-command/main.tex',
      line: 5,
      character: 5,
      expected: [
        'xspace',
        'xspaceaddexceptions',
        'xspaceremoveexception',
        'xspaceskip',
      ],
    });
  });

  it('should provide completion for package environments', async () => {
    await run({
      file: 'completion-package-environment/main.tex',
      line: 4,
      character: 7,
      expected: ['proof'],
    });
  });

  it('should provide completion for package imports', async () => {
    await run({
      file: 'completion-package-import/main.tex',
      line: 0,
      character: 15,
      expected: ['amsmath', 'amsthm', 'amssymb'],
    });
  });

  it('should provide completion for file imports', async () => {
    await run({
      file: 'completion-file-import/main.tex',
      line: 0,
      character: 9,
      expected: ['foo', 'baz', 'main'],
    });
    await run({
      file: 'completion-file-import/main.tex',
      line: 1,
      character: 11,
      expected: ['bar.tex'],
    });
  });

  it('should provide completion for labels', async () => {
    await run({
      file: 'completion-label/main.tex',
      line: 10,
      character: 5,
      expected: ['foo', 'bar'],
    });
  });

  it('should provide completion for symbols', async () => {
    await run({
      file: 'completion-symbol/main.tex',
      line: 0,
      character: 8,
      expected: ['A', 'B', 'C', 'D', 'E', 'F'],
    });
  });

  it('should provide completion for citations', async () => {
    await run({
      file: 'completion-citation/main.tex',
      line: 8,
      character: 6,
      expected: ['RSA1978'],
    });
  });

  it('should provide completion for BibTeX entry types', async () => {
    await run({
      file: 'completion-entry-type/main.bib',
      line: 0,
      character: 2,
      expected: ['article', 'audio', 'artwork'],
    });
  });

  it('should provide completion for BibTeX fields', async () => {
    await run({
      file: 'completion-field/main.bib',
      line: 1,
      character: 5,
      expected: ['abstract', 'author', 'addendum'],
    });
  });
});

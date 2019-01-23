import { fromEventPattern, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as vscode from 'vscode';

export function fromTextEditorCommand(
  command: string,
  subscriptions: vscode.Disposable[],
): Observable<vscode.TextEditor> {
  return fromEventPattern(handler => {
    subscriptions.push(
      vscode.commands.registerTextEditorCommand(command, editor =>
        handler(editor),
      ),
    );
  });
}

export function fromCommand(
  command: string,
  subscriptions: vscode.Disposable[],
): Observable<any> {
  return fromEventPattern(handler => {
    subscriptions.push(
      vscode.commands.registerCommand(command, (...args) => handler(...args)),
    );
  });
}

export function filterDocument(selector: vscode.DocumentSelector) {
  return (source: Observable<vscode.TextEditor>) =>
    source.pipe(
      filter(({ document }) => vscode.languages.match(selector, document) > 0),
    );
}

export function skipNull<T>() {
  function isNotNull(input: T | null | undefined): input is T {
    return input != null;
  }

  return (source: Observable<T | null | undefined>) =>
    source.pipe(filter(isNotNull));
}

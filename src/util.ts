import * as vscode from 'vscode';

function startedInDebugMode(): boolean {
  const args: string[] = (process as any).execArgv;
  if (args) {
    return args.some(
      arg =>
        /^--debug=?/.test(arg) ||
        /^--debug-brk=?/.test(arg) ||
        /^--inspect=?/.test(arg) ||
        /^--inspect-brk=?/.test(arg),
    );
  }

  return false;
}

declare var v8debug: any;
export const DEBUG = typeof v8debug === 'object' || startedInDebugMode();

export function isLatexFile(document: vscode.TextDocument): boolean {
  return document.languageId === 'latex' && document.uri.scheme === 'file';
}

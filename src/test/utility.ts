import * as vscode from 'vscode';

export async function activate() {
  const extension = vscode.extensions.getExtension('efoerster.texlab')!;
  await extension.activate();
  await sleep(10);
}

export async function load(file: string): Promise<vscode.Uri> {
  const path = `${vscode.workspace.rootPath}/${file}`;
  const document = await vscode.workspace.openTextDocument(path);
  return document.uri;
}

export function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

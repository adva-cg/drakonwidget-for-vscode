declare module 'vscode' {
  export interface ExtensionContext {
    readonly extensionUri: vscode.Uri;
    readonly globalStorageUri: vscode.Uri;
  }
}
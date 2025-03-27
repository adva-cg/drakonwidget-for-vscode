import * as os from 'os';
import * as vscode from 'vscode';
import * as path from 'path';

const DRAKON_EDITOR_VIEW_TYPE = 'drakonEditor';

interface WebviewMessage {
    command: string;
    diagram?: any;
    filename?: string;
}


class DrakonEditorProvider implements vscode.CustomTextEditorProvider {
    constructor(private readonly context: vscode.ExtensionContext) { }

    private static readonly viewType = 'drakonEditor';

    private async getWebviewContent(resourcesUri: vscode.Uri): Promise<string> {
        const templatePath = vscode.Uri.joinPath(
            this.context.extensionUri,
            'templates',
            'editor.html'
        );

        let html = (await vscode.workspace.fs.readFile(templatePath)).toString();

        // Заменяем плейсхолдеры на реальные URI
        html = html.replace(/\${extPathUri}/g, resourcesUri.toString());

        return html;
    }

    private async handleDiagramUpdate(document: vscode.TextDocument, diagram: any, webviewPanel: vscode.WebviewPanel) {
        try {
            const currentName = path.basename(document.fileName, '.drakon');

            const isNewDiagram = document.isUntitled;
            const nameChanged = diagram.name !== currentName;
            const shouldUpdateFile = isNewDiagram ? nameChanged : true;

            // Для новых файлов (untitled)
            if (isNewDiagram && nameChanged) {
                const uri = await this.showSaveDialog(diagram.name);
                if (!uri) {
                    webviewPanel.webview.postMessage({
                        command: 'revertFilename',
                        filename: currentName
                    });
                    return;
                }

                await this.saveToNewFile(uri, diagram);
                setTimeout(() => webviewPanel.dispose(), 100);
                return;
            }

            // Для существующих файлов с измененным именем
            if (currentName !== diagram.name) {
                const newUri = vscode.Uri.file(path.join(path.dirname(document.fileName), `${diagram.name}.drakon`));

                try {
                    await vscode.workspace.fs.rename(document.uri, newUri, { overwrite: false });
                    setTimeout(() => webviewPanel.dispose(), 100);
                    return;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to rename file';
                    vscode.window.showErrorMessage(`Could not rename file: ${errorMessage}`);
                    webviewPanel.webview.postMessage({
                        command: 'revertFilename',
                        filename: currentName
                    });
                    return;
                }
            }

            // Обычное сохранение
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                document.uri,
                new vscode.Range(0, 0, document.lineCount, 0),
                JSON.stringify(diagram, null, 2)
            );
            await vscode.workspace.applyEdit(edit);
            //if (shouldUpdateFile) {
                await document.save();
            //}

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save diagram';
            vscode.window.showErrorMessage(`Error saving diagram: ${errorMessage}`);
        }
    }

    private async showSaveDialog(defaultName: string): Promise<vscode.Uri | undefined> {
        const sanitizedName = defaultName.replace(/[\\/:*?"<>|]/g, '_');
        return await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(this.getWorkspaceFolder(), `${sanitizedName}.drakon`)),
            filters: { 'Drakon Diagrams': ['drakon'] },
            saveLabel: 'Save Diagram'
        });
    }

    private async saveToNewFile(uri: vscode.Uri, diagram: any): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        edit.createFile(uri, { overwrite: true });
        edit.insert(uri, new vscode.Position(0, 0), JSON.stringify(diagram, null, 2));
        await vscode.workspace.applyEdit(edit);
    }

    private getWorkspaceFolder(): string {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
        return os.homedir();
    }

    async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel
    ): Promise<void> {
        // Настройка Webview
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        // Получаем URI для ресурсов
        const resourcesUri = webviewPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'drakonwidget')
        );

        // Загружаем и обрабатываем HTML
        webviewPanel.webview.html = await this.getWebviewContent(resourcesUri);

        // Получаем имя файла без расширения
        const fileName = document.fileName;
        const fileNameWithoutExtension = path.basename(fileName, path.extname(fileName));

        // Загрузка данных диаграммы
        try {
            const content = document.getText();
            const diagram = content ? JSON.parse(content) : { type: "drakon", items: {} };

            // Устанавливаем имя диаграммы равным имени файла
            diagram.name = fileNameWithoutExtension;

            webviewPanel.webview.postMessage({
                command: 'loadDiagram',
                diagram: diagram
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error loading diagram: ${error}`);
        }

        // Обработчик сообщений от Webview
        webviewPanel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
            switch (message.command) {
                case 'updateDiagram':
                    if (message.diagram) {
                        await this.handleDiagramUpdate(document, message.diagram, webviewPanel);
                    }
                    return;
                case 'requestFilename':
                    const currentName = path.basename(document.fileName, '.drakon');
                    webviewPanel.webview.postMessage({
                        command: 'updateFilename',
                        filename: currentName
                    } as WebviewMessage);
                    return;
            }
        });
    }

}

export function activate(context: vscode.ExtensionContext) {
    // Регистрация провайдера
    const provider = new DrakonEditorProvider(context);
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            DRAKON_EDITOR_VIEW_TYPE,
            provider,
            { supportsMultipleEditorsPerDocument: false }
        )
    );

    // Команда создания новой диаграммы
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.newDiagram', async () => {
            const uri = vscode.Uri.parse(`untitled:NewDiagram-${Date.now()}.drakon`);
            const document = await vscode.workspace.openTextDocument(uri);

            const emptyDiagram = {
                type: "drakon",
                items: {},
                name: path.basename(uri.path, '.drakon') // Используем имя файла
            };

            const edit = new vscode.WorkspaceEdit();
            edit.insert(uri, new vscode.Position(0, 0), JSON.stringify(emptyDiagram, null, 2));
            await vscode.workspace.applyEdit(edit);

            await vscode.commands.executeCommand('vscode.openWith', uri, DRAKON_EDITOR_VIEW_TYPE);
        })
    );

    // Команда открытия файла
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.openFile', async () => {
            const uris = await vscode.window.showOpenDialog({
                filters: { 'Drakon Diagrams': ['drakon'] }
            });
            if (uris && uris[0]) {
                await vscode.commands.executeCommand('vscode.openWith', uris[0], DRAKON_EDITOR_VIEW_TYPE);
            }
        })
    );
}

export function deactivate() { }
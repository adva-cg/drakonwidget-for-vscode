import * as vscode from 'vscode';
import * as path from 'path';

const DRAKON_EDITOR_VIEW_TYPE = 'drakonEditor';

class DrakonEditorProvider implements vscode.CustomTextEditorProvider {
    constructor(private readonly context: vscode.ExtensionContext) {}

    private static readonly viewType = 'drakonEditor';

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
        webviewPanel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'updateDiagram':
                    // Обновляем имя диаграммы перед сохранением
                    const updatedDiagram = message.diagram;
                    updatedDiagram.name = fileNameWithoutExtension;

                    // Сохраняем изменения в документ
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(
                        document.uri,
                        new vscode.Range(0, 0, document.lineCount, 0),
                        JSON.stringify(updatedDiagram, null, 2)
                    );
                    
                    try {
                        await vscode.workspace.applyEdit(edit);
                        // Сохраняем документ на диск
                        await document.save();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Error saving diagram: ${error}`);
                    }
                    return;
            }
        });
    }

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
            const uri = vscode.Uri.parse(`untitled:Untitled-${Date.now()}.drakon`);
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

export function deactivate() {}
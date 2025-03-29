import * as os from 'os';
import * as vscode from 'vscode';
import * as path from 'path';
import { time } from 'console';

const DRAKON_EDITOR_VIEW_TYPE = 'drakonEditor';

const DOCUMENT_IDS_KEY = 'documentCustomIds';


interface WebviewMessage {
    command: string;
    diagram?: any;
    filename?: string;
    theme?: string; // Добавляем поле для темы
}


class DrakonEditorProvider implements vscode.CustomTextEditorProvider {
    constructor(private readonly context: vscode.ExtensionContext) { }

    private static readonly viewType = 'drakonEditor';
    private static activeWebviews: Set<vscode.WebviewPanel> = new Set();

    private static customTheme: string | null = null; // Для ручного управления

    public static hasCustomTheme(): boolean {
        return this.customTheme !== null;
    }

    private async getWebviewContent(resourcesUri: vscode.Uri, theme: string, namespace: string): Promise<string> {
        const templatePath = vscode.Uri.joinPath(
            this.context.extensionUri,
            'templates',
            'editor.html'
        );

        let html = (await vscode.workspace.fs.readFile(templatePath)).toString();
        html = html.replace(/\${extPathUri}/g, resourcesUri.toString());
        html = html.replace(/\${namespace}/g, namespace);
        return html;
    }

    static updateThemeForAllPanels() {
        const theme = this.customTheme ||
            (vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light ? 'vscode-light' : 'vscode-dark');

        this.activeWebviews.forEach(webviewPanel => {
            webviewPanel.webview.postMessage({
                command: 'applyTheme',
                themeClass: theme,
                isCustom: !!this.customTheme
            });
        });
    }

    static setCustomTheme(theme: string | null) {
        this.customTheme = theme;
        this.updateThemeForAllPanels();
    }


    private async handleDiagramUpdate(document: vscode.TextDocument, diagram: any, webviewPanel: vscode.WebviewPanel) {
        try {
            const currentName = path.basename(document.fileName, '.drakon');

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
            delete diagram.name;
            delete diagram.id;
            edit.replace(
                document.uri,
                new vscode.Range(0, 0, document.lineCount, 0),
                JSON.stringify(diagram, null, 2)
            );
            await vscode.workspace.applyEdit(edit);
            await document.save();

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save diagram';
            vscode.window.showErrorMessage(`Error saving diagram: ${errorMessage}`);
        }
    }

    public async showSaveDialog(defaultName: string): Promise<vscode.Uri | undefined> {
        const sanitizedName = defaultName.replace(/[\\/:*?"<>|]/g, '_');
        return await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(this.getWorkspaceFolder(), `${sanitizedName}.drakon`)),
            filters: { 'Drakon Diagrams': ['drakon'] },
            saveLabel: 'Save Diagram'
        });
    }

    public async saveToNewFile(uri: vscode.Uri, diagram: any): Promise<void> {
        try {
            const data = JSON.stringify(diagram, null, 2);
            await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(data));
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to save diagram: ${err}`);
        }
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

        // Определяем текущую тему при открытии
        const currentTheme = DrakonEditorProvider.customTheme ||
            (vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light
                ? 'vscode-light'
                : 'vscode-dark');

        // Генерируем/получаем ID
        async function getDocumentId(doc: vscode.TextDocument, context: vscode.ExtensionContext): Promise<string> {
            const ids = context.globalState.get<Record<string, string>>(DOCUMENT_IDS_KEY) || {};
            if (!ids[doc.uri.toString()]) {
                ids[doc.uri.toString()] = `drakon-${hashString(doc.uri.toString())}`;
                await context.globalState.update(DOCUMENT_IDS_KEY, ids);
            }
            return ids[doc.uri.toString()];
        }

        // Загружаем и обрабатываем HTML
        webviewPanel.webview.html = await this.getWebviewContent(resourcesUri, currentTheme, await getDocumentId(document, this.context));
        // Отправляем текущую тему сразу после загрузки
        webviewPanel.webview.postMessage({
            command: 'applyTheme',
            themeClass: currentTheme,
            isCustom: !!DrakonEditorProvider.customTheme
        });

        DrakonEditorProvider.activeWebviews.add(webviewPanel);

        // Получаем имя файла без расширения
        const fileName = document.fileName;
        const fileNameWithoutExtension = path.basename(fileName, path.extname(fileName));

        // Загрузка данных диаграммы
        try {
            const content = document.getText();
            const diagram = content ? JSON.parse(content) : { type: "drakon", items: {} };

            // Устанавливаем имя диаграммы равным имени файла
            diagram.name = fileNameWithoutExtension;
            diagram.id = fileName;

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
            }
        });

        // В методе resolveCustomTextEditor():
        webviewPanel.onDidChangeViewState((e) => {
            if (e.webviewPanel.visible) {
                // Панель стала видимой (пользователь переключился на вкладку)
                const currentContent = document.getText();
                webviewPanel.webview.postMessage({
                    command: 'panelActivated',
                    content: currentContent
                });
            }
        });        

        webviewPanel.onDidDispose(() => {
            DrakonEditorProvider.activeWebviews.delete(webviewPanel);
        });

    }

}

function getCurrentDateTimeString() {
    const now = new Date();
    const format = (num: number) => String(num).padStart(2, '0');

    return [
        now.getFullYear(),
        format(now.getMonth() + 1),
        format(now.getDate()),
        '_',
        format(now.getHours()),
        format(now.getMinutes()),
        format(now.getSeconds())
    ].join('');
}


function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).slice(0, 8);
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
            const defaultName = `НоваяСхема_` + getCurrentDateTimeString();
            const uri = await provider.showSaveDialog(defaultName);

            if (!uri) {
                return;
            }

            const emptyDiagram = {
                type: "drakon",
                items: {}
            };

            await provider.saveToNewFile(uri, emptyDiagram);
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

    // Команды для ручного управления темой
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.theme.light', () => {
            DrakonEditorProvider.setCustomTheme('drakon-light');
            vscode.window.showInformationMessage('DRAKON: Light theme activated');
        }),

        vscode.commands.registerCommand('drakon.theme.dark', () => {
            DrakonEditorProvider.setCustomTheme('drakon-dark');
            vscode.window.showInformationMessage('DRAKON: Dark theme activated');
        }),

        vscode.commands.registerCommand('drakon.theme.reset', () => {
            DrakonEditorProvider.setCustomTheme(null);
            vscode.window.showInformationMessage('DRAKON: Theme reset to VS Code default');
        })
    );

    // Автоматическая синхронизация
    context.subscriptions.push(
        vscode.window.onDidChangeActiveColorTheme(() => {
            if (!DrakonEditorProvider.hasCustomTheme()) {
                DrakonEditorProvider.updateThemeForAllPanels();
            }
        })
    );

    // При старте обновляем все открытые редакторы
    DrakonEditorProvider.updateThemeForAllPanels();

}

export function deactivate() { }
import * as os from 'os';
import * as vscode from 'vscode';
import * as path from 'path';

const drakongen = require('../src/drakongen/src/index.js');

const DRAKON_EDITOR_VIEW_TYPE = 'drakonEditor';
const DOCUMENT_IDS_KEY = 'documentCustomIds';

interface WebviewMessage {
    command: string;
    diagram?: any;
    filename?: string;
    theme?: string;
    ready?: boolean;
}

class DrakonEditorProvider implements vscode.CustomTextEditorProvider {
    constructor(private readonly context: vscode.ExtensionContext) {
        // Initialize the output channel in the constructor
        this.outputChannel = vscode.window.createOutputChannel("Drakon Extension Logs");
        this.log("DrakonEditorProvider initialized");
    }

    public static activeFilename = '';

    private static isChangeView = false;
    private static readonly viewType = 'drakonEditor';
    private static activeWebviews: Set<vscode.WebviewPanel> = new Set();
    private static customTheme: string | null = null;

    // Add an output channel for logging
    private outputChannel: vscode.OutputChannel;
    // Add a string to store the output
    private outputContent: string = '';

    // Helper function for logging
    private log(message: string, ...args: any[]) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`;
        this.outputChannel.appendLine(logMessage);
        // Append to the outputContent
        this.outputContent += logMessage + '\n';
        console.log(logMessage, ...args); // Also log to the console
    }

    public static hasCustomTheme(): boolean {
        return this.customTheme !== null;
    }

    private async getWebviewContent(resourcesUri: vscode.Uri, theme: string, namespace: string): Promise<string> {
        this.log("getWebviewContent called", { resourcesUri: resourcesUri.toString(), theme, namespace });
        const templatePath = vscode.Uri.joinPath(
            this.context.extensionUri,
            'templates',
            'editor.html'
        );

        let html = (await vscode.workspace.fs.readFile(templatePath)).toString();
        html = html.replace(/\${extPathUri}/g, resourcesUri.toString());
        html = html.replace(/\${namespace}/g, namespace);
        this.log("getWebviewContent completed");
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
        this.log("handleDiagramUpdate called", { documentUri: document.uri.toString(), diagram });
        try {
            const currentName = path.basename(document.fileName, '.drakon');

            if (currentName !== diagram.name) {
                const newUri = vscode.Uri.file(path.join(path.dirname(document.fileName), `${diagram.name}.drakon`));

                try {
                    await vscode.workspace.fs.rename(document.uri, newUri, { overwrite: true });
                    this.log("File renamed", { oldUri: document.uri.toString(), newUri: newUri.toString() });
                    setTimeout(() => webviewPanel.dispose(), 100);
                    return;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to rename file';
                    this.log("Error renaming file", { error: errorMessage });
                    vscode.window.showErrorMessage(`Could not rename file: ${errorMessage}`);
                    webviewPanel.webview.postMessage({
                        command: 'revertFilename',
                        filename: currentName
                    });
                    return;
                }
            }

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
            this.log("Diagram updated and saved");

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save diagram';
            this.log("Error saving diagram", errorMessage);
            vscode.window.showErrorMessage(`Error saving diagram: ${errorMessage}`);
        }
    }

    public async showSaveDialog(defaultName: string): Promise<vscode.Uri | undefined> {
        this.log("showSaveDialog called", { defaultName });
        const sanitizedName = defaultName.replace(/[\\/:*?"<>|]/g, '_');
        const result = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(this.getWorkspaceFolder(), `${sanitizedName}.drakon`)),
            filters: { 'Drakon Diagrams': ['drakon'] },
            saveLabel: 'Save Diagram'
        });
        this.log("showSaveDialog result", result?.toString());
        return result;
    }

    public async saveToNewFile(uri: vscode.Uri, diagram: any): Promise<void> {
        this.log("saveToNewFile called", { uri: uri.toString(), diagram });
        try {
            const data = JSON.stringify(diagram, null, 2);
            await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(data));
            this.log("File saved successfully", uri.toString());
        } catch (err) {
            this.log("Failed to save diagram", err);
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
        this.log("resolveCustomTextEditor called", { documentUri: document.uri.toString() });

        DrakonEditorProvider.activeFilename = document.fileName;

        // Настройка Webview
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        // Получаем URI для ресурсов
        const resourcesUri = webviewPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'src/drakonwidget')
        );

        // Определяем текущую тему при открытии
        const currentTheme = DrakonEditorProvider.customTheme ||
            (vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light ? 'vscode-light' : 'vscode-dark');

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
            this.log("Diagram loaded", diagram);
        } catch (error) {
            this.log("Error loading diagram", error);
            vscode.window.showErrorMessage(`Error loading diagram: ${error}`);
        }

        // Обработчик сообщений от Webview
        webviewPanel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
            this.log("Message received from webview", message);
            switch (message.command) {
                case 'updateDiagram':
                    if (message.diagram) {
                        await this.handleDiagramUpdate(document, message.diagram, webviewPanel);
                    }
                    return;
                case 'checkReady':
                    webviewPanel.webview.postMessage({
                        command: 'ready',
                        ready: true
                    });
                    return;
            }
        });

        webviewPanel.onDidChangeViewState((e) => {
            this.log("onDidChangeViewState", e.webviewPanel.visible);
            if (e.webviewPanel.visible) {
                const content = document.getText();
                const diagram = content ? JSON.parse(content) : { type: "drakon", items: {} };

                // Устанавливаем имя диаграммы равным имени файла
                diagram.name = fileNameWithoutExtension;
                diagram.id = fileName;

                webviewPanel.webview.postMessage({
                    command: 'loadDiagram',
                    diagram: diagram
                });

                webviewPanel.webview.postMessage({
                    command: 'restoreState'
                });

                if (DrakonEditorProvider.isChangeView) {
                    webviewPanel.webview.postMessage({
                        command: 'сheckClipboard'
                    });
                    DrakonEditorProvider.isChangeView = false;
                }

                DrakonEditorProvider.activeFilename = document.fileName;

            } else {
                DrakonEditorProvider.isChangeView = true;
                DrakonEditorProvider.activeFilename = '';
            }
        });
        webviewPanel.onDidDispose(() => {
            this.log("webviewPanel disposed");
            webviewPanel.webview.postMessage({
                command: 'deleteState'
            });
            DrakonEditorProvider.activeWebviews.delete(webviewPanel);
        });


    }
    // Add a method to get the output content
    public getOutputContent(): string {
        return this.outputContent;
    }
    // Add a method to clear the output content
    public clearOutputContent(): void {
        this.outputContent = '';
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
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let hash = 0;
    for (let byte of data) {
        hash = (hash * 31 + byte) % 0x100000000; // Simple hash function
    }
    return Math.abs(hash).toString(36).slice(0, 8);
}

async function generateOutput(generationType: 'pseudo' | 'ast') {
    try {
        if (!DrakonEditorProvider.activeFilename) {
            vscode.window.showErrorMessage('Нет открытого файла!');
            return;
        }

        const fileUri = vscode.Uri.file(DrakonEditorProvider.activeFilename);
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const drakonContent = new TextDecoder().decode(fileContent);
        const diagramName = path.basename(DrakonEditorProvider.activeFilename, '.drakon');

        const config = vscode.workspace.getConfiguration('Drakonwidget');
        const languageSetting = config.get<string>('languageForPseudoCode', 'russian');
        const lang = languageSetting === 'russian' ? 'ru' : 'en';

        let output: string;
        let command: string;

        if (generationType === 'pseudo') {
            output = drakongen.toPseudocode(drakonContent, diagramName, DrakonEditorProvider.activeFilename, lang);
            command = 'Псевдокод';
        } else {
            output = drakongen.toTree(drakonContent, diagramName, DrakonEditorProvider.activeFilename, lang);
            command = 'AST';
        }

        const doc = await vscode.workspace.openTextDocument({
            content: output,
            language: 'plaintext'
        });

        await vscode.window.showTextDocument(doc, {
            preview: false,
            viewColumn: vscode.ViewColumn.Beside
        });

        vscode.window.showInformationMessage(`${command} успешно сгенерирован`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        vscode.window.showErrorMessage(`Ошибка генерации: ${errorMessage}`);
        console.error('Ошибка:', error);
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
    exports.provider = provider;

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

    // Установка языка псеводокода
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.setLanguage', async () => {
            const config = vscode.workspace.getConfiguration('Drakonwidget');
            const choice = await vscode.window.showQuickPick(
                ["english", "russian"], // тодо брать из кодогенератора
                { placeHolder: "Select a language" }
            );
            if (choice) {
                await config.update('languageForPseudoCode', choice, vscode.ConfigurationTarget.Global);
            }
        })
    );

    // Генерация псевдокода
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.genPseudo', async () => {
            await generateOutput('pseudo');
        })
    );

    // Генерация AST
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.generateAST', async () => {
            await generateOutput('ast');
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

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const os = __importStar(require("os"));
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const drakongen = require('../drakongen/src/index.js');
const DRAKON_EDITOR_VIEW_TYPE = 'drakonEditor';
const DOCUMENT_IDS_KEY = 'documentCustomIds';
class DrakonEditorProvider {
    constructor(context) {
        this.context = context;
        // Add a string to store the output
        this.outputContent = '';
        // Initialize the output channel in the constructor
        this.outputChannel = vscode.window.createOutputChannel("Drakon Extension Logs");
        this.log("DrakonEditorProvider initialized");
    }
    // Helper function for logging
    log(message, ...args) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`;
        this.outputChannel.appendLine(logMessage);
        // Append to the outputContent
        this.outputContent += logMessage + '\n';
        console.log(logMessage, ...args); // Also log to the console
    }
    static hasCustomTheme() {
        return this.customTheme !== null;
    }
    getWebviewContent(resourcesUri, theme, namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log("getWebviewContent called", { resourcesUri: resourcesUri.toString(), theme, namespace });
            const templatePath = vscode.Uri.joinPath(this.context.extensionUri, 'templates', 'editor.html');
            let html = (yield vscode.workspace.fs.readFile(templatePath)).toString();
            html = html.replace(/\${extPathUri}/g, resourcesUri.toString());
            html = html.replace(/\${namespace}/g, namespace);
            this.log("getWebviewContent completed");
            return html;
        });
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
    static setCustomTheme(theme) {
        this.customTheme = theme;
        this.updateThemeForAllPanels();
    }
    handleDiagramUpdate(document, diagram, webviewPanel) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log("handleDiagramUpdate called", { documentUri: document.uri.toString(), diagram });
            try {
                const currentName = path.basename(document.fileName, '.drakon');
                if (currentName !== diagram.name) {
                    const newUri = vscode.Uri.file(path.join(path.dirname(document.fileName), `${diagram.name}.drakon`));
                    try {
                        yield vscode.workspace.fs.rename(document.uri, newUri, { overwrite: true });
                        this.log("File renamed", { oldUri: document.uri.toString(), newUri: newUri.toString() });
                        setTimeout(() => webviewPanel.dispose(), 100);
                        return;
                    }
                    catch (error) {
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
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), JSON.stringify(diagram, null, 2));
                yield vscode.workspace.applyEdit(edit);
                yield document.save();
                this.log("Diagram updated and saved");
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to save diagram';
                this.log("Error saving diagram", errorMessage);
                vscode.window.showErrorMessage(`Error saving diagram: ${errorMessage}`);
            }
        });
    }
    showSaveDialog(defaultName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log("showSaveDialog called", { defaultName });
            const sanitizedName = defaultName.replace(/[\\/:*?"<>|]/g, '_');
            const result = yield vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(this.getWorkspaceFolder(), `${sanitizedName}.drakon`)),
                filters: { 'Drakon Diagrams': ['drakon'] },
                saveLabel: 'Save Diagram'
            });
            this.log("showSaveDialog result", result === null || result === void 0 ? void 0 : result.toString());
            return result;
        });
    }
    saveToNewFile(uri, diagram) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log("saveToNewFile called", { uri: uri.toString(), diagram });
            try {
                const data = JSON.stringify(diagram, null, 2);
                yield vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(data));
                this.log("File saved successfully", uri.toString());
            }
            catch (err) {
                this.log("Failed to save diagram", err);
                vscode.window.showErrorMessage(`Failed to save diagram: ${err}`);
            }
        });
    }
    getWorkspaceFolder() {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
        return os.homedir();
    }
    resolveCustomTextEditor(document, webviewPanel) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log("resolveCustomTextEditor called", { documentUri: document.uri.toString() });
            DrakonEditorProvider.activeFilename = document.fileName;
            // Настройка Webview
            webviewPanel.webview.options = {
                enableScripts: true,
                localResourceRoots: [this.context.extensionUri]
            };
            // Получаем URI для ресурсов
            const resourcesUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'drakonwidget'));
            // Определяем текущую тему при открытии
            const currentTheme = DrakonEditorProvider.customTheme ||
                (vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light ? 'vscode-light' : 'vscode-dark');
            // Генерируем/получаем ID
            function getDocumentId(doc, context) {
                return __awaiter(this, void 0, void 0, function* () {
                    const ids = context.globalState.get(DOCUMENT_IDS_KEY) || {};
                    if (!ids[doc.uri.toString()]) {
                        ids[doc.uri.toString()] = `drakon-${hashString(doc.uri.toString())}`;
                        yield context.globalState.update(DOCUMENT_IDS_KEY, ids);
                    }
                    return ids[doc.uri.toString()];
                });
            }
            // Загружаем и обрабатываем HTML
            webviewPanel.webview.html = yield this.getWebviewContent(resourcesUri, currentTheme, yield getDocumentId(document, this.context));
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
            }
            catch (error) {
                this.log("Error loading diagram", error);
                vscode.window.showErrorMessage(`Error loading diagram: ${error}`);
            }
            // Обработчик сообщений от Webview
            webviewPanel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                this.log("Message received from webview", message);
                switch (message.command) {
                    case 'updateDiagram':
                        if (message.diagram) {
                            yield this.handleDiagramUpdate(document, message.diagram, webviewPanel);
                        }
                        return;
                    case 'checkReady':
                        webviewPanel.webview.postMessage({
                            command: 'ready',
                            ready: true
                        });
                        return;
                }
            }));
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
                }
                else {
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
        });
    }
    // Add a method to get the output content
    getOutputContent() {
        return this.outputContent;
    }
    // Add a method to clear the output content
    clearOutputContent() {
        this.outputContent = '';
    }
}
DrakonEditorProvider.activeFilename = '';
DrakonEditorProvider.isChangeView = false;
DrakonEditorProvider.viewType = 'drakonEditor';
DrakonEditorProvider.activeWebviews = new Set();
DrakonEditorProvider.customTheme = null;
function getCurrentDateTimeString() {
    const now = new Date();
    const format = (num) => String(num).padStart(2, '0');
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
function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let hash = 0;
    for (let byte of data) {
        hash = (hash * 31 + byte) % 0x100000000; // Simple hash function
    }
    return Math.abs(hash).toString(36).slice(0, 8);
}
function generateOutput(generationType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!DrakonEditorProvider.activeFilename) {
                vscode.window.showErrorMessage('Нет открытого файла!');
                return;
            }
            const fileUri = vscode.Uri.file(DrakonEditorProvider.activeFilename);
            const fileContent = yield vscode.workspace.fs.readFile(fileUri);
            const drakonContent = new TextDecoder().decode(fileContent);
            const diagramName = path.basename(DrakonEditorProvider.activeFilename, '.drakon');
            const config = vscode.workspace.getConfiguration('Drakonwidget');
            const languageSetting = config.get('languageForPseudoCode', 'russian');
            const lang = languageSetting === 'russian' ? 'ru' : 'en';
            let output;
            let command;
            if (generationType === 'pseudo') {
                output = drakongen.toPseudocode(drakonContent, diagramName, DrakonEditorProvider.activeFilename, lang);
                command = 'Псевдокод';
            }
            else {
                output = drakongen.toTree(drakonContent, diagramName, DrakonEditorProvider.activeFilename, lang);
                command = 'AST';
            }
            const doc = yield vscode.workspace.openTextDocument({
                content: output,
                language: 'plaintext'
            });
            yield vscode.window.showTextDocument(doc, {
                preview: false,
                viewColumn: vscode.ViewColumn.Beside
            });
            vscode.window.showInformationMessage(`${command} успешно сгенерирован`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            vscode.window.showErrorMessage(`Ошибка генерации: ${errorMessage}`);
            console.error('Ошибка:', error);
        }
    });
}
function activate(context) {
    // Регистрация провайдера
    const provider = new DrakonEditorProvider(context);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(DRAKON_EDITOR_VIEW_TYPE, provider, { supportsMultipleEditorsPerDocument: false }));
    exports.provider = provider;
    // Команда создания новой диаграммы
    context.subscriptions.push(vscode.commands.registerCommand('drakon.newDiagram', () => __awaiter(this, void 0, void 0, function* () {
        const defaultName = `НоваяСхема_` + getCurrentDateTimeString();
        const uri = yield provider.showSaveDialog(defaultName);
        if (!uri) {
            return;
        }
        const emptyDiagram = {
            type: "drakon",
            items: {}
        };
        yield provider.saveToNewFile(uri, emptyDiagram);
        yield vscode.commands.executeCommand('vscode.openWith', uri, DRAKON_EDITOR_VIEW_TYPE);
    })));
    // Установка языка псеводокода
    context.subscriptions.push(vscode.commands.registerCommand('drakon.setLanguage', () => __awaiter(this, void 0, void 0, function* () {
        const config = vscode.workspace.getConfiguration('Drakonwidget');
        const choice = yield vscode.window.showQuickPick(["english", "russian"], // тодо брать из кодогенератора
        { placeHolder: "Select a language" });
        if (choice) {
            yield config.update('languageForPseudoCode', choice, vscode.ConfigurationTarget.Global);
        }
    })));
    // Генерация псевдокода
    context.subscriptions.push(vscode.commands.registerCommand('drakon.genPseudo', () => __awaiter(this, void 0, void 0, function* () {
        yield generateOutput('pseudo');
    })));
    // Генерация AST
    context.subscriptions.push(vscode.commands.registerCommand('drakon.generateAST', () => __awaiter(this, void 0, void 0, function* () {
        yield generateOutput('ast');
    })));
    // Команда открытия файла
    context.subscriptions.push(vscode.commands.registerCommand('drakon.openFile', () => __awaiter(this, void 0, void 0, function* () {
        const uris = yield vscode.window.showOpenDialog({
            filters: { 'Drakon Diagrams': ['drakon'] }
        });
        if (uris && uris[0]) {
            yield vscode.commands.executeCommand('vscode.openWith', uris[0], DRAKON_EDITOR_VIEW_TYPE);
        }
    })));
    // Команды для ручного управления темой
    context.subscriptions.push(vscode.commands.registerCommand('drakon.theme.light', () => {
        DrakonEditorProvider.setCustomTheme('drakon-light');
        vscode.window.showInformationMessage('DRAKON: Light theme activated');
    }), vscode.commands.registerCommand('drakon.theme.dark', () => {
        DrakonEditorProvider.setCustomTheme('drakon-dark');
        vscode.window.showInformationMessage('DRAKON: Dark theme activated');
    }), vscode.commands.registerCommand('drakon.theme.reset', () => {
        DrakonEditorProvider.setCustomTheme(null);
        vscode.window.showInformationMessage('DRAKON: Theme reset to VS Code default');
    }));
    // Автоматическая синхронизация
    context.subscriptions.push(vscode.window.onDidChangeActiveColorTheme(() => {
        if (!DrakonEditorProvider.hasCustomTheme()) {
            DrakonEditorProvider.updateThemeForAllPanels();
        }
    }));
    // При старте обновляем все открытые редакторы
    DrakonEditorProvider.updateThemeForAllPanels();
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
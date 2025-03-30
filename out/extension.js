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
const DRAKON_EDITOR_VIEW_TYPE = 'drakonEditor';
const DOCUMENT_IDS_KEY = 'documentCustomIds';
class DrakonEditorProvider {
    constructor(context) {
        this.context = context;
    }
    static hasCustomTheme() {
        return this.customTheme !== null;
    }
    getWebviewContent(resourcesUri, theme, namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            const templatePath = vscode.Uri.joinPath(this.context.extensionUri, 'templates', 'editor.html');
            let html = (yield vscode.workspace.fs.readFile(templatePath)).toString();
            html = html.replace(/\${extPathUri}/g, resourcesUri.toString());
            html = html.replace(/\${namespace}/g, namespace);
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
            try {
                const currentName = path.basename(document.fileName, '.drakon');
                // Для существующих файлов с измененным именем
                if (currentName !== diagram.name) {
                    const newUri = vscode.Uri.file(path.join(path.dirname(document.fileName), `${diagram.name}.drakon`));
                    try {
                        yield vscode.workspace.fs.rename(document.uri, newUri, { overwrite: false });
                        setTimeout(() => webviewPanel.dispose(), 100);
                        return;
                    }
                    catch (error) {
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
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), JSON.stringify(diagram, null, 2));
                yield vscode.workspace.applyEdit(edit);
                yield document.save();
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to save diagram';
                vscode.window.showErrorMessage(`Error saving diagram: ${errorMessage}`);
            }
        });
    }
    showSaveDialog(defaultName) {
        return __awaiter(this, void 0, void 0, function* () {
            const sanitizedName = defaultName.replace(/[\\/:*?"<>|]/g, '_');
            return yield vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(this.getWorkspaceFolder(), `${sanitizedName}.drakon`)),
                filters: { 'Drakon Diagrams': ['drakon'] },
                saveLabel: 'Save Diagram'
            });
        });
    }
    saveToNewFile(uri, diagram) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = JSON.stringify(diagram, null, 2);
                yield vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(data));
            }
            catch (err) {
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
            // Настройка Webview
            webviewPanel.webview.options = {
                enableScripts: true,
                localResourceRoots: [this.context.extensionUri]
            };
            // Получаем URI для ресурсов
            const resourcesUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'drakonwidget'));
            // Определяем текущую тему при открытии
            const currentTheme = DrakonEditorProvider.customTheme ||
                (vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light
                    ? 'vscode-light'
                    : 'vscode-dark');
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
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error loading diagram: ${error}`);
            }
            // Обработчик сообщений от Webview
            webviewPanel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                switch (message.command) {
                    case 'updateDiagram':
                        if (message.diagram) {
                            yield this.handleDiagramUpdate(document, message.diagram, webviewPanel);
                        }
                        return;
                }
            }));
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
        });
    }
}
DrakonEditorProvider.viewType = 'drakonEditor';
DrakonEditorProvider.activeWebviews = new Set();
DrakonEditorProvider.customTheme = null; // Для ручного управления
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
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).slice(0, 8);
}
function activate(context) {
    // Регистрация провайдера
    const provider = new DrakonEditorProvider(context);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(DRAKON_EDITOR_VIEW_TYPE, provider, { supportsMultipleEditorsPerDocument: false }));
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
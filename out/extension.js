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
const vscode = __importStar(require("vscode"));
const DRAKON_EDITOR_VIEW_TYPE = 'drakonEditor';
class DrakonEditorProvider {
    constructor(context) {
        this.context = context;
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
            // Загружаем и обрабатываем HTML
            webviewPanel.webview.html = yield this.getWebviewContent(resourcesUri);
            // Загрузка данных диаграммы
            try {
                const content = document.getText();
                const diagram = content ? JSON.parse(content) : { type: "drakon", items: {} };
                webviewPanel.webview.postMessage({
                    command: 'loadDiagram',
                    diagram: diagram
                });
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error loading diagram: ${error}`);
            }
        });
    }
    getWebviewContent(resourcesUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const templatePath = vscode.Uri.joinPath(this.context.extensionUri, 'templates', 'editor.html');
            let html = (yield vscode.workspace.fs.readFile(templatePath)).toString();
            // Заменяем плейсхолдеры на реальные URI
            html = html.replace(/\${extPathUri}/g, resourcesUri.toString());
            return html;
        });
    }
}
DrakonEditorProvider.viewType = 'drakonEditor';
function activate(context) {
    // Регистрация провайдера
    const provider = new DrakonEditorProvider(context);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(DRAKON_EDITOR_VIEW_TYPE, provider, { supportsMultipleEditorsPerDocument: false }));
    // Команда создания новой диаграммы
    context.subscriptions.push(vscode.commands.registerCommand('drakon.newDiagram', () => __awaiter(this, void 0, void 0, function* () {
        const uri = vscode.Uri.parse(`untitled:Untitled-${Date.now()}.drakon`);
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
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
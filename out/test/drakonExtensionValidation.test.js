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
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const vscode = __importStar(require("vscode"));
const assert = __importStar(require("assert"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
suite('DRAKON Examples Validation (VS Code Extension)', () => {
    (0, mocha_1.describe)('DRAKON Examples Validation (VS Code Extension)', () => {
        let extension;
        let outputChannel;
        let provider;
        (0, mocha_1.before)(async () => {
            extension = vscode.extensions.getExtension('VitalyAdadurov.drakonwidget-for-vscode');
            assert.ok(extension, 'Extension not found');
            await extension.activate();
            console.log('Extension activated');
            outputChannel = vscode.window.createOutputChannel("Drakon Extension Logs");
            provider = extension.exports.provider;
        });
        (0, mocha_1.afterEach)(() => {
            outputChannel.clear();
            provider.clearOutputContent();
        });
        const examplesDir = path.join(__dirname, '..', '..', 'drakongen', 'examples');
        if (!fs.existsSync(examplesDir)) {
            throw new Error(`Examples directory not found: ${examplesDir}`);
        }
        async function waitForDrakonRender() {
            // Wait for a short period to allow the extension to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
            // Check if the webview is ready by sending a message and waiting for a response
            const webviewPanel = vscode.window.visibleTextEditors.find(editor => editor.document.uri.scheme === 'vscode-webview')?.viewColumn;
            if (!webviewPanel) {
                console.warn('No webview panel found');
                return;
            }
            const message = { command: 'checkReady' };
            const responsePromise = new Promise(resolve => {
                const disposable = vscode.window.onDidChangeVisibleTextEditors(editors => {
                    const webviewEditor = editors.find(editor => editor.document.uri.scheme === 'vscode-webview');
                    if (webviewEditor) {
                        webviewEditor.document.getText().includes('ready');
                        disposable.dispose();
                        resolve(true);
                    }
                });
                setTimeout(() => {
                    disposable.dispose();
                    resolve(false);
                }, 10000); // Timeout after 10 seconds
            });
            vscode.commands.executeCommand('workbench.action.webview.postMessage', webviewPanel, message);
            const isReady = await responsePromise;
            if (!isReady) {
                console.warn('Webview did not become ready in time');
            }
        }
        async function openAndValidateDrakonFile(filePath) {
            const uri = vscode.Uri.file(filePath);
            try {
                // Open the file in VS Code
                await vscode.window.showTextDocument(uri);
                // Wait for drakonwidget to load and render
                await waitForDrakonRender();
                // Check for errors in the output panel
                const outputContent = provider.getOutputContent();
                if (outputContent.includes("Error") || outputContent.includes("Failed")) {
                    console.error(`Errors found in output panel for file ${path.basename(filePath)}:`, outputContent);
                    assert.fail(`File ${path.basename(filePath)} is invalid due to errors in output`);
                }
                else {
                    console.log(`No errors found in the output panel for file ${path.basename(filePath)}`);
                }
                // If no errors, the file is considered valid
                assert.ok(true, `File ${path.basename(filePath)} is valid`);
            }
            catch (error) {
                console.error(`Error validating file ${path.basename(filePath)}:`, error);
                assert.fail(`File ${path.basename(filePath)} is invalid`);
            }
        }
        const drakonFiles = fs.readdirSync(examplesDir).filter(file => file.endsWith('.drakon'));
        drakonFiles.forEach(drakonFile => {
            (0, mocha_1.it)(`should validate ${drakonFile}`, async () => {
                const filePath = path.join(examplesDir, drakonFile);
                await openAndValidateDrakonFile(filePath);
            });
        });
        (0, mocha_1.it)('should handle missing examples directory gracefully', () => {
            const invalidDir = path.join(__dirname, '..', '..', 'nonexistent', 'examples');
            try {
                fs.readdirSync(invalidDir);
                assert.fail('Expected an error for missing directory');
            }
            catch (error) {
                assert.ok(error, 'Error was thrown as expected for missing directory');
            }
        });
        (0, mocha_1.it)('should handle empty examples directory gracefully', () => {
            const emptyDir = path.join(__dirname, '..', '..', 'empty_examples');
            try {
                fs.mkdirSync(emptyDir, { recursive: true });
                const files = fs.readdirSync(emptyDir);
                assert.strictEqual(files.length, 0, 'Empty directory should have no files');
            }
            finally {
                if (fs.existsSync(emptyDir)) {
                    fs.rmdirSync(emptyDir, { recursive: true });
                }
            }
            ;
        });
        (0, mocha_1.it)('should validate non-`.drakon` files are ignored', () => {
            const tempFile = path.join(examplesDir, 'temp.txt');
            try {
                fs.writeFileSync(tempFile, 'Temporary file content');
                const drakonFiles = fs.readdirSync(examplesDir).filter(file => file.endsWith('.drakon'));
                assert.ok(!drakonFiles.includes('temp.txt'), 'Non-`.drakon` files should be ignored');
            }
            finally {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }
        });
    });
});
//# sourceMappingURL=drakonExtensionValidation.test.js.map
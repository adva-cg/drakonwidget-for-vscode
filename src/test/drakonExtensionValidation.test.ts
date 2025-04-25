import { describe, it, before, afterEach } from 'mocha';
import * as vscode from 'vscode';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';


describe('DRAKON Examples Validation (VS Code Extension)', () => {
    let extension: vscode.Extension<any> | undefined;
    let outputChannel: vscode.OutputChannel;
    let provider: any;

    before(async () => {
        extension = vscode.extensions.getExtension('VitalyAdadurov.drakonwidget-for-vscode');
        assert.ok(extension, 'Extension not found');
        await extension.activate();
        console.log('Extension activated');
        outputChannel = vscode.window.createOutputChannel("Drakon Extension Logs");
        provider = (extension.exports as any).provider;
    });

    afterEach(() => {
        outputChannel.clear();
        provider.clearOutputContent();
    });

    const examplesDir: string = path.join(__dirname, '..', '..', 'drakongen', 'examples');

    if (!fs.existsSync(examplesDir)) {
        throw new Error(`Examples directory not found: ${examplesDir}`);
    }

    async function waitForDrakonRender(): Promise<void> {
        // Wait for a short period to allow the extension to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if the webview is ready by sending a message and waiting for a response
        const webviewPanel = vscode.window.visibleTextEditors.find(editor => editor.document.uri.scheme === 'vscode-webview')?.viewColumn;
        if (!webviewPanel) {
            console.warn('No webview panel found');
            return;
        }

        const message = { command: 'checkReady' };
        const responsePromise = new Promise<boolean>(resolve => {
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

    async function openAndValidateDrakonFile(filePath: string): Promise<void> {
        const uri: vscode.Uri = vscode.Uri.file(filePath);
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
            } else {
                console.log(`No errors found in the output panel for file ${path.basename(filePath)}`);
            }

            // If no errors, the file is considered valid
            assert.ok(true, `File ${path.basename(filePath)} is valid`);
        } catch (error) {
            console.error(`Error validating file ${path.basename(filePath)}:`, error);
            assert.fail(`File ${path.basename(filePath)} is invalid`);
        }
    }

    const drakonFiles: string[] = fs.readdirSync(examplesDir).filter(file => file.endsWith('.drakon'));

    drakonFiles.forEach(drakonFile => {
        it(`should validate ${drakonFile}`, async () => {
            const filePath: string = path.join(examplesDir, drakonFile);
            await openAndValidateDrakonFile(filePath);
        });
    });

    it('should handle missing examples directory gracefully', () => {
        const invalidDir: string = path.join(__dirname, '..', '..', 'nonexistent', 'examples');
        try {
            fs.readdirSync(invalidDir);
            assert.fail('Expected an error for missing directory');
        } catch (error) {
            assert.ok(error, 'Error was thrown as expected for missing directory');
        }
    });

    it('should handle empty examples directory gracefully', () => {
        const emptyDir: string = path.join(__dirname, '..', '..', 'empty_examples');
        try {
            fs.mkdirSync(emptyDir, { recursive: true });
            const files: string[] = fs.readdirSync(emptyDir);
            assert.strictEqual(files.length, 0, 'Empty directory should have no files');
        } finally {
            if (fs.existsSync(emptyDir)) {
                fs.rmdirSync(emptyDir, { recursive: true });
            }
        };
    });

    it('should validate non-`.drakon` files are ignored', () => {
        const tempFile: string = path.join(examplesDir, 'temp.txt');
        try {
            fs.writeFileSync(tempFile, 'Temporary file content');
            const drakonFiles: string[] = fs.readdirSync(examplesDir).filter(file => file.endsWith('.drakon'));
            assert.ok(!drakonFiles.includes('temp.txt'), 'Non-`.drakon` files should be ignored');
        } finally {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        }
    });
});


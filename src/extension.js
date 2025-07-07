const os = require('os');
const vscode = require('vscode');
const path = require('path');
const drakongen = require(
    '../src/drakongen/src/index.js'
);
const DRAKON_EDITOR_VIEW_TYPE = 'drakonEditor';
const DOCUMENT_IDS_KEY = 'documentCustomIds';
// --- Статические переменные ---

const DEP = {}
DEP.activeFilename = '';
DEP.isChangeView = false;
DEP.activeWebviews = new Set();
DEP.customTheme = null;
DEP.outputContent = '';
DEP.outputChannel

// Created with Drakon Tech https://drakon.tech/



function DrakonEditorProvider(context) {
    this.context = context
    DEP.outputChannel = vscode.window.createOutputChannel(
        "Drakon Extension Logs"
    );
    log("DrakonEditorProvider initialized")
}

function activate(context) {
    var provider;
    provider = new DrakonEditorProvider(
        context
    )
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            DRAKON_EDITOR_VIEW_TYPE,
            provider,
            {
                supportsMultipleEditorsPerDocument:
                false
            }
        )
    )
    exports.provider = provider
    registerCommands(context)
    updateThemeForAllPanels()
}

function deactivate() {
}

async function generateDrakon() {
    try {
        await generateDrakonTry()
    } catch (error) {
        vscode.window.showErrorMessage(
            'Error during DRAKON generation: '
            + (
                error && error.message ? error
                .message: error
            )
        )
    }
}

async function generateDrakonTry() {
    var document, editor, newUri, result, text;
    editor = vscode.window.activeTextEditor
    if (editor) {
        document = editor.document;
        text = document.getText()
        result = drakongen.astToDrakon(text)
        if ((result) && (result.content)) {
            newUri = vscode.Uri.file(
                path.join(
                    path.dirname(document.uri.fsPath),
                    result.fileName + '.drakon'
                )
            )
            await vscode.workspace.fs.writeFile(
                newUri,
                Buffer.from(result.content)
            )
            await vscode.commands.executeCommand(
                'vscode.openWith',
                newUri,
                DRAKON_EDITOR_VIEW_TYPE
            )
            vscode.window.showInformationMessage(
                'DRAKON diagram generated successfully: '
                + result.fileName + '.drakon'
            )
        } else {
            vscode.window.showErrorMessage(
                'Failed to generate DRAKON diagram.'
            )
        }
    } else {
        vscode.window.showErrorMessage(
            'No active text editor!'
        )
    }
}

async function generateOutput(generationType) {
    var errorMessage;
    try {
        await generateOutputTry(
            generationType
        )
    } catch (error) {
        errorMessage = error && error.message
        ? error.message: 'Неизвестная ошибка';
        vscode.window.showErrorMessage(
            'Ошибка генерации: ' + errorMessage
        );
        console.error('Ошибка:', error)
    }
}

async function generateOutputTry(generationType) {
    var command, config, diagramName, doc, drakonContent, fileContent, fileUri, lang, languageSetting, output;
    if (!DEP.activeFilename) {
        vscode.window.showErrorMessage(
            'Нет открытого файла!'
        );
    } else {
        fileUri = vscode.Uri.file(
            DEP.activeFilename
        );
        fileContent = await vscode.workspace.fs.readFile(
            fileUri
        );
        drakonContent = new TextDecoder().decode(
            fileContent
        );
        diagramName = path.basename(
            DEP.activeFilename,
            '.drakon'
        );
        config = vscode.workspace.getConfiguration(
            'Drakonwidget'
        );
        languageSetting = config.get(
            'languageForPseudoCode',
            'russian'
        );
        lang = languageSetting === 'russian' ? 'ru':
        'en';
        if (generationType === 'pseudo') {
            output = drakongen.toPseudocode(
                drakonContent,
                diagramName,
                DEP.activeFilename,
                lang
            );
            command = 'Псевдокод'
        } else {
            output = drakongen.toTree(
                drakonContent,
                diagramName,
                DEP.activeFilename,
                lang
            );
            command = 'AST'
        }
        doc = await vscode.workspace.openTextDocument(
            {
                content: output,
                language: 'plaintext'
            }
        )
        await vscode.window.showTextDocument(
            doc,
            {
                preview: false,
                viewColumn: vscode.ViewColumn.Beside
            }
        )
        vscode.window.showInformationMessage(
            command + ' успешно сгенерирован'
        )
    }
}

function getCurrentDateTimeString() {
    var format, now;
    now = new Date();
    format = function (num) {
        return String(num).padStart(2, '0');
    };
    return [
        now.getFullYear(),
        format(now.getMonth() + 1),
        format(now.getDate()),
        '_',
        format(now.getHours()),
        format(now.getMinutes()),
        format(now.getSeconds())
    ].join('')
}

async function getDocumentId(doc, context) {
    var ids;
    ids = context.globalState.get(
        DOCUMENT_IDS_KEY
    ) || {}
    if (!ids[doc.uri.toString()]) {
        ids[doc.uri.toString()] = 'drakon-' + hashString(
            doc.uri.toString()
        )
        await context.globalState.update(
            DOCUMENT_IDS_KEY,
            ids
        )
    }
    return ids[doc.uri.toString()]
}

async function getWebviewContent(context, resourcesUri, theme, namespace) {
    var html, templatePath;
    log(
        "getWebviewContent called",
        {
            resourcesUri: resourcesUri.toString(),
            theme,
            namespace
        }
    )
    templatePath = vscode.Uri.joinPath(
        context.extensionUri,
        'templates',
        'editor.html'
    )
    html = (
        await vscode.workspace.fs.readFile(
            templatePath
        )
    ).toString();
    html = html.replace(
        /\${extPathUri}/g,
        resourcesUri.toString()
    );
    html = html.replace(
        /\${namespace}/g,
        namespace
    )
    log("getWebviewContent completed")
    return html
}

function getWorkspaceFolder() {
    if ((vscode.workspace.workspaceFolders) && (vscode.workspace.workspaceFolders.length
> 0)) {
        return vscode.workspace.workspaceFolders[
            0
        ].uri.fsPath
    } else {
        return os.homedir()
    }
}

async function handleDiagramUpdate(document, diagram, webviewPanel) {
    var currentName, errorMessage, newUri, renameError;
    log(
        "handleDiagramUpdate called",
        {
            documentUri: document.uri.toString(),
            diagram: diagram
        }
    )
    try {
        errorMessage = '';
        currentName = path.basename(
            document.fileName,
            '.drakon'
        );
        if (currentName !== diagram.name) {
            newUri = vscode.Uri.file(
                path.join(
                    path.dirname(
                        document.fileName
                    ),
                    diagram.name + '.drakon'
                )
            );
            renameError = null;
            await vscode.workspace.fs.rename(
                document.uri,
                newUri,
                {overwrite: true}
            ). catch (
                err => {
                    renameError = err;
                }
            );
            if (renameError) {
                errorMessage = renameError &&
                renameError.message ? renameError
                .message: 'Failed to rename file';
                log(
                    "Error renaming file",
                    {error: errorMessage}
                );
                vscode.window.showErrorMessage(
                    'Could not rename file: '
                    + errorMessage
                );
                webviewPanel.webview.postMessage(
                    {
                        command: 'revertFilename',
                        filename: currentName
                    }
                );
                return ;
            };
            log(
                "File renamed",
                {
                    oldUri: document.uri.toString(),
                    newUri: newUri.toString()
                }
            );
            setTimeout(
                function () {
                    webviewPanel.dispose();
                },
                100
            )
        }
        edit = new vscode.WorkspaceEdit();
        delete diagram.name;
        delete diagram.id;
        edit.replace(
            document.uri,
            new vscode.Range(
                0,
                0,
                document.lineCount,
                0
            ),
            JSON.stringify(diagram, null, 2)
        );
        await vscode.workspace.applyEdit(
            edit
        );
        await document.save();
        log("Diagram updated and saved");
    } catch (error) {
        errorMessage = error && error.message
        ? error.message: 'Failed to save diagram';
        log(
            "Error saving diagram",
            errorMessage
        );
        vscode.window.showErrorMessage(
            'Error saving diagram: ' + errorMessage
        );
    }
}

function hasCustomTheme() {
    return DEP.customTheme !== null
}

function hashString(str) {
    var data, encoder, hash, i;
    encoder = new TextEncoder();
    data = encoder.encode(str);
    hash = 0;
    i = 0;
    while (true) {
        if (i < data.length) {
            hash = (hash * 31 + data[i]) % 0x100000000
            i++;
        } else {
            break;
        }
    }
    return Math.abs(hash).toString(36).slice(
        0,
        8
    )
}

function log(message, ...args) {
    var logMessage, timestamp;
    timestamp = new Date().toISOString()
    logMessage = `[${timestamp}] ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`
    if (DEP.outputChannel) {
        DEP.outputChannel.appendLine(logMessage)
    }
    DEP.outputContent += logMessage + '\n'
    console.log(logMessage,  ... args)
}

async function newDiagram() {
    var defaultName, emptyDiagram, uri;
    defaultName = 'НоваяСхема_' + getCurrentDateTimeString();
    uri = await exports.provider.showSaveDialog(
        defaultName
    )
    if (uri) {
        emptyDiagram = {
            type: "drakon",
            items: {}
        };
        await exports.provider.saveToNewFile(
            uri,
            emptyDiagram
        );
        await vscode.commands.executeCommand(
            'vscode.openWith',
            uri,
            DRAKON_EDITOR_VIEW_TYPE
        )
    }
}

async function openFile() {
    var uris;
    uris = await vscode.window.showOpenDialog(
        {
            filters: {
                'Diagrams': [
                    'drakon',
                    'free',
                    'graf'
                ]
            }
        }
    );
    if (uris && uris[0]) {
        await vscode.commands.executeCommand(
            'vscode.openWith',
            uris[0],
            DRAKON_EDITOR_VIEW_TYPE
        );
    }
}

function registerCommands(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'drakon.newDiagram',
            newDiagram
        )
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'drakon.setLanguage',
            setLanguage
        )
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'drakon.genPseudo',
            async function () {
                await generateOutput(
                    'pseudo'
                );
            }
        )
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'drakon.generateAST',
            async function () {
                await generateOutput('ast');
            }
        )
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'drakon.generateDrakon',
            async function () {
                await generateDrakon();
            }
        )
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'drakon.openFile',
            openFile
        )
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'drakon.theme.light',
            function () {
                setCustomTheme(
                    'drakon-light'
                );
                vscode.window.showInformationMessage(
                    'DRAKON: Light theme activated'
                );
            }
        ),
        vscode.commands.registerCommand(
            'drakon.theme.dark',
            function () {
                setCustomTheme('drakon-dark');
                vscode.window.showInformationMessage(
                    'DRAKON: Dark theme activated'
                );
            }
        ),
        vscode.commands.registerCommand(
            'drakon.theme.reset',
            function () {
                setCustomTheme(null);
                vscode.window.showInformationMessage(
                    'DRAKON: Theme reset to VS Code default'
                );
            }
        )
    )
    context.subscriptions.push(
        vscode.window.onDidChangeActiveColorTheme(
            function () {
                if (!hasCustomTheme()) {
                    updateThemeForAllPanels();
                }
            }
        )
    )
}

async function resolveCustomTextEditor(document, webviewPanel) {
    var content, currentTheme, diagram, fileName, fileNameWithoutExtension, resourcesUri;
    log(
        "resolveCustomTextEditor called",
        {
            documentUri: document.uri.toString()
        }
    )
    DEP.activeFilename = document.fileName
    webviewPanel.webview.options = {
        enableScripts: true,
        localResourceRoots: [
            this.context.extensionUri
        ]
    }
    resourcesUri = webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            this.context.extensionUri,
            'src/drakonwidget'
        )
    )
    currentTheme = DEP.customTheme || (
        vscode.window.activeColorTheme.kind ===
        vscode.ColorThemeKind.Light ? 'vscode-light':
        'vscode-dark'
    )
    webviewPanel.webview.html = await this.getWebviewContent(
        this.context,
        resourcesUri,
        currentTheme,
        await getDocumentId(
            document,
            this.context
        )
    )
    webviewPanel.webview.postMessage(
        {
            command: 'applyTheme',
            themeClass: currentTheme,
            isCustom: !!DEP.customTheme
        }
    )
    DEP.activeWebviews.add(webviewPanel)
    fileName = fileName = document.fileName;
    fileNameWithoutExtension = path.basename(
        fileName,
        path.extname(fileName)
    )
    try {
        content = document.getText();
        diagram = content ? JSON.parse(
            content
        ): {type: "drakon", items: {}};
        diagram.name = fileNameWithoutExtension;
        diagram.id = fileName;
        webviewPanel.webview.postMessage(
            {
                command: 'loadDiagram',
                diagram: diagram
            }
        );
        log("Diagram loaded", diagram);
    } catch (error) {
        log("Error loading diagram", error);
        vscode.window.showErrorMessage(
            'Error loading diagram: ' + error
        );
    }
    webviewPanel.webview.onDidReceiveMessage(
        async (message) => {
            log(
                "Message received from webview",
                message
            );
            switch (message.command) {
                case 'updateDiagram': if (
                    message.diagram
                ) {
                    await this.handleDiagramUpdate(
                        document,
                        message.diagram,
                        webviewPanel
                    );
                }
                return ;
                case 'checkReady': webviewPanel
                .webview.postMessage(
                    {
                        command: 'ready',
                        ready: true
                    }
                );
                return ;
            }
        }
    )
    webviewPanel.onDidChangeViewState(
        function (e) {
            log(
                "onDidChangeViewState",
                e.webviewPanel.visible
            );
            if (e.webviewPanel.visible) {
                const content = document.getText();
                const diagram = content ? JSON
                .parse(content): {
                    type: "drakon",
                    items: {}
                };
                diagram.name = fileNameWithoutExtension;
                diagram.id = fileName;
                webviewPanel.webview.postMessage(
                    {
                        command: 'loadDiagram',
                        diagram: diagram
                    }
                );
                webviewPanel.webview.postMessage(
                    {command: 'restoreState'}
                );
                if (DEP.isChangeView) {
                    webviewPanel.webview.postMessage(
                        {
                            command: 'сheckClipboard'
                        }
                    );
                    DEP.isChangeView = false;
                }
                DEP.activeFilename = document
                .fileName;
            } else {
                DEP.isChangeView = true;
                DEP.activeFilename = '';
            }
        }
    )
    webviewPanel.onDidDispose(
        function () {
            log("webviewPanel disposed");
            webviewPanel.webview.postMessage(
                {command: 'deleteState'}
            );
            DEP.activeWebviews.delete (
                webviewPanel
            );
        }
    )
}

async function saveToNewFile(uri, diagram) {
    var data;
    log(
        "saveToNewFile called",
        {
            uri: uri.toString(),
            diagram: diagram
        }
    )
    try {
        data = JSON.stringify(
            diagram,
            null,
            2
        );
        await vscode.workspace.fs.writeFile(
            uri,
            Buffer.from(data)
        );
        log(
            "File saved successfully",
            uri.toString()
        );
    } catch (err) {
        log("Failed to save diagram", err);
        vscode.window.showErrorMessage(
            'Failed to save diagram: ' + err
        );
    }
}

function setCustomTheme(theme) {
    DEP.customTheme = theme;
    updateThemeForAllPanels()
}

async function setLanguage() {
    var choice, config;
    config = vscode.workspace.getConfiguration(
        'Drakonwidget'
    );
    choice = await vscode.window.showQuickPick(
        ["english", "russian"],
        {placeHolder: "Select a language"}
    )
    if (choice) {
        await config.update(
            'languageForPseudoCode',
            choice,
            vscode.ConfigurationTarget.Global
        );
    }
}

async function showSaveDialog(defaultName) {
    var result, sanitizedName;
    log(
        "showSaveDialog called",
        {defaultName: defaultName}
    )
    sanitizedName = defaultName.replace(
        /[\\/:  *  ? "<>|]/g, '_')
    
    result = await vscode.window.showSaveDialog(
        {
            defaultUri: vscode.Uri.file(
                path.join(
                    getWorkspaceFolder(),
                    sanitizedName + '.drakon'
                )
            ),
            filters: {
                'Diagrams': [
                    'drakon',
                    'graf',
                    'free'
                ]
            },
            saveLabel: 'Save Diagram'
        }
    )
    log(
        "showSaveDialog result",
        result ? result.toString(): ''
    )
    return result
}

function updateThemeForAllPanels() {
    var theme;
    theme = DEP.customTheme || (
        vscode.window.activeColorTheme.kind ===
        vscode.ColorThemeKind.Light ? 'vscode-light':
        'vscode-dark'
    );
    DEP.activeWebviews.forEach(
        function (webviewPanel) {
            webviewPanel.webview.postMessage(
                {
                    command: 'applyTheme',
                    themeClass: theme,
                    isCustom: !!DEP.customTheme
                }
            );
        }
    )
}

DrakonEditorProvider.prototype.getWebviewContent = getWebviewContent
DrakonEditorProvider.prototype.resolveCustomTextEditor = resolveCustomTextEditor
DrakonEditorProvider.prototype.handleDiagramUpdate = handleDiagramUpdate
DrakonEditorProvider.prototype.showSaveDialog = showSaveDialog
DrakonEditorProvider.prototype.saveToNewFile = saveToNewFile

module.exports.activate = activate;
module.exports.deactivate = deactivate;
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

function toggleShowIds() {
    var message;
    message = {
        command: 'toggleShowIds'
    };
    DEP.activeWebviews.forEach(function (webview) {
        webview.webview.postMessage(message);
    });
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
            '.' + diagram.type
        );
        if (currentName !== diagram.name) {
            newUri = vscode.Uri.file(
                path.join(
                    path.dirname(
                        document.fileName
                    ),
                    diagram.name + '.' + diagram
                    .type
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
    var defaultName, emptyDiagram, type, uri;
    type = await vscode.window.showQuickPick(
        ['drakon', 'graf', 'free'],
        {
            placeHolder: 'Выберите тип диаграммы'
        }
    )
    if (type) {
        defaultName = 'НоваяСхема_' + getCurrentDateTimeString();
        uri = await exports.provider.showSaveDialog(
            defaultName,
            type
        )
        if (uri) {
            emptyDiagram = {type: type, items: {}};
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
    // Existing commands
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.newDiagram', newDiagram)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.setLanguage', setLanguage)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.toggleShowIds', toggleShowIds)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.genPseudo', async () => { await generateOutput('pseudo'); })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.generateAST', async () => { await generateOutput('ast'); })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.generateDrakon', async () => { await generateDrakon(); })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.openFile', openFile)
    );
    // Theme commands (light/dark/reset)
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.theme.light', () => { setCustomTheme('drakon-light'); vscode.window.showInformationMessage('DRAKON: Light theme activated'); })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.theme.dark', () => { setCustomTheme('drakon-dark'); vscode.window.showInformationMessage('DRAKON: Dark theme activated'); })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.theme.reset', () => { setCustomTheme(null); vscode.window.showInformationMessage('DRAKON: Theme reset to VS Code default'); })
    );
    // New command: interactive theme selection / colour editing
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.selectTheme', selectTheme)
    );
    // Optional hidden command to clear manual override
    context.subscriptions.push(
        vscode.commands.registerCommand('drakon.resetThemeSync', async () => {
            await context.globalState.update('drakon.manualTheme', undefined);
            await updateThemeForAllPanels();
            vscode.window.showInformationMessage('DRAKON: Manual theme override cleared');
        })
    );
    // React to VS Code colour theme changes (only when no manual override)
    context.subscriptions.push(
        vscode.window.onDidChangeActiveColorTheme(async () => {
            const manual = context.globalState.get('drakon.manualTheme');
            if (!manual) {
                const answer = await vscode.window.showInformationMessage(
                    `VS Code switched theme. Apply matching Drakon theme?`,
                    'Yes', 'No'
                );
                if (answer === 'Yes') {
                    const widgetTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? 'Dark' : 'Light';
                    const themeData = await requestThemeData(widgetTheme);
                    sendApplyTheme(widgetTheme, themeData);
                    await context.globalState.update('drakon.manualTheme', widgetTheme);
                }
            }
        })
    );
}

// ---------- Helper constants ----------
const COMMON_COLOURS = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffea00', '#ff7f00', '#7f00ff', '#00ffff', '#ff00ff',
    '#1976d2', '#ffdead'
];

// ---------- Theme selection command ----------
async function selectTheme() {
    log("selectTheme: command started");
    const panel = getAnyActivePanel();
    if (!panel) {
        vscode.window.showWarningMessage("Пожалуйста, сначала откройте схему ДРАКОН (.drakon, .graf, .free), чтобы выбрать или настроить тему.");
        log("selectTheme: no active panel found, exiting");
        return;
    }
    const themeNames = await requestThemeList();
    log("selectTheme: retrieved themeNames", themeNames);
    
    const options = ['[+] Создать новую тему...'].concat(themeNames);
    const chosen = await vscode.window.showQuickPick(options, { placeHolder: 'Выберите тему DrakonWidget или создайте свою' });
    if (!chosen) {
        log("selectTheme: no theme chosen, exiting");
        return;
    }
    
    if (chosen === '[+] Создать новую тему...') {
        const name = await vscode.window.showInputBox({
            prompt: 'Введите имя для вашей новой темы:',
            placeHolder: 'Моя Новая Тема',
            validateInput: v => v && v.trim() ? null : 'Имя темы не может быть пустым'
        });
        if (!name) { return; }
        
        if (themeNames.includes(name)) {
            vscode.window.showErrorMessage(`Тема с именем "${name}" уже существует.`);
            return;
        }
        
        const newThemeColors = {
            lineWidth: 1,
            background: "#ffffff",
            iconBorder: "#000000",
            iconBack: "#e0e0e0",
            shadowColor: "rgba(0,0,0,0.1)"
        };
        
        await sendApplyTheme(name, newThemeColors);
        await editColoursInteractively(name, newThemeColors);
        return;
    }
    
    log(`selectTheme: chosen theme "${chosen}"`);
    const action = await vscode.window.showQuickPick(
        ['Применить без изменений', 'Редактировать colours'],
        { placeHolder: `Что сделать с темой "${chosen}"?` }
    );
    if (!action) {
        log("selectTheme: no action chosen, exiting");
        return;
    }
    log(`selectTheme: chosen action "${action}"`);
    let themeData = await requestThemeData(chosen);
    log("selectTheme: retrieved themeData", themeData);
    if (action === 'Редактировать colours') {
        await editColoursInteractively(chosen, themeData);
    } else {
        await sendApplyTheme(chosen, themeData);
        const context = exports.provider ? exports.provider.context : null;
        if (context) {
            await context.globalState.update('drakon.manualTheme', chosen);
            await persistCustomTheme(chosen, themeData);
        }
        vscode.window.showInformationMessage(`Drakon theme "${chosen}" applied`);
    }
}

// Request list of theme names from the WebView
async function requestThemeList() {
    const panel = getAnyActivePanel();
    if (!panel) {
        log("requestThemeList: no active panel found!");
        return [];
    }
    log("requestThemeList: sending requestThemeList message to WebView");
    return new Promise(resolve => {
        const listener = panel.webview.onDidReceiveMessage(msg => {
            log("requestThemeList: received message from WebView", msg);
            if (msg.command === 'themeList') {
                listener.dispose();
                resolve(msg.themes);
            }
        });
        panel.webview.postMessage({ command: 'requestThemeList' });
    });
}

// Request full theme data for a given name
async function requestThemeData(name) {
    const panel = getAnyActivePanel();
    if (!panel) { return {}; }
    return new Promise(resolve => {
        const listener = panel.webview.onDidReceiveMessage(msg => {
            if (msg.command === 'themeData' && msg.theme === name) {
                listener.dispose();
                resolve(msg.data);
            }
        });
        panel.webview.postMessage({ command: 'requestThemeData', theme: name });
    });
}

// Tell the WebView to open the beautiful graphical Theme Color Editor dialog
async function editColoursInteractively(themeName, themeObj) {
    const panel = getAnyActivePanel();
    if (panel) {
        log(`editColoursInteractively: telling WebView to open graphical color editor for "${themeName}"`);
        panel.webview.postMessage({ command: 'openThemeColorEditor' });
    }
}

// Send applyTheme message to all active webviews
async function sendApplyTheme(name, data) {
    DEP.activeWebviews.forEach(panel => {
        panel.webview.postMessage({ command: 'applyTheme', themeName: name, themeData: data });
    });
    // Also store in DEP.customTheme so future panels pick it up
    DEP.customTheme = name;
    updateThemeForAllPanels();
}

// Persist custom theme in VS Code globalState
async function persistCustomTheme(name, data) {
    const context = exports.provider ? exports.provider.context : null;
    if (!context) { return; }
    const stored = context.globalState.get('drakon.customThemes') || {};
    stored[name] = data;
    await context.globalState.update('drakon.customThemes', stored);
}

// Utility: get any active panel (first from the set)
function getAnyActivePanel() {
    for (const p of DEP.activeWebviews) { return p; }
    return null;
}

// Load stored custom themes into the WebView when a panel is created
function loadStoredCustomThemesIntoWebview(panel) {
    const context = exports.provider ? exports.provider.context : null;
    if (!context) { return; }
    const stored = context.globalState.get('drakon.customThemes') || {};
    panel.webview.postMessage({ command: 'loadCustomThemes', themes: stored });
}

// Modify resolveCustomTextEditor to call loadStoredCustomThemesIntoWebview after html is set
// (Will be inserted later in the file)


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
    loadStoredCustomThemesIntoWebview(webviewPanel)
    const manualTheme = this.context.globalState.get('drakon.manualTheme');
    if (manualTheme) {
        const customThemes = this.context.globalState.get('drakon.customThemes') || {};
        if (customThemes[manualTheme]) {
            webviewPanel.webview.postMessage({
                command: 'applyTheme',
                themeName: manualTheme,
                themeData: customThemes[manualTheme]
            });
        } else {
            webviewPanel.webview.postMessage({
                command: 'applyTheme',
                themeClass: manualTheme,
                isCustom: true
            });
        }
    } else {
        webviewPanel.webview.postMessage(
            {
                command: 'applyTheme',
                themeClass: currentTheme,
                isCustom: false
            }
        )
    }
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
                case 'log':
                    log("[WebView] " + message.message);
                    return;
                case 'saveCustomTheme':
                    if (message.themeName && message.themeData) {
                        log("Saving custom theme from webview:", message.themeName);
                        await this.context.globalState.update('drakon.manualTheme', message.themeName);
                        
                        // Persist it in globalState
                        const stored = this.context.globalState.get('drakon.customThemes') || {};
                        stored[message.themeName] = message.themeData;
                        await this.context.globalState.update('drakon.customThemes', stored);
                        
                        vscode.window.showInformationMessage(`Цветовая схема "${message.themeName}" успешно сохранена.`);
                    }
                    return;
                case 'deleteCustomTheme':
                    if (message.themeName) {
                        log("Deleting custom theme:", message.themeName);
                        const stored = this.context.globalState.get('drakon.customThemes') || {};
                        delete stored[message.themeName];
                        await this.context.globalState.update('drakon.customThemes', stored);
                        
                        // Clear manual theme if it was the deleted one
                        const manualTheme = this.context.globalState.get('drakon.manualTheme');
                        if (manualTheme === message.themeName) {
                            await this.context.globalState.update('drakon.manualTheme', undefined);
                        }
                        
                        vscode.window.showInformationMessage(`Цветовая схема "${message.themeName}" успешно удалена.`);
                        updateThemeForAllPanels();
                    }
                    return;
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

async function setCustomTheme(theme) {
    DEP.customTheme = theme;
    if (exports.provider && exports.provider.context) {
        await exports.provider.context.globalState.update('drakon.manualTheme', theme || undefined);
    }
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

async function showSaveDialog(defaultName, type) {
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
                    sanitizedName + '.' + type
                )
            ),
            filters: {'Diagrams': [type]},
            saveLabel: 'Save Diagram'
        }
    )
    log(
        "showSaveDialog result",
        result ? result.toString(): ''
    )
    return result
}

async function updateThemeForAllPanels() {
    let manualTheme = null;
    let customThemes = {};
    if (exports.provider && exports.provider.context) {
        manualTheme = exports.provider.context.globalState.get('drakon.manualTheme');
        customThemes = exports.provider.context.globalState.get('drakon.customThemes') || {};
    }
    const activeTheme = manualTheme || DEP.customTheme;
    DEP.activeWebviews.forEach(
        function (webviewPanel) {
            if (activeTheme) {
                if (customThemes[activeTheme]) {
                    webviewPanel.webview.postMessage({
                        command: 'applyTheme',
                        themeName: activeTheme,
                        themeData: customThemes[activeTheme]
                    });
                } else {
                    webviewPanel.webview.postMessage({
                        command: 'applyTheme',
                        themeClass: activeTheme,
                        isCustom: true
                    });
                }
            } else {
                const vsTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light ? 'vscode-light' : 'vscode-dark';
                webviewPanel.webview.postMessage({
                    command: 'applyTheme',
                    themeClass: vsTheme,
                    isCustom: false
                });
            }
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
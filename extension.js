const vscode = require('vscode');
const path = require('path');

function activate(context) {
    const disposable = vscode.commands.registerCommand('drakonwidget.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'drakonWidget',
            'DrakonWidget',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(context.extensionPath)]
            }
        );

        const extPath = context.extensionPath;
        const extPathUri = panel.webview.asWebviewUri(vscode.Uri.file(extPath));

        panel.webview.html = getWebviewContent(extPathUri + "/drakonwidget");
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(extPathUri) {
    return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>DrakonWidget online demo</title>
    <script>
        const extensionBaseUri = "${extPathUri}";
    </script>
    <meta name="description" content="DrakonWidget online demo shows how to use DrakonWidget in your application. This demo is an online
        mini-editor for drakon flowcharts that does not require registration." />
        <meta property="og:title" content="DrakonWidget online demo">
        <meta property="og:description" content="DrakonWidget online demo shows how to use DrakonWidget in your application. This demo is an online
        mini-editor for drakon flowcharts that does not require registration.">
        <meta property="og:image" content="${extPathUri}/images/drakon-widget-hero.png">
    <link rel="shortcut icon" href="${extPathUri}/images/favicon.ico" />
    <link rel="icon" type="image/png" href="${extPathUri}/images/favicon.png" />
    <style>
        *,
        *:before,
        *:after {
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            box-sizing: border-box;
        }
    </style>
    <link rel="stylesheet" href="${extPathUri}/styles/reset.css" />
    <link rel="stylesheet" href="${extPathUri}/styles/main.css" />
</head>

<body>
    <div id="main">
        <div id="left-toolbar"></div>
        <div id="editor-area"></div>
        <div id="menu" class="main-menu shadow">
            <div class="menu-block">
                <div id="close-button" class="generic-button simple-button" style="padding-left:0px;">
                    <img src="${extPathUri}/images/delete.png"><span>Close</span>
                </div>
                <div class="menu-header">DrakonWidget online demo</div>
            </div>
            <div class="menu-block">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 60px;">
                            <div><img class="menu-logo" src="${extPathUri}/images/dra2.png" /></div>
                        </td>
                        <td style="width: calc(100% - 60px); text-align: right; vertical-align: top;">
                            <p><a href="https://github.com/stepan-mitkin/drakonwidget">Documentation</a></p>
                            <p>
                            <div id="create-diagram-button" class="generic-button default-button"
                                style="margin-right:0px;">Create diagram</div>
                            </p>
                        </td>
                    </tr>
                </table>

            </div>
            <div class="menu-block">
                <div class="menu-label">Select diagram</div>
                <select id="diagrams-combobox" class="main-menu-combobox"></select>
            </div>
            <div class="menu-block">
                <div id="delete-diagram-button" class="generic-button simple-button">Delete diagram</div>
                <div id="duplicate-diagram-button" class="generic-button simple-button">Duplicate diagram</div>
                <div id="set-diagram-json-button" class="generic-button simple-button"
                    style="margin-right: 0px;">Diagram JSON...
                </div>
            </div>
            <div class="menu-block">
                <div class="menu-label">Color theme</div>
                <select id="themes-combobox" class="main-menu-combobox"></select>
            </div>
            <div class="menu-block" style="height: 46px;">
                <div id="set-theme-json-button" class="generic-button simple-button right-button"
                    style="margin-right: 0px;">Theme JSON...</div>
            </div>
            <div class="menu-block">
                <div class="menu-label">Editor mode</div>
                <select id="modes-combobox" class="main-menu-combobox"></select>
            </div>
            <div class="menu-block">
                <div id="reset-all-diagrams-button" class="generic-button bad-button">Reset all diagrams</div>
            </div>
            <div style="height: 10px"></div>
        </div>
        <div id="snack-root"></div>
        <div id="question-root"></div>
        <div id="popup-root"></div>

    </div>
    <script src="${extPathUri}/libs/drakonwidget.js"></script>
    <script src="${extPathUri}/libs/mousetrap.min.js"></script>
    <script src="${extPathUri}/libs/simplewidgets.js"></script>
    <script src="${extPathUri}/js/examples.js"></script>
    <script src="${extPathUri}/js/themes.js"></script>
    <script src="${extPathUri}/js/main.js"></script>
</body>

</html>
`;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
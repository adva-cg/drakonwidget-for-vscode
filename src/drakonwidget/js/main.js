

// Created with Drakon Tech https://drakon.tech/

(function() {

    // Forward only errors to the extension (console.log flood blocks the webview on open)
    const oldError = console.error;
    console.error = function(...args) {
        oldError.apply(console, args);
        if (window.vscode) {
            const message = '[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            window.vscode.postMessage({
                command: 'log',
                message: message.length > 500 ? message.slice(0, 500) + '…' : message
            });
        }
    };

var m
m = {}
m.iconSize = 20
m.widgets
m.drakon
m.currentMode = "write"

    console.log('WEBVIEW_NAMESPACE: ' + WEBVIEW_NAMESPACE);

    // Кастомное хранилище с пространствами
    const isolatedStorage = {
        setItem: (key, value) => {
            const namespacedKey = `${WEBVIEW_NAMESPACE}:${key}`;
            localStorage.setItem(namespacedKey, JSON.stringify(value));
        },

        getItem: (key) => {
            const namespacedKey = `${WEBVIEW_NAMESPACE}:${key}`;
            const value = localStorage.getItem(namespacedKey);
            return value ? JSON.parse(value) : null;
        },

        removeItem: (key) => {
            const namespacedKey = `${WEBVIEW_NAMESPACE}:${key}`;
            localStorage.removeItem(namespacedKey);
        },

        clear: () => {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(WEBVIEW_NAMESPACE + ':')) {
                    localStorage.removeItem(key);
                }
            });
        }
    };
    // Делаем хранилище глобально доступным для этого WebView
    window.isolatedStorage = isolatedStorage;

    document.getElementById('themes-combobox').addEventListener('change', function () {
        if (window.vscode) {
            window.vscode.postMessage({
                command: 'changeTheme',
                theme: this.value
            });
        }
    });

function add(parent, child) {
    parent.appendChild(child)
}

function addIconButton(container, image, action, tooltip) {
    var br, button;
    button = m.widgets.createIconButton(
        extensionBaseUri + "/images/" + image,
        action,
        tooltip
    )
    button.style.marginBottom = "3px"
    add(container, button)
    br = document.createElement("br")
    add(container, br)
}

function addIconPath(item) {
    if (item.icon) {
        item.icon = extensionBaseUri + "/images/"
        + item.icon
    }
}

function addInsertButton(container, image, type, tooltip, shortcut) {
    var action;
    action = function () {
        insertIcon(type)
    }
    addIconButton(
        container,
        image,
        action,
        tooltip
    )
    if (shortcut) {
        Mousetrap.bind(
            shortcut.toLowerCase(),
            action,
            "keydown"
        )
    }
}

function addOption(select, value, text) {
    var option;
    option = document.createElement('option');
    option.value = value
    addText(option, text);
    add(select, option)
}

function addRowToToolbar(container) {
    var row;
    row = document.createElement('div');
    row.className = 'toolbar-row';
    container.appendChild(row);
    return row
}

function addText(element, text) {
    var newNode;
    newNode = document.createTextNode(text);
    add(element, newNode)
}

function addToBuffer(buffer, ch) {
    buffer.text += ch
}

function addToolbarRow(container, icon1, command1, tip1, icon2, command2, tip2) {
    var btn1, btn2, row;
    row = addRowToToolbar(container)
    if (icon1) {
        btn1 = m.widgets.createIconButton(
            `${extensionBaseUri}/images/${icon1}`,
            command1,
            tip1
        );
        row.appendChild(btn1)
    }
    if (icon2) {
        btn2 = m.widgets.createIconButton(
            `${extensionBaseUri}/images/${icon2}`,
            command2,
            tip2
        );
        row.appendChild(btn2)
    }
    return row
}

function addVSpace(toolbar) {
    var space;
    space = div()
    space.style.height = "5px";
    add(toolbar, space)
}

function addZooomLevel(items, value, text) {
    items.push(
        {
            text: text,
            action: function () {
                setZoom(value)
            }
        }
    )
}

function arrowDown(evt) {
    evt.preventDefault()
    m.drakon.arrowDown()
}

function arrowLeft(evt) {
    evt.preventDefault()
    m.drakon.arrowLeft()
}

function arrowRight(evt) {
    evt.preventDefault()
    m.drakon.arrowRight()
}

function arrowUp(evt) {
    evt.preventDefault()
    m.drakon.arrowUp()
}

function buildConfig() {
    var canSelect, config, currentTheme, themeStr;
    canSelect = (
        m.currentMode !== "no-select"
    );
    currentTheme = localStorage.getItem(
        "current-theme"
    ) || "theme-class";
    themeStr = localStorage.getItem(currentTheme);
    if (!themeStr) {
        currentTheme = "theme-class";
        themeStr = localStorage.getItem(currentTheme);
    }
    config = JSON.parse(themeStr) || {};
    config.startEditContent = startEditContent
    config.startEditSecondary = startEditSecondary
    config.startEditLink = startEditLink
    config.startEditStyle = startEditStyle
    config.startEditDiagramStyle = startEditDiagramStyle
    config.showContextMenu = showContextMenu
    config.onItemClick = onItemClick
    config.buildIconCore = buildIconCore
    config.getCursorForItem = getCursorForItem
    config.translate = tr
    config.drawZones = false
    config.canSelect = canSelect
    config.canvasIcons = false
    config.centerContent = false
    config.textFormat = "plain"
    config.showIds = localStorage.getItem("showIds") === "true"
    return config
}

function buildIconCore(context) {
    var core;
    core = {}
    Object.assign(core, context)
    core.buildDom = function () {
        return customBuildDom(core)
    }
    return core
}

function by(prop) {
    return function (leftObj, rightObj) {
        left = leftObj[prop]
        right = rightObj[prop]
        if (left < right) {
            return -1
        } else if (left > right) {
            return 1
        }
        return 0
    }
}

function checkClipboard() {
    var clipBoardType, content;
    content = localStorage.getItem(
        'clipboard'
    )
    if (content) {
        clipBoardType = localStorage.getItem(
            'clipboard-type'
        )
        if (clipBoardType) {
            m.drakon.showPasteSockets(clipBoardType)
        }
    }
    console.log('сheckClipboard todo')
}

function closeMenu() {
    var menu;
    menu = get("menu")
    menu.style.display = "none"
}

function completeBuffer(buffer, par) {
    var _sw_8, em, strong;
    if (buffer.text) {
        _sw_8 = buffer.type;
        if (_sw_8 === "normal") {
            addText(par, buffer.text)
        } else {
            if (_sw_8 === "strong") {
                strong = document.createElement("strong")
                addText(strong, buffer.text)
                add(par, strong)
            } else {
                if (_sw_8 === "em") {
                } else {
                    throw new Error("Unexpected Choice value: " + _sw_8);
                }
                em = document.createElement("em")
                addText(em, buffer.text)
                add(par, em)
            }
        }
        buffer.text = ""
    }
}

function copy() {
    m.drakon.copySelection()
}

function createBuffer(type) {
    return {
        text: "",
        type: type
    }
}

function createEditSender() {
    return {
        stop: function () {},
        pushEdit: pushEdit
    }
}

function createEmptyDiagram(name) {
    var diagram, diagramStr, id, list;
    diagram = {name: name, items: {}}
    list = getDiagramList()
    id = generateId(list)
    diagramStr = JSON.stringify(diagram)
    list.push(id)
    isolatedStorage.setItem(
        "diagram-list",
        JSON.stringify(list)
    )
    isolatedStorage.setItem(id, diagramStr)
    return id
}

function createFreeAction(type, shortcut) {
    var action;
    action = function () {
        insertFree(type)
    }
    if (shortcut) {
        Mousetrap.bind(
            shortcut.toLowerCase(),
            action,
            "keydown"
        )
    }
    return action
}

function createInsertAction(type, shortcut) {
    var action;
    action = function () {
        insertIcon(type)
    }
    if (shortcut) {
        Mousetrap.bind(
            shortcut.toLowerCase(),
            action,
            "keydown"
        )
    }
    return action
}

function customBuildDom(core) {
    var color, container, font, icon, paddingBottom, paddingLeft, paddingRight, paddingTop, textAlign;
    if (core.type === "action") {
        paddingTop = core.config.padding + "px"
        paddingBottom = core.config.padding + "px"
        paddingLeft = core.config.padding + "px"
        paddingRight = core.config.padding + "px"
        color = getThemeValue(core, "color")
        textAlign = getThemeValue(
            core,
            "textAlign"
        )
        textAlign = textAlign || "left"
        font = getThemeValue(core, "font")
        font = font || core.config.font
        container = div("icon-container")
        container.style.display = "inline-block"
        container.style.position = "absolute"
        container.style.left = "0px"
        container.style.top = "0px"
        container.style.paddingLeft = paddingLeft
        container.style.paddingTop = paddingTop
        container.style.paddingRight = paddingRight
        container.style.paddingBottom = paddingBottom
        container.style.color = color
        container.style.font = font
        container.style.textAlign = textAlign
        container.style.minWidth = core.config.minWidth
        + "px"
        container.style.maxWidth = core.config.maxWidth
        + "px"
        container.style.lineHeight = core.config.lineHeight
        * 100 + "%"
        parseHomeMadeMarkdown(
            core.content,
            container
        )
        if (core.link) {
            container.style.paddingLeft = core.config.padding
            * 2 + m.iconSize + "px"
            icon = document.createElement("img")
            icon.src = extensionBaseUri + "/images/link.png"
            icon.style.width = m.iconSize + "px"
            icon.style.height = m.iconSize + "px"
            icon.style.display = "inline-block"
            icon.style.position = "absolute"
            icon.style.verticalAlign = "middle"
            icon.style.left = core.config.padding + "px"
            icon.style.top = "50%"
            icon.style.transform = "translateY(-50%)"
            add(container, icon)
            return container
        }
    } else {
        return undefined
    }
}

function cut() {
    m.drakon.cutSelection()
}

function debounce(action, delay) {
    var onTimeout, resetDebounce, timeoutId;
    timeoutId = undefined
    onTimeout = function () {
        timeoutId = undefined
        action()
    }
    resetDebounce = function () {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(
            onTimeout,
            delay
        )
    }
    return function () {
        resetDebounce()
    }
}

function deleteSelection() {
    m.drakon.deleteSelection()
}

function deleteStateDrakon() {
    isolatedStorage.removeItem(
        "drakon-state"
    )
}

function div(className) {
    var element;
    element = document.createElement("div")
    if (className) {
        element.className = className
    }
    return element
}

function editContent() {
    m.drakon.editContent()
}

async function editDescription(ign, evt) {
    var currentDescription, currentDiagramId, diagram, diagramStr, newContent;
    currentDiagramId = isolatedStorage.getItem(
        "current-diagram"
    )
    if (currentDiagramId) {
        diagramStr = isolatedStorage.getItem(
            currentDiagramId
        );
        diagram = JSON.parse(diagramStr);
        currentDescription = diagram.description
        || "";
        newContent = await m.widgets.largeBox(
            evt.clientX,
            evt.clientY,
            tr("Description"),
            currentDescription
        );
        if ((newContent) && (!(newContent === currentDescription))) {
            m.drakon.setDiagramProperty(
                "description",
                newContent
            )
        }
    }
}
function showConfirmDialog(message) {
    return new Promise(resolve => {
        const dlg = document.createElement('div');
        dlg.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.6);
            display: flex; align-items: center; justify-content: center; z-index: 10001;
        `;
        const box = document.createElement('div');
        box.style.cssText = `
            background: #2d2d2d; color: #eee; padding: 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5); max-width: 320px; text-align: center;
        `;
        const msg = document.createElement('p');
        msg.style.marginBottom = '16px';
        msg.innerText = message;
        const yes = document.createElement('button');
        yes.innerText = 'Да';
        yes.style.cssText = 'margin-right:12px;background:#4caf50;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;';
        const no = document.createElement('button');
        no.innerText = 'Нет';
        no.style.cssText = 'background:#c33;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;';
        yes.onclick = () => { document.body.removeChild(dlg); resolve(true); };
        no.onclick = () => { document.body.removeChild(dlg); resolve(false); };
        box.append(msg, yes, no);
        dlg.appendChild(box);
        document.body.appendChild(dlg);
    });
}


function eventListener(event) {
    var _sw_9, currentDiagram, diagram, diagramStr;
    if (event.data) {
        _sw_9 = event.data.command;
        if (_sw_9 === 'toggleShowIds') {
            toggleShowIds();
        } else if (_sw_9 === 'showItem') {
            if (event.data.itemId && m.drakon) {
                m.drakon.showItem(event.data.itemId);
            }
        } else if (_sw_9 === 'globalSearchResults') {
            if (window.activeGlobalSearchResultsHandler) {
                window.activeGlobalSearchResultsHandler(event.data.results || []);
            }
        } else if (_sw_9 === 'loadDiagram') {
            diagram = event.data.diagram
            isolatedStorage.setItem(
                diagram.id,
                JSON.stringify(diagram)
            )
            isolatedStorage.setItem(
                'current-diagram',
                diagram.id
            )
            if (m.drakon) {
                openDiagram(diagram.id)
            } else {
                console.error(
                    "Drakon widget not initialized!"
                )
            }
        } else {
            if (_sw_9 === 'updateFilename') {
                updateFilename(event.data.filename)
            } else {
                if (_sw_9 === 'checkClipboard') {
                    checkClipboard()
                } else {
                    if (_sw_9 === 'restoreState') {
                        restoreStateDrakon()
                    } else {
                        if (_sw_9 === 'deleteState') {
                            deleteStateDrakon()
                        } else {
                            if (_sw_9 === 'revertFilename') {
                                currentDiagram = isolatedStorage.getItem(
                                    "current-diagram"
                                )
                                diagramStr = isolatedStorage.getItem(
                                    currentDiagram
                                )
                                diagram = JSON.parse(diagramStr)
                                diagram.name = event.data.filename
                                isolatedStorage.setItem(
                                    currentDiagram,
                                    JSON.stringify(diagram)
                                )
                                if (m.drakon) {
                                    m.drakon.setDiagram(
                                        currentDiagram,
                                        diagram,
                                        createEditSender(),
                                        true
                                    )
                                    console.log(
                                        'revertFilename. Diagram: ',
                                        JSON.stringify(diagram, null, 2)
                                    )
                                }
                            } else {
                                if (_sw_9 === 'requestThemeList') {
                                    console.log("WebView received requestThemeList");
                                    const list = getThemes() || [];
                                    const names = [];
                                    for (const themeId of list) {
                                        const themeStr = localStorage.getItem(themeId);
                                        if (themeStr) {
                                            const themeObj = JSON.parse(themeStr);
                                            names.push(themeObj.name || themeObj.id);
                                        } else {
                                            console.log("Warning: themeId " + themeId + " found in list but missing from localStorage");
                                        }
                                    }
                                    console.log("WebView sending themeList: " + JSON.stringify(names));
                                    window.vscode.postMessage({
                                        command: 'themeList',
                                        themes: names
                                    });
                                } else if (_sw_9 === 'requestThemeData') {
                                    const name = event.data.theme;
                                    console.log("WebView received requestThemeData for name: " + name);
                                    const list = getThemes() || [];
                                    let themeData = {};
                                    for (const themeId of list) {
                                        const themeStr = localStorage.getItem(themeId);
                                        if (themeStr) {
                                            const themeObj = JSON.parse(themeStr);
                                            if (themeObj.name === name || themeObj.id === name) {
                                                themeData = themeObj.theme || {};
                                                console.log("Found matching theme: " + themeId);
                                                break;
                                            }
                                        }
                                    }
                                    console.log("WebView sending themeData for " + name + ": " + JSON.stringify(themeData));
                                    window.vscode.postMessage({
                                        command: 'themeData',
                                        theme: name,
                                        data: themeData
                                    });
                                } else if (_sw_9 === 'loadCustomThemes') {
                                    console.log("WebView received loadCustomThemes, payload:", event.data.themes);
                                    if (event.data.themes) {
                                        // Ensure default themes are initialized first
                                        loadThemes();

                                        const currentIds = getThemes() || [];
                                        console.log("Current theme IDs before merge:", JSON.stringify(currentIds));
                                        
                                        const incomingIds = [];
                                        for (const [name, data] of Object.entries(event.data.themes)) {
                                            let themeObj = data;
                                            let themeId = name;
                                            if (!themeObj || typeof themeObj !== 'object') {
                                                continue;
                                            }
                                            if (!themeObj.id) {
                                                themeObj = {
                                                    name: name,
                                                    id: name,
                                                    theme: data
                                                };
                                            } else {
                                                themeId = themeObj.id;
                                            }
                                            incomingIds.push(themeId);
                                            
                                            console.log("Saving custom theme: " + themeId + " -> " + JSON.stringify(themeObj));
                                            localStorage.setItem(themeId, JSON.stringify(themeObj));
                                            
                                            if (currentIds.indexOf(themeId) === -1) {
                                                currentIds.push(themeId);
                                            }
                                        }
                                        
                                        // Clean up custom themes that are in currentIds but not in incomingIds
                                        const builtInIds = [
                                            "theme-bq", "theme-str", "theme-class", "theme-egg", 
                                            "theme-green", "theme-greys", "theme-gow", "theme-white",
                                            "theme-black", "theme-space"
                                        ];
                                        
                                        const finalIds = currentIds.filter(id => {
                                            const isBuiltIn = builtInIds.indexOf(id) !== -1;
                                            const isIncoming = incomingIds.indexOf(id) !== -1;
                                            if (!isBuiltIn && !isIncoming) {
                                                console.log("Cleaning up deleted custom theme from localStorage:", id);
                                                localStorage.removeItem(id);
                                                return false;
                                            }
                                            return true;
                                        });
                                        
                                        console.log("Saving updated theme list after cleanup:", JSON.stringify(finalIds));
                                        localStorage.setItem('themes', JSON.stringify(finalIds));
                                    }
                                } else if (_sw_9 === 'openThemeColorEditor') {
                                    console.log("WebView received openThemeColorEditor");
                                    showThemeColorEditor();
                                } else {
                                    if (_sw_9 === 'applyTheme') {
                                        console.log("WebView received applyTheme. data:", event.data);
                                        if (event.data.themeData) {
                                            let themeObj = event.data.themeData;
                                            
                                            // Find if there is an existing theme in localStorage with this name or ID
                                            const list = getThemes() || [];
                                            let existingThemeId = null;
                                            for (const tid of list) {
                                                const tstr = localStorage.getItem(tid);
                                                if (tstr) {
                                                    const tobj = JSON.parse(tstr);
                                                    if (tobj.name === event.data.themeName || tobj.id === event.data.themeName) {
                                                        existingThemeId = tobj.id;
                                                        break;
                                                    }
                                                }
                                            }
                                            
                                            let themeId = existingThemeId || event.data.themeName || themeObj.id || "theme-custom";
                                            if (!themeObj.id) {
                                                themeObj = {
                                                    name: event.data.themeName || "Custom",
                                                    id: themeId,
                                                    theme: event.data.themeData
                                                };
                                            }
                                            console.log("applyTheme (themeData) applying custom theme: " + themeId);
                                            localStorage.setItem(themeId, JSON.stringify(themeObj));
                                            localStorage.setItem("current-theme", themeId);
                                            
                                            // Add to themes list if not already there so it persists across reloads
                                            const currentIds = getThemes() || [];
                                            if (currentIds.indexOf(themeId) === -1) {
                                                currentIds.push(themeId);
                                                localStorage.setItem('themes', JSON.stringify(currentIds));
                                                console.log("Added theme " + themeId + " to themes list");
                                            }
                                            
                                            const combo = document.getElementById("themes-combobox");
                                            if (combo) {
                                                let optionExists = false;
                                                for (let i = 0; i < combo.options.length; i++) {
                                                    if (combo.options[i].value === themeId) {
                                                        optionExists = true;
                                                        break;
                                                    }
                                                }
                                                if (!optionExists) {
                                                    const opt = document.createElement("option");
                                                    opt.value = themeId;
                                                    opt.text = themeObj.name || themeId;
                                                    combo.appendChild(opt);
                                                    console.log("Added option to themes-combobox: " + themeId);
                                                }
                                                combo.value = themeId;
                                            }
                                            reloadCurrent();
                                        } else if (event.data.themeClass) {
                                            console.log("applyTheme (themeClass) applying theme class: " + event.data.themeClass);
                                            if (event.data.themeClass.startsWith("theme-")) {
                                                localStorage.setItem("current-theme", event.data.themeClass);
                                                const combo = document.getElementById("themes-combobox");
                                                if (combo) {
                                                    combo.value = event.data.themeClass;
                                                }
                                                reloadCurrent();
                                                return;
                                            }
                                            
                                            document.body.classList.remove(
                                                'vscode-light',
                                                'vscode-dark',
                                                'drakon-light',
                                                'drakon-dark'
                                            );
                                            document.body.classList.add(event.data.themeClass);
                                            let themeKey = "theme-class";
                                            if (event.data.themeClass.includes('dark')) {
                                                themeKey = "theme-black";
                                            } else if (event.data.themeClass === 'drakon-light') {
                                                themeKey = "theme-bq";
                                            }
                                            console.log("Setting current-theme to: " + themeKey);
                                            localStorage.setItem("current-theme", themeKey);
                                            const combo = document.getElementById("themes-combobox");
                                            if (combo) {
                                                combo.value = themeKey;
                                            }
                                            reloadCurrent();
                                        }
                                    } else {
                                        throw new Error("Unexpected Choice value: " + _sw_9);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function fillModes(modes) {
    modes.innerHTML = ""
    addOption(modes, "write", "Read/write")
    addOption(modes, "read", "Read-only")
    addOption(
        modes,
        "no-select",
        "Read-only, no select"
    )
    modes.value = m.currentMode
}

function fillThemes(combo) {
    var _6_col, _6_it, _6_length, theme, themeId, themes, themeStr;
    combo.innerHTML = ""
    themes = getThemes() || []
    _6_it = 0;
    _6_col = themes;
    _6_length = _6_col.length;
    while (true) {
        if (_6_it < _6_length) {
            themeId = _6_col[_6_it];
            themeStr = localStorage.getItem(themeId);
            if (themeStr) {
                theme = JSON.parse(themeStr);
                if (theme) {
                    addOption(combo, themeId, theme.name || theme.id || themeId)
                }
            }
            _6_it++;
        } else {
            break;
        }
    }
    combo.value = localStorage.getItem(
        "current-theme"
    )
}

function generateId(list) {
    var id;
    while (true) {
        id = "diagram-" + Math.floor(
            Math.random() * 1000 + 100
        )
        if (list.indexOf(id) != -1) {
        } else {
            break;
        }
    }
    return id
}

function get(id) {
    var element;
    element = document.getElementById(id)
    if (element) {
        return element
    } else {
        throw new Error(
            'get: Element with id not found: ' +
            id
        )
    }
}

function getCursorForItem(prim, pos, evt) {
    if (prim.type === "insertion") {
        if (onInsertionHotspot(prim, pos)) {
            return "pointer"
        } else {
            return "grab"
        }
    } else {
        if (((prim.type === "action") && (prim.link)) && (onActionHotspot(prim, pos))) {
            return "pointer"
        } else {
            return "grab"
        }
    }
}

function getDiagramList() {
    var list, listStr;
    listStr = isolatedStorage.getItem(
        "diagram-list"
    )
    list = undefined
    if (listStr) {
        try {
            list = JSON.parse(listStr)
        } catch (ex) {}
    }
    return list
}

function getDiagramObjects() {
    var _6_col, _6_it, _6_length, diagram, diagramStr, id, list, output;
    list = getDiagramList()
    output = {diagrams: []}
    _6_it = 0;
    _6_col = list;
    _6_length = _6_col.length;
    while (true) {
        if (_6_it < _6_length) {
            id = _6_col[_6_it];
            diagramStr = isolatedStorage.getItem(id)
            diagram = JSON.parse(diagramStr)
            output.diagrams.push(
                {id: id, name: diagram.name}
            )
            _6_it++;
        } else {
            break;
        }
    }
    output.currentDiagram = isolatedStorage.getItem(
        "current-diagram"
    )
    return output
}

function getThemeValue(core, name) {
    var theme;
    if ((core.style) && (core.style[name])) {
        return core.style[name]
    } else {
        theme = core.config.theme
        if (((theme.icons) && (theme.icons.action)) && (theme.icons.action[name])) {
            return theme.icons.action[name]
        } else {
            return theme[name]
        }
    }
}

function getThemes() {
    var str;
    str = localStorage.getItem("themes")
    if (str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.error("getThemes() parse error: " + e.message);
            return undefined;
        }
    } else {
        return undefined;
    }
}

function hideToolbar() {
    var editor;
    get('left-toolbar').style.display = 'none';
    get('show-toolbar-button').style.display
    = 'block'
    editor = get('editor-area');
    editor.style.left = '0px';
    editor.style.width = '100%'
    if (m.drakon) {
        onResize()
    }
}

function initButtonShow() {
    var showToolbarButton;
    showToolbarButton = m.widgets.createIconButton(
        `${extensionBaseUri}/images/right-angle2.png`,
        showToolbar,
        'Показать панель'
    );
    showToolbarButton.id = 'show-toolbar-button';
    // Give it an ID to be found later
    
    showToolbarButton.style.position = 'absolute';
    showToolbarButton.style.left = '5px';
    showToolbarButton.style.top = '5px';
    showToolbarButton.style.display = 'none';
    // Initially hidden
    
    showToolbarButton.style.zIndex = '1000';
    document.body.appendChild(
        showToolbarButton
    )
}

function initDrakonWidget() {
    m.drakon = createDrakonWidget()
}

function initIconPicture() {
}

function initShortcuts() {
    Mousetrap.bind(
        ['ctrl+c', 'command+c'],
        copy,
        "keydown"
    )
    Mousetrap.bind(
        ['ctrl+v', 'command+v'],
        paste,
        "keydown"
    )
    Mousetrap.bind(
        ['ctrl+x', 'command+x'],
        cut,
        "keydown"
    )
    Mousetrap.bind(
        ['ctrl+z', 'command+z'],
        undo,
        "keydown"
    )
    Mousetrap.bind(
        ['ctrl+y', 'command+y'],
        redo,
        "keydown"
    )
    Mousetrap.bind(
        ['del', 'backspace'],
        deleteSelection,
        "keydown"
    )
    Mousetrap.bind(
        'enter',
        editContent,
        "keydown"
    )
    Mousetrap.bind('up', arrowUp, "keydown")
    Mousetrap.bind(
        'down',
        arrowDown,
        "keydown"
    )
    Mousetrap.bind(
        'left',
        arrowLeft,
        "keydown"
    )
    Mousetrap.bind(
        'right',
        arrowRight,
        "keydown"
    )
}

function initToolbar(typeDiagram) {
    var _sw_39, below, toolbar;
    toolbar = get("left-toolbar")
    toolbar.innerHTML = ''
    addToolbarRow(
        toolbar,
        'left-angle2.png',
        hideToolbar,
        'Скрыть панель',
        'menu.png',
        showMenu,
        'Меню'
    )
    addToolbarRow(
        toolbar,
        'zoom.png',
        showZoom,
        'Масштаб',
        'description.png',
        editDescription,
        'Описание'
    )
    addToolbarRow(
        toolbar,
        'undo.png',
        undo,
        'Отменить. Ctrl+Z',
        'redo.png',
        redo,
        'Повторить. Ctrl+Y'
    )
    addToolbarRow(
        toolbar,
        'code.png',
        toggleShowIds,
        'Показать/скрыть ID',
        'search-s.png',
        showFindByIdDialog,
        'Перейти к иконе по ID'
    )
    addToolbarRow(
        toolbar,
        'text.png',
        showSearchTextDialog,
        'Поиск текста в иконах',
        'workspace-s2.png',
        showGlobalSearchDialog,
        'Глобальный поиск текста в проекте'
    )
    addVSpace(toolbar)
    _sw_39 = typeDiagram;
    if (_sw_39 === 'drakon') {
        initToolbarDrakon(toolbar)
    } else {
        if (_sw_39 === 'free') {
            initToolbarFree(toolbar)
        } else {
            if (_sw_39 === 'graf') {
            } else {
                throw new Error("Unexpected Choice value: " + _sw_39);
            }
            initToolbarGraf(toolbar)
        }
    }
    initIconPicture()
    below = div()
    below.style.height = "50px"
    add(toolbar, below)
}

function initToolbarDrakon(toolbar) {
    addToolbarRow(
        toolbar,
        'action.png',
        createInsertAction("action", "A"),
        'Действие. Key: A',
        'question.png',
        createInsertAction("question", "Q"),
        'Вопрос. Key: Q'
    )
    addToolbarRow(
        toolbar,
        'select.png',
        createInsertAction("select", "S"),
        'Выбор. Key: S',
        'case.png',
        createInsertAction("case", "C"),
        'Вариант. Key: C'
    )
    addToolbarRow(
        toolbar,
        'foreach.png',
        createInsertAction("foreach", "L"),
        'Цикл ПО. Key: L',
        'shelf.png',
        createInsertAction("shelf"),
        'Полка'
    )
    addVSpace(toolbar)
    addToolbarRow(
        toolbar,
        'silhouette.png',
        toggleSilhouette,
        'Переключить силуэт/примитив',
        'branch.png',
        createInsertAction("branch", "B"),
        'Ветвь силуэта. Key: B'
    )
    addVSpace(toolbar)
    addToolbarRow(
        toolbar,
        'insertion.png',
        createInsertAction("insertion"),
        'Вставка',
        'comment.png',
        createInsertAction("comment"),
        'Комментарий'
    )
    addToolbarRow(
        toolbar,
        'sinput.png',
        createInsertAction("simpleinput"),
        'Простой ввод',
        'soutput.png',
        createInsertAction("simpleoutput"),
        'Простой вывод'
    )
    addToolbarRow(
        toolbar,
        'output.png',
        createInsertAction("output"),
        'Вывод',
        'input.png',
        createInsertAction("input"),
        'Ввод'
    )
    addToolbarRow(
        toolbar,
        'parblock.png',
        createInsertAction("parblock"),
        'Параллельные процессы',
        'par.png',
        createInsertAction("par"),
        'Добавить путь'
    )
    addToolbarRow(
        toolbar,
        'timer.png',
        createInsertAction("timer"),
        'Таймер',
        'pause.png',
        createInsertAction("pause"),
        'Пауза'
    )
    addToolbarRow(
        toolbar,
        'duration.png',
        createInsertAction("duration"),
        'Длительность',
        'process.png',
        createInsertAction("process"),
        'Процесс'
    )
    addToolbarRow(
        toolbar,
        'ctrl-start.png',
        createInsertAction("ctrlstart"),
        'Начало контроля',
        'ctrl-end.png',
        createInsertAction("ctrlend"),
        'Конец контроля'
    )
    addToolbarRow(
        toolbar,
        'group-duration.png',
        createFreeAction(
            'group-duration-left'
        ),
        'Групповая длительность (слева)',
        'group-duration-r.png',
        createFreeAction(
            'group-duration-right'
        ),
        'Групповая длительность (справа)'
    )
}

function initToolbarFree(toolbar) {
    addToolbarRow(
        toolbar,
        'rectangle.png',
        createFreeAction('rectangle', 'A'),
        'Прямоугольник',
        'text.png',
        createFreeAction('text', 'T'),
        'Текст'
    )
    addToolbarRow(
        toolbar,
        'line.png',
        createFreeAction('line', 'L'),
        'Линия',
        'arrow.png',
        createFreeAction('arrow', 'W'),
        'Стрелка'
    )
    addToolbarRow(
        toolbar,
        'poly.png',
        createFreeAction('polygon'),
        'Полигон',
        'polyline.png',
        createFreeAction('polyline'),
        'Ломаная'
    )
    addToolbarRow(
        toolbar,
        'f_begin.png',
        createFreeAction('f_begin'),
        'Мыльница (овал)',
        'rounded.png',
        createFreeAction('rounded'),
        'Закругленный прямоугольник'
    )
    addToolbarRow(
        toolbar,
        'ptr-left.png',
        createFreeAction('f_ptr_left'),
        'Левый указатель',
        'ptr-right.png',
        createFreeAction('f_ptr_right'),
        'Правый указатель'
    )
}

function initToolbarGraf(toolbar) {
    addToolbarRow(
        toolbar,
        'rectangle.png',
        createInsertAction('idea', 'A'),
        'Идея',
        'rounded.png',
        createInsertAction('ridea', 'R'),
        'Идея - скругленно'
    )
    addToolbarRow(
        toolbar,
        'comment.png',
        createInsertAction('conclusion', 'C'),
        'Заключение',
        'callout.png',
        createFreeAction('callout'),
        'Выноска'
    )
    addToolbarRow(
        toolbar,
        'line.png',
        createFreeAction('line', 'L'),
        'Линия',
        'arrow.png',
        createFreeAction('arrow', 'W'),
        'Стрелка'
    )
    addToolbarRow(
        toolbar,
        'frame.png',
        createFreeAction('frame'),
        'Рамка',
        'polyline.png',
        createFreeAction('polyline'),
        'Ломаная'
    )
}

function insertFree(type) {
    m.drakon.insertFree(type)
}

function insertIcon(type) {
    m.drakon.showInsertionSockets(type)
}

function loadThemes() {
    var list, missing, i;
    console.log("loadThemes() started");
    list = getThemes()
    missing = false;
    const defaultThemes = createThemes();
    if (list) {
        // Check if all default themes are present in the list
        for (i = 0; i < defaultThemes.length; i++) {
            if (list.indexOf(defaultThemes[i].id) === -1) {
                console.log("loadThemes() default theme ID missing from list: " + defaultThemes[i].id);
                missing = true;
                break;
            }
        }
        // Also check if they exist in localStorage
        for (i = 0; i < list.length; i++) {
            if (!localStorage.getItem(list[i])) {
                console.log("loadThemes() theme missing from storage: " + list[i]);
                missing = true;
                break;
            }
        }
    } else {
        missing = true;
    }
    if (list && list.length > 0 && !missing) {
        console.log("loadThemes() all themes are already present");
    } else {
        console.log("loadThemes() list is empty/missing themes, calling saveThemesInStorage()");
        saveThemesInStorage()
    }
}

function main() {
    var actualVersion, closeButton, currentVersion;
    m.widgets = createSimpleWidgets()
    m.widgets.init(tr)
    initDrakonWidget()
    initButtonShow()
    currentVersion = m.drakon.getVersion()
    actualVersion = localStorage.getItem(
        "drakon-widget-version"
    )
    if (actualVersion === currentVersion) {
    } else {
        localStorage.clear()
        localStorage.setItem(
            "drakon-widget-version",
            currentVersion
        )
    }
    loadThemes()
    closeButton = get("close-button")
    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeMenu
        )
    }
    registerClick(
        "create-theme-button",
        showCreateThemeDialog
    )
    registerClick(
        "edit-theme-colors-button",
        showThemeColorEditor
    )
    registerChange(
        "themes-combobox",
        onThemesChanged
    )
    registerChange(
        "modes-combobox",
        onModesChanged
    )
    initShortcuts()
    window.onresize = debounce(onResize, 500)
    registerEventVscode()
    document.body.classList.add(
        'vscode-light'
    )
}

function nameNotEmpty(text) {
    text = text || ""
    if (!text.trim()) {
        return "Name cannot be empty"
    } else {
        return undefined
    }
}

function onActionHotspot(prim, pos) {
    var bottom, left, padding, right, top;
    padding = 10
    left = prim.diagramLeft
    top = prim.diagramTop
    right = prim.diagramLeft + m.iconSize + padding
    * 2
    bottom = prim.diagramTop + prim.diagramHeight
    if ((((pos.x > left) && (pos.x < right)) && (pos.y > top)) && (pos.y < bottom)) {
        return true
    } else {
        return false
    }
}

function onInsertionHotspot(prim, pos) {
    var bottom, left, padding, right, top;
    padding = 10
    left = prim.diagramLeft + padding * 2
    top = prim.diagramTop + padding
    right = prim.diagramLeft + prim.diagramWidth
    - padding * 2
    bottom = prim.diagramTop + prim.diagramHeight
    - padding
    if ((((pos.x > left) && (pos.x < right)) && (pos.y > top)) && (pos.y < bottom)) {
        return true
    } else {
        return false
    }
}

function onItemClick(prim, pos, evt) {
    if (prim.type === "insertion") {
        if (onInsertionHotspot(prim, pos)) {
            window.open(prim.link, '_blank')
        }
    } else {
        if (((prim.type === "action") && (prim.link)) && (onActionHotspot(prim, pos))) {
            window.open(prim.link, '_blank')
        }
    }
}

function onModesChanged() {
    var modes;
    modes = get("modes-combobox")
    m.currentMode = modes.value
    reloadCurrent()
    closeMenu()
}

function onResize() {
    renderEditorWidget()
    m.drakon.redraw()
}

function onThemesChanged() {
    var themes;
    themes = get("themes-combobox")
    localStorage.setItem(
        "current-theme",
        themes.value
    )
    reloadCurrent()
    closeMenu()
}

function openDiagram(currentDiagram) {
    var diagram, diagramStr, sender;
    renderEditorWidget()
    sender = createEditSender()
    diagramStr = isolatedStorage.getItem(
        currentDiagram
    )
    diagram = JSON.parse(diagramStr)
    if (m.currentMode === "write") {
        diagram.access = "write"
    } else {
        diagram.access = "read"
    }
    initToolbar(diagram.type)
    m.drakon.setDiagram(
        currentDiagram,
        diagram,
        sender,
        true
    )
    isolatedStorage.setItem(
        "current-diagram",
        currentDiagram
    )
}

function parseHomeMadeMarkdown(text, container) {
    var _7_col, _7_it, _7_length, element, line, lines;
    if (text) {
        lines = text.split("\n")
        _7_it = 0;
        _7_col = lines;
        _7_length = _7_col.length;
        while (true) {
            if (_7_it < _7_length) {
                line = _7_col[_7_it];
                element = parseParagraph(line)
                add(container, element)
                _7_it++;
            } else {
                break;
            }
        }
    }
}

function parseParagraph(line) {
    var _5_col, _5_it, _5_length, _sw_9, buffer, c, par, state;
    par = document.createElement("p")
    buffer = createBuffer("normal")
    state = "start"
    _5_it = 0;
    _5_col = line;
    _5_length = _5_col.length;
    while (true) {
        if (_5_it < _5_length) {
            c = _5_col[_5_it];
            _sw_9 = state;
            if (_sw_9 === "start") {
                if (c === "-") {
                    addToBuffer(buffer, "•")
                    state = "normal"
                } else {
                    if (c === "_") {
                        state = "under-1"
                    } else {
                        addToBuffer(buffer, c)
                        state = "normal"
                    }
                }
            } else {
                if (_sw_9 === "normal") {
                    if (c === "_") {
                        state = "under-1"
                    } else {
                        addToBuffer(buffer, c)
                        state = "normal"
                    }
                } else {
                    if (_sw_9 === "under-1") {
                        if (c === "_") {
                            state = "under-2"
                        } else {
                            completeBuffer(buffer, par)
                            buffer = createBuffer("em")
                            addToBuffer(buffer, c)
                            state = "em"
                        }
                    } else {
                        if (_sw_9 === "under-2") {
                            if (c === "_") {
                                addToBuffer(buffer, c)
                                state = "normal"
                            } else {
                                completeBuffer(buffer, par)
                                buffer = createBuffer("strong")
                                addToBuffer(buffer, c)
                                state = "strong"
                            }
                        } else {
                            if (_sw_9 === "strong") {
                                if (c === "_") {
                                    state = "end-under-1"
                                } else {
                                    addToBuffer(buffer, c)
                                    state = "strong"
                                }
                            } else {
                                if (_sw_9 === "em") {
                                    if (c === "_") {
                                        completeBuffer(buffer, par)
                                        buffer = createBuffer("normal")
                                        state = "normal"
                                    } else {
                                        addToBuffer(buffer, c)
                                        state = "em"
                                    }
                                } else {
                                    if (_sw_9 === "end-under-1") {
                                    } else {
                                        throw new Error("Unexpected Choice value: " + _sw_9);
                                    }
                                    if (c === "_") {
                                        completeBuffer(buffer, par)
                                        buffer = createBuffer("normal")
                                        state = "normal"
                                    } else {
                                        addToBuffer(buffer, "_")
                                        addToBuffer(buffer, c)
                                        state = "strong"
                                    }
                                }
                            }
                        }
                    }
                }
            }
            _5_it++;
        } else {
            break;
        }
    }
    completeBuffer(buffer, par)
    return par
}

function paste() {
    m.drakon.showPaste()
    sendUpdateToVSCode()
}

function pushEdit(edit) {
    var _6_col, _6_it, _6_length, change, changedDiagram, currentDiagram, diagram, diagramStr;
    console.log(
        "pushEdit",
        JSON.stringify(edit, null, 4)
    )
    currentDiagram = isolatedStorage.getItem(
        "current-diagram"
    )
    diagramStr = isolatedStorage.getItem(
        currentDiagram
    )
    diagram = JSON.parse(diagramStr)
    _6_it = 0;
    _6_col = edit.changes;
    _6_length = _6_col.length;
    while (true) {
        if (_6_it < _6_length) {
            change = _6_col[_6_it];
            if (change.id) {
                updateDiagramItem(
                    diagram,
                    change.id,
                    change.op,
                    change.fields
                )
            } else {
                Object.assign(diagram, change.fields)
            }
            _6_it++;
        } else {
            break;
        }
    }
    changedDiagram = JSON.stringify(diagram)
    isolatedStorage.setItem(
        currentDiagram,
        changedDiagram
    )
    sendUpdateToVSCode(diagram)
}

function redo() {
    m.drakon.redo()
}

function registerChange(id, action) {
    var element;
    element = document.getElementById(id)
    if (element) {
        element.addEventListener(
            "change",
            action
        )
    } else {
        console.warn("registerChange: element not found: " + id);
    }
}

function registerClick(id, action) {
    var element;
    element = document.getElementById(id)
    if (element) {
        element.addEventListener("click", action)
    } else {
        console.warn("registerClick: element not found: " + id);
    }
}

function registerEventVscode() {
    window.addEventListener(
        'message',
        eventListener
    )
}

function reloadCurrent() {
    var current;
    current = isolatedStorage.getItem(
        "current-diagram"
    )
    if (current) {
        openDiagram(current)
    }
}

function renderEditorWidget() {
    var canvas, config, editorArea, rect;
    editorArea = get("editor-area")
    rect = editorArea.getBoundingClientRect()
    editorArea.innerHTML = ""
    config = buildConfig()
    config.maxHeight = 1200
    canvas = m.drakon.render(
        rect.width,
        rect.height,
        config
    )
    add(editorArea, canvas)
}

function restoreStateDrakon() {
    var saved, savedState;
    saved = isolatedStorage.getItem(
        "m.drakon-state"
    )
    console.log(
        'restoreState.drakon:',
        saved
    )
    if (((saved) && (m.drakon)) && (m.drakon.edit)) {
        try {
            savedState = JSON.parse(saved);
            m.drakon.edit.undo = savedState.undo;
            m.drakon.edit.redo = savedState.redo;
            m.drakon.edit.currentUndo = savedState.currentUndo;
            console.log(
                'State restored successfully'
            );
        } catch (error) {
            console.error(
                'Failed to restore state:',
                error
            );
        }
    }
}

function saveStateDrakon() {
    var state;
    state = {
        undo: m.drakon.edit.undo,
        redo: m.drakon.edit.redo,
        currentUndo: m.drakon.edit.currentUndo
    }
    isolatedStorage.setItem(
        "drakon-state",
        JSON.stringify(state)
    )
    console.log(
        'saveStateDrakon:',
        JSON.stringify(state)
    )
}

function saveThemesInStorage() {
    console.log("saveThemesInStorage() called. Writing default themes.");
    var _7_col, _7_it, _7_length, ids, theme, themes;
    const currentTheme = localStorage.getItem("current-theme") || "theme-class";
    themes = createThemes()
    ids = themes.map(
        function (theme) {
            return theme.id
        }
    )
    
    // Merge existing custom themes to preserve them
    const existingThemes = getThemes();
    if (existingThemes) {
        existingThemes.forEach(id => {
            if (id.startsWith("theme-custom-") && ids.indexOf(id) === -1) {
                ids.push(id);
            }
        });
    }
    
    localStorage.setItem(
        "themes",
        JSON.stringify(ids)
    )
    console.log("saveThemesInStorage() wrote theme list: " + JSON.stringify(ids));
    _7_it = 0;
    _7_col = themes;
    _7_length = _7_col.length;
    while (true) {
        if (_7_it < _7_length) {
            theme = _7_col[_7_it];
            localStorage.setItem(
                theme.id,
                JSON.stringify(theme)
            )
            _7_it++;
        } else {
            break;
        }
    }
    localStorage.setItem(
        "current-theme",
        currentTheme
    )
    console.log("saveThemesInStorage() finished");
}

function sendUpdateToVSCode(diagram) {
    if (window.vscode) {
        window.vscode.postMessage(
            {
                command: 'updateDiagram',
                diagram: diagram
            }
        );
        saveStateDrakon()
        console.log(
            "ДРАКОН послали апдейт схемы ",
            JSON.stringify(diagram, null, 2)
        );
    }
}

async function setDiagramJson(evt) {
    var beautiful, current, diagram, errTry, newContent, newDiagram;
    current = isolatedStorage.getItem(
        "current-diagram"
    )
    diagram = JSON.parse(
        isolatedStorage.getItem(current)
    )
    delete diagram.id
    beautiful = JSON.stringify(
        diagram,
        null,
        4
    )
    newContent = await m.widgets.largeBox(
        evt.clientX,
        evt.clientY,
        "Diagram source",
        beautiful,
        undefined
    )
    if (newContent === undefined) {
        try {
            newDiagram = JSON.parse(newContent)
            errTry = false
        } catch (ex) {
            errTry = true
            m.widgets.showErrorSnack(
                "Error in JSON: " + ex.message
            )
        }
        if (errTry) {
        } else {
            if ((newDiagram.name) && (newDiagram.items)) {
                isolatedStorage.setItem(
                    current,
                    newContent
                )
                openDiagram(current)
                closeMenu()
            } else {
                m.widgets.showErrorSnack(
                    "Error in diagram structure"
                )
            }
        }
    }
}

function showCreateThemeDialog() {
    closeMenu();
    
    const overlay = document.createElement("div");
    overlay.id = "theme-creator-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;
    
    const modal = document.createElement("div");
    modal.style.cssText = `
        background: #252526;
        color: #cccccc;
        border: 1px solid #454545;
        border-radius: 8px;
        padding: 24px;
        width: 320px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    const title = document.createElement("h3");
    title.innerText = "Создать новую тему";
    title.style.cssText = "margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #ffffff;";
    modal.appendChild(title);
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Имя новой темы";
    input.style.cssText = `
        width: 100%;
        background: #3c3c3c;
        color: #ffffff;
        border: 1px solid #555555;
        border-radius: 4px;
        padding: 6px 10px;
        font-size: 13px;
        margin-bottom: 20px;
        box-sizing: border-box;
        outline: none;
    `;
    modal.appendChild(input);
    
    const buttons = document.createElement("div");
    buttons.style.cssText = "display: flex; justify-content: flex-end; gap: 8px;";
    
    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Отмена";
    cancelBtn.style.cssText = `
        background: #3c3c3c;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 13px;
        transition: background 0.15s;
    `;
    cancelBtn.onmouseenter = () => cancelBtn.style.background = "#4f4f4f";
    cancelBtn.onmouseleave = () => cancelBtn.style.background = "#3c3c3c";
    cancelBtn.onclick = () => document.body.removeChild(overlay);
    buttons.appendChild(cancelBtn);
    
    const createBtn = document.createElement("button");
    createBtn.innerText = "Создать";
    createBtn.style.cssText = `
        background: #0e639c;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 13px;
        transition: background 0.15s;
    `;
    createBtn.onmouseenter = () => createBtn.style.background = "#1177bb";
    createBtn.onmouseleave = () => createBtn.style.background = "#0e639c";
    
    createBtn.onclick = () => {
        const name = input.value ? input.value.trim() : "";
        if (!name) {
            alert("Имя темы не может быть пустым!");
            return;
        }
        
        // Check duplication
        const list = getThemes() || [];
        let duplicate = false;
        for (const tid of list) {
            const tstr = localStorage.getItem(tid);
            if (tstr) {
                const tobj = JSON.parse(tstr);
                if (tobj.name === name) {
                    duplicate = true;
                    break;
                }
            }
        }
        if (duplicate) {
            alert("Тема с таким именем уже существует!");
            return;
        }
        
        const newThemeId = "theme-custom-" + Date.now();
        const themeObj = {
            name: name,
            id: newThemeId,
            theme: {
                lineWidth: 1,
                background: "#ffffff",
                iconBorder: "#000000",
                iconBack: "#e0e0e0",
                shadowColor: "rgba(0,0,0,0.1)",
                icons: {
                    question: {
                        iconBack: "#e0e0e0",
                        color: "#000000"
                    },
                    loopbegin: {
                        iconBack: "#e0e0e0",
                        color: "#000000"
                    },
                    loopend: {
                        iconBack: "#e0e0e0",
                        color: "#000000"
                    }
                }
            }
        };
        
        localStorage.setItem(newThemeId, JSON.stringify(themeObj));
        list.push(newThemeId);
        localStorage.setItem("themes", JSON.stringify(list));
        localStorage.setItem("current-theme", newThemeId);
        
        const combo = document.getElementById("themes-combobox");
        if (combo) {
            fillThemes(combo);
        }
        
        if (window.vscode) {
            window.vscode.postMessage({
                command: 'saveCustomTheme',
                themeName: name,
                themeData: themeObj.theme
            });
        }
        
        reloadCurrent();
        document.body.removeChild(overlay);
        
        // Open color editor for this brand-new theme
        showThemeColorEditor();
    };
    buttons.appendChild(createBtn);
    
    modal.appendChild(buttons);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function setZoom(zoom) {
    var zoomValue;
    zoomValue = parseInt(zoom)
    m.drakon.setZoom(zoomValue)
    closeMenu()
}

function showContextMenu(x, y, items, options) {
    items.forEach(addIconPath)
    m.widgets.showContextMenu(
        x,
        y,
        items,
        options
    )
}

function showMenu() {
    var menu, modes, themes;
    menu = get("menu")
    themes = get("themes-combobox")
    modes = get("modes-combobox")
    fillModes(modes)
    fillThemes(themes)
    menu.style.display = "inline-block"
}

function showToolbar() {
    var editor;
    get('left-toolbar').style.display = 'block';
    get('show-toolbar-button').style.display
    = 'none'
    editor = get('editor-area');
    editor.style.left = '90px';
    editor.style.width = 'calc(100% - 90px)'
    if (m.drakon) {
        onResize()
    }
}

function showZoom(ign, evt) {
    var items;
    items = []
    addZooomLevel(items, "2500", "25%")
    addZooomLevel(items, "5000", "50%")
    addZooomLevel(items, "6667", "66.667%")
    items.push({type: "separator"})
    addZooomLevel(items, "10000", "100%")
    items.push({type: "separator"})
    addZooomLevel(items, "11000", "110%")
    addZooomLevel(items, "12000", "120%")
    addZooomLevel(items, "15000", "150%")
    addZooomLevel(items, "20000", "200%")
    addZooomLevel(items, "40000", "400%")
    m.widgets.showContextMenu(
        evt.clientX,
        evt.clientY,
        items
    )
}

function startEditContent(prim, ro) {
    if (prim.type === "header") {
        if (ro) {
            m.widgets.inputBoxRo(
                prim.left,
                prim.top,
                "Name",
                prim.content
            )
        } else {
            m.widgets.inputBox(
                prim.left,
                prim.top,
                tr("Rename"),
                prim.content,
                nameNotEmpty
            ).then(
                function (newContent) {
                    if (
                        newContent && newContent !==
                        prim.content
                    ) {
                        m.drakon.setContent(
                            prim.id,
                            newContent
                        )
                        m.drakon.redraw()
                    }
                }
            )
        }
    } else {
        if (ro) {
            m.widgets.largeBoxRo(
                prim.left,
                prim.top,
                "",
                prim.content
            )
        } else {
            m.widgets.largeBox(
                prim.left,
                prim.top,
                "",
                prim.content
            ).then(
                function (newContent) {
                    if (
                        newContent !== undefined && newContent
                        != prim.content
                    ) {
                        m.drakon.setContent(
                            prim.id,
                            newContent
                        )
                    }
                }
            )
        }
    }
}

async function startEditDiagramStyle(oldStyle, x, y) {
    var newContent, old, style;
    old = JSON.stringify(oldStyle, null, 4)
    newContent = await m.widgets.largeBox(
        x,
        y,
        "",
        old
    )
    if (newContent !== undefined) {
        style = ""
        if (newContent) {
            style = JSON.parse(newContent)
        }
        m.drakon.setDiagramStyle(style)
    }
}

async function startEditLink(prim, ro) {
    var newContent;
    if (ro) {
        m.widgets.largeBoxRo(
            prim.left,
            prim.top,
            "",
            prim.link
        )
    } else {
        newContent = await m.widgets.largeBox(
            prim.left,
            prim.top,
            "",
            prim.link
        )
        if ((newContent !== undefined) && (newContent != prim.link)) {
            m.drakon.setLink(prim.id, newContent)
        }
    }
}

async function startEditSecondary(prim, ro) {
    var newContent;
    if (ro) {
        m.widgets.largeBoxRo(
            prim.left,
            prim.top,
            "",
            prim.secondary
        )
    } else {
        newContent = await m.widgets.largeBox(
            prim.left,
            prim.top,
            "",
            prim.secondary
        )
        if ((newContent !== undefined) && (newContent !== prim.secondary)) {
            m.drakon.setSecondary(prim.id, newContent)
        }
    }
}

async function startEditStyle(ids, oldStyle, x, y) {
    var newContent, old, style;
    old = JSON.stringify(oldStyle, null, 4)
    newContent = await m.widgets.largeBox(
        x,
        y,
        "",
        old
    )
    if (newContent !== undefined) {
        style = ""
        if (newContent) {
            style = JSON.parse(newContent)
        }
        m.drakon.setStyle(ids, style)
    }
}

function toggleShowIds() {
    var showIds;
    showIds = localStorage.getItem("showIds");
    if (showIds === null) {
        showIds = "false";
    }
    showIds = showIds === "true" ? "false" : "true";
    localStorage.setItem("showIds", showIds);
    // Обновляем конфиг и перерисовываем
    if (m.drakon && m.drakon.config) {
        m.drakon.config.showIds = (showIds === "true");
        m.drakon.redraw();
    }
}

function toggleSilhouette() {
    m.drakon.toggleSilhouette()
}

function tr(text) {
    console.log("tr", text)
    return text
}

function tryGoToDiagram(name) {
    var _8_col, _8_it, _8_length, diagram, diagrams, dname;
    if (name) {
        name = name.toLowerCase().trim()
        diagrams = getDiagramObjects()
        _8_it = 0;
        _8_col = diagrams.diagrams;
        _8_length = _8_col.length;
        while (true) {
            if (_8_it < _8_length) {
                diagram = _8_col[_8_it];
                dname = diagram.name.toLowerCase()
                if (dname === name) {
                    openDiagram(diagram.id)
                    break;
                } else {
                    _8_it++;
                }
            } else {
                break;
            }
        }
    }
}

function undo() {
    m.drakon.undo()
}

function updateDiagramItem(diagram, itemId, op, fields) {
    var _sw_9;
    if (!diagram.items) {
        diagram.items = {}
    }
    _sw_9 = op;
    if (_sw_9 === "insert") {
        diagram.items[itemId] = fields
    } else {
        if (_sw_9 === "update") {
            Object.assign(
                diagram.items[itemId],
                fields
            )
        } else {
            if (_sw_9 === "delete") {
                delete diagram.items[itemId]
            } else {
                throw new Error(
                    "Unsupported edit operation: " + op
                )
            }
        }
    }
}

function updateFilename(name) {
    var currentDiagram, diagram, diagramStr;
    currentDiagram = isolatedStorage.getItem(
        "current-diagram"
    )
    diagramStr = isolatedStorage.getItem(
        currentDiagram
    )
    diagram = JSON.parse(diagramStr)
    if (diagram.name !== name) {
        diagram.id = diagram.id.replace(
            diagram.name + "." + diagram.type,
            name + "." + diagram.type
        )
        diagram.name = name
        isolatedStorage.setItem(
            currentDiagram,
            JSON.stringify(diagram)
        )
        if (m.drakon) {
            m.drakon.setDiagram(
                currentDiagram,
                diagram,
                createEditSender(),
                true
            )
            console.log(
                'updateFileName. Diagram: ',
                JSON.stringify(diagram, null, 2)
            )
        }
    }
}

function showThemeColorEditor() {
    console.log("showThemeColorEditor() started");
    
    const currentThemeId = localStorage.getItem("current-theme") || "theme-class";
    const themeStr = localStorage.getItem(currentThemeId);
    if (!themeStr) {
        console.error("No theme found for ID: " + currentThemeId);
        return;
    }
    const themeObj = JSON.parse(themeStr);
    const themeColors = themeObj.theme || {};
    const backupColors = JSON.parse(JSON.stringify(themeColors));
    
    closeMenu();
    
    // Inject custom styling for tabs
    let styleTag = document.getElementById("theme-editor-styles");
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "theme-editor-styles";
        styleTag.innerHTML = `
            .color-editor-tab {
                background: none;
                border: none;
                color: #888888;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                border-bottom: 2px solid transparent;
                transition: all 0.15s ease;
                outline: none;
            }
            .color-editor-tab.active {
                color: #ffffff;
                border-bottom: 2px solid #0e639c;
            }
            .color-editor-tab:hover {
                color: #ffffff;
            }
        `;
        document.head.appendChild(styleTag);
    }
    
    const overlay = document.createElement("div");
    overlay.id = "theme-editor-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;
    
    const modal = document.createElement("div");
    modal.style.cssText = `
        background: #252526;
        color: #cccccc;
        border: 1px solid #454545;
        border-radius: 8px;
        padding: 24px;
        width: 380px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    // Map theme names
    const themeDisplayNameMap = {
        "theme-class": "Классическая (Classic)",
        "theme-greys": "Оттенки серого (Greys)",
        "theme-bq": "Яркие вопросы (Bright questions)",
        "theme-str": "Строгая (Strict)",
        "theme-egg": "Яичная (Egg)",
        "theme-green": "Зеленая (Green)",
        "theme-gow": "Серый на белом (Grey on white)",
        "theme-white": "Белая (White)",
        "theme-black": "Черная (Black)",
        "theme-space": "Темный космос (Space)"
    };
    
    const isBuiltIn = [
        "theme-bq", "theme-str", "theme-class", "theme-egg", 
        "theme-green", "theme-greys", "theme-gow", "theme-white",
        "theme-black", "theme-space"
    ].indexOf(currentThemeId) !== -1;
    
    let displayName = themeObj.name || themeObj.id;
    if (themeDisplayNameMap[currentThemeId]) {
        displayName = themeDisplayNameMap[currentThemeId];
    }
    if (isBuiltIn) {
        displayName += " (Встроенная)";
    }
    
    const title = document.createElement("h3");
    title.innerText = `Редактор цвета: ${displayName}`;
    title.style.cssText = "margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #ffffff;";
    modal.appendChild(title);
    
    // Create tabs container
    const tabsContainer = document.createElement("div");
    tabsContainer.style.cssText = "display: flex; gap: 8px; margin-bottom: 18px; border-bottom: 1px solid #3c3c3c; padding-bottom: 6px;";
    
    const tabGeneral = document.createElement("button");
    tabGeneral.className = "color-editor-tab active";
    tabGeneral.innerText = "Общие";
    
    const tabQuestion = document.createElement("button");
    tabQuestion.className = "color-editor-tab";
    tabQuestion.innerText = "Вопрос";
    
    const tabLoops = document.createElement("button");
    tabLoops.className = "color-editor-tab";
    tabLoops.innerText = "Циклы";
    
    tabsContainer.appendChild(tabGeneral);
    tabsContainer.appendChild(tabQuestion);
    tabsContainer.appendChild(tabLoops);
    modal.appendChild(tabsContainer);
    
    // Create tab panels
    const panelGeneral = document.createElement("div");
    const panelQuestion = document.createElement("div");
    const panelLoops = document.createElement("div");
    
    panelQuestion.style.display = "none";
    panelLoops.style.display = "none";
    
    modal.appendChild(panelGeneral);
    modal.appendChild(panelQuestion);
    modal.appendChild(panelLoops);
    
    // Tab switching logic
    tabGeneral.onclick = () => {
        tabGeneral.className = "color-editor-tab active";
        tabQuestion.className = "color-editor-tab";
        tabLoops.className = "color-editor-tab";
        panelGeneral.style.display = "block";
        panelQuestion.style.display = "none";
        panelLoops.style.display = "none";
    };
    
    tabQuestion.onclick = () => {
        tabGeneral.className = "color-editor-tab";
        tabQuestion.className = "color-editor-tab active";
        tabLoops.className = "color-editor-tab";
        panelGeneral.style.display = "none";
        panelQuestion.style.display = "block";
        panelLoops.style.display = "none";
    };
    
    tabLoops.onclick = () => {
        tabGeneral.className = "color-editor-tab";
        tabQuestion.className = "color-editor-tab";
        tabLoops.className = "color-editor-tab active";
        panelGeneral.style.display = "none";
        panelQuestion.style.display = "none";
        panelLoops.style.display = "block";
    };
    
    // Helper to create color row with 24px circle swatches
    function createColorRow(label, initialValue, onChange) {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;";
        
        const textLabel = document.createElement("span");
        textLabel.innerText = label;
        textLabel.style.cssText = "font-size: 13px; color: #bbbbbb;";
        row.appendChild(textLabel);
        
        const swatch = document.createElement("div");
        swatch.style.cssText = `
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid #555555;
            background: ${initialValue || "#ffffff"};
            cursor: pointer;
            position: relative;
            box-shadow: inset 0 0 3px rgba(0,0,0,0.3);
            transition: transform 0.15s ease;
        `;
        swatch.onmouseenter = () => swatch.style.transform = "scale(1.1)";
        swatch.onmouseleave = () => swatch.style.transform = "scale(1)";
        
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = (initialValue && initialValue.startsWith("#")) ? initialValue.slice(0, 7) : "#ffffff";
        colorInput.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;";
        
        colorInput.addEventListener("input", (e) => {
            const newColor = e.target.value;
            swatch.style.background = newColor;
            onChange(newColor);
            localStorage.setItem(currentThemeId, JSON.stringify(themeObj));
            reloadCurrent();
        });
        
        swatch.appendChild(colorInput);
        row.appendChild(swatch);
        return row;
    }
    
    // ---------------- General Tab Content ----------------
    panelGeneral.appendChild(createColorRow("Цвет фона (Canvas Background)", themeColors.background, (val) => {
        themeColors.background = val;
    }));
    panelGeneral.appendChild(createColorRow("Фон блоков (Block Background)", themeColors.iconBack, (val) => {
        themeColors.iconBack = val;
    }));
    panelGeneral.appendChild(createColorRow("Контур блоков (Block Border)", themeColors.iconBorder, (val) => {
        themeColors.iconBorder = val;
    }));
    
    // Text color
    const textColor = themeColors.color || "#000000";
    panelGeneral.appendChild(createColorRow("Цвет текста (Text Color)", textColor, (val) => {
        themeColors.color = val;
    }));
    
    // Shadow color
    const shadowColor = themeColors.shadowColor || "rgba(0,0,0,0.1)";
    panelGeneral.appendChild(createColorRow("Цвет тени (Shadow Color)", shadowColor, (val) => {
        themeColors.shadowColor = val;
    }));
    
    // Line width slider
    const lineRow = document.createElement("div");
    lineRow.style.cssText = "display: flex; align-items: center; justify-content: space-between; margin-top: 14px; border-top: 1px solid #3c3c3c; padding-top: 12px;";
    
    const lineLabel = document.createElement("span");
    lineLabel.innerText = "Толщина линий (Line Width)";
    lineLabel.style.cssText = "font-size: 13px; color: #bbbbbb;";
    lineRow.appendChild(lineLabel);
    
    const lineInput = document.createElement("input");
    lineInput.type = "range";
    lineInput.min = "1";
    lineInput.max = "4";
    lineInput.value = themeColors.lineWidth || 1;
    lineInput.style.cssText = "width: 80px; cursor: pointer;";
    lineInput.addEventListener("input", (e) => {
        themeColors.lineWidth = parseInt(e.target.value);
        localStorage.setItem(currentThemeId, JSON.stringify(themeObj));
        reloadCurrent();
    });
    lineRow.appendChild(lineInput);
    panelGeneral.appendChild(lineRow);
    
    // Ensure nested objects are initialized safely
    themeColors.icons = themeColors.icons || {};
    themeColors.icons.question = themeColors.icons.question || {};
    themeColors.icons.loopbegin = themeColors.icons.loopbegin || {};
    themeColors.icons.loopend = themeColors.icons.loopend || {};
    
    // ---------------- Question Tab Content ----------------
    const qBack = themeColors.icons.question.iconBack || themeColors.iconBack || "#ffffff";
    const qColor = themeColors.icons.question.color || themeColors.color || "#000000";
    
    panelQuestion.appendChild(createColorRow("Фон вопроса (Question Back)", qBack, (val) => {
        themeColors.icons.question.iconBack = val;
    }));
    panelQuestion.appendChild(createColorRow("Текст вопроса (Question Text)", qColor, (val) => {
        themeColors.icons.question.color = val;
    }));
    
    // ---------------- Loops Tab Content ----------------
    const loopBack = themeColors.icons.loopbegin.iconBack || themeColors.iconBack || "#ffffff";
    const loopColor = themeColors.icons.loopbegin.color || themeColors.color || "#000000";
    
    panelLoops.appendChild(createColorRow("Фон циклов (Loops Back)", loopBack, (val) => {
        themeColors.icons.loopbegin.iconBack = val;
        themeColors.icons.loopend.iconBack = val;
    }));
    panelLoops.appendChild(createColorRow("Текст циклов (Loops Text)", loopColor, (val) => {
        themeColors.icons.loopbegin.color = val;
        themeColors.icons.loopend.color = val;
    }));
    
    // Footer button setup
    const footer = document.createElement("div");
    footer.style.cssText = `
        display: flex;
        justify-content: ${isBuiltIn ? "flex-end" : "space-between"};
        align-items: center;
        margin-top: 20px;
        border-top: 1px solid #3c3c3c;
        padding-top: 14px;
    `;
    
    if (!isBuiltIn) {
        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Удалить тему";
        deleteBtn.style.cssText = `
            background: #d9534f;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            padding: 6px 14px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background 0.15s ease;
        `;
        deleteBtn.onmouseenter = () => deleteBtn.style.background = "#c9302c";
        deleteBtn.onmouseleave = () => deleteBtn.style.background = "#d9534f";
        // Delete custom theme with async confirmation
        deleteBtn.onclick = async () => {
            document.body.removeChild(overlay);
            const ok = await showConfirmDialog(`Вы действительно хотите удалить тему "${themeObj.name || themeObj.id}"?`);
            if (ok) {
                const list = getThemes() || [];
                const index = list.indexOf(currentThemeId);
                if (index !== -1) {
                    list.splice(index, 1);
                    localStorage.setItem("themes", JSON.stringify(list));
                }
                localStorage.removeItem(currentThemeId);
                const combo = document.getElementById("themes-combobox");
                if (combo) {
                    for (let i = 0; i < combo.options.length; i++) {
                        if (combo.options[i].value === currentThemeId) {
                            combo.remove(i);
                            break;
                        }
                    }
                }
                if (window.vscode) {
                    window.vscode.postMessage({
                        command: 'deleteCustomTheme',
                        themeName: themeObj.name || themeObj.id
                    });
                }
                localStorage.setItem("current-theme", "theme-class");
                if (combo) {
                    combo.value = "theme-class";
                }
                reloadCurrent();
            } else {
                document.body.appendChild(overlay);
            }
        };
        footer.appendChild(deleteBtn);
    } else {
        const resetBtn = document.createElement("button");
        resetBtn.innerText = "Сбросить настройки";
        resetBtn.style.cssText = `
            background: #b09030;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            padding: 6px 14px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background 0.15s ease;
        `;
        resetBtn.onmouseenter = () => resetBtn.style.background = "#c0a040";
        resetBtn.onmouseleave = () => resetBtn.style.background = "#b09030";
        // Reset built‑in theme with async confirmation
        resetBtn.onclick = async () => {
            console.log('Reset‑clicked', displayName);
            // Close the editor before asking
            document.body.removeChild(overlay);
            const ok = await showConfirmDialog(`Вы действительно хотите сбросить тему "${displayName}" к настройкам по умолчанию?`);
            if (ok) {
                // Restore default colors for built‑in theme by looking it up in createThemes()
                const defaultThemes = createThemes();
                const defaultTheme = defaultThemes.find(t => t.id === currentThemeId);
                if (defaultTheme) {
                    localStorage.setItem(currentThemeId, JSON.stringify(defaultTheme));
                } else {
                    localStorage.removeItem(currentThemeId);
                }
                // Reload (overlay already removed)
                reloadCurrent();
            } else {
                // User cancelled – reopen editor
                document.body.appendChild(overlay);
            }
        };
        footer.appendChild(resetBtn);
    }
    
    const rightButtons = document.createElement("div");
    rightButtons.style.cssText = "display: flex; gap: 10px;";
    
    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Отмена";
    cancelBtn.style.cssText = `
        background: #3c3c3c;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        padding: 6px 14px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.15s ease;
    `;
    cancelBtn.onmouseenter = () => cancelBtn.style.background = "#4f4f4f";
    cancelBtn.onmouseleave = () => cancelBtn.style.background = "#3c3c3c";
    cancelBtn.onclick = () => {
        themeObj.theme = backupColors;
        localStorage.setItem(currentThemeId, JSON.stringify(themeObj));
        reloadCurrent();
        document.body.removeChild(overlay);
    };
    rightButtons.appendChild(cancelBtn);
    
    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Сохранить";
    saveBtn.style.cssText = `
        background: #0e639c;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        padding: 6px 14px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.15s ease;
    `;
    saveBtn.onmouseenter = () => saveBtn.style.background = "#1177bb";
    saveBtn.onmouseleave = () => saveBtn.style.background = "#0e639c";
    saveBtn.onclick = () => {
        if (window.vscode) {
            window.vscode.postMessage({
                command: 'saveCustomTheme',
                themeName: themeObj.name || themeObj.id,
                themeData: themeColors
            });
        }
        document.body.removeChild(overlay);
    };
    rightButtons.appendChild(saveBtn);
    
    footer.appendChild(rightButtons);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function showFindByIdDialog() {
    closeMenu();
    
    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.65); display: flex; align-items: center;
        justify-content: center; z-index: 10005;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;
    
    const modal = document.createElement("div");
    modal.style.cssText = `
        background: #252526; color: #cccccc; border: 1px solid #454545;
        border-radius: 8px; padding: 20px; width: 340px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 14px;
    `;
    
    const title = document.createElement("h3");
    title.innerText = "Перейти к иконе по ID";
    title.style.cssText = "margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;";
    modal.appendChild(title);
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Введите ID иконы (например: 3)";
    input.style.cssText = `
        background: #3c3c3c; color: #ffffff; border: 1px solid #6b6b6b;
        border-radius: 4px; padding: 8px 12px; font-size: 14px; outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    `;
    input.onfocus = () => {
        input.style.borderColor = "#0e639c";
        input.style.boxShadow = "0 0 5px rgba(14, 99, 156, 0.5)";
    };
    input.onblur = () => {
        input.style.borderColor = "#6b6b6b";
        input.style.boxShadow = "none";
    };
    modal.appendChild(input);
    
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = "color: #f28b82; font-size: 12px; display: none;";
    modal.appendChild(errorDiv);
    
    const buttons = document.createElement("div");
    buttons.style.cssText = "display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;";
    
    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Отмена";
    cancelBtn.style.cssText = `
        background: #3c3c3c; color: #ffffff; border: none; border-radius: 4px;
        padding: 6px 14px; cursor: pointer; font-size: 13px; font-weight: 500;
        transition: background 0.15s ease;
    `;
    cancelBtn.onmouseenter = () => cancelBtn.style.background = "#4f4f4f";
    cancelBtn.onmouseleave = () => cancelBtn.style.background = "#3c3c3c";
    cancelBtn.onclick = () => document.body.removeChild(overlay);
    buttons.appendChild(cancelBtn);
    
    const findBtn = document.createElement("button");
    findBtn.innerText = "Перейти";
    findBtn.style.cssText = `
        background: #0e639c; color: #ffffff; border: none; border-radius: 4px;
        padding: 6px 14px; cursor: pointer; font-size: 13px; font-weight: 500;
        transition: background 0.15s ease;
    `;
    findBtn.onmouseenter = () => findBtn.style.background = "#1177bb";
    findBtn.onmouseleave = () => findBtn.style.background = "#0e639c";
    
    function doFind() {
        const id = input.value.trim();
        if (!id) {
            errorDiv.innerText = "Пожалуйста, введите ID.";
            errorDiv.style.display = "block";
            return;
        }
        
        const currentDiagramId = isolatedStorage.getItem("current-diagram");
        if (!currentDiagramId) {
            errorDiv.innerText = "Ошибка: Диаграмма не открыта.";
            errorDiv.style.display = "block";
            return;
        }
        
        const diagramStr = isolatedStorage.getItem(currentDiagramId);
        const diagram = JSON.parse(diagramStr);
        const items = diagram.items || {};
        
        if (items[id]) {
            try {
                m.drakon.showItem(id);
                document.body.removeChild(overlay);
            } catch (err) {
                errorDiv.innerText = "Ошибка навигации: " + err.message;
                errorDiv.style.display = "block";
            }
        } else {
            errorDiv.innerText = `Икона с ID "${id}" не найдена в этой схеме.`;
            errorDiv.style.display = "block";
        }
    }
    
    findBtn.onclick = doFind;
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            doFind();
        }
    });
    
    buttons.appendChild(findBtn);
    modal.appendChild(buttons);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    input.focus();
}

function showSearchTextDialog() {
    closeMenu();
    
    // Inject styles for list and tags if not already present
    let styleTag = document.getElementById("drakon-search-styles");
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "drakon-search-styles";
        styleTag.innerHTML = `
            .drakon-search-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.65); display: flex; align-items: center;
                justify-content: center; z-index: 10005;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .drakon-search-modal {
                background: #252526; color: #cccccc; border: 1px solid #454545;
                border-radius: 8px; padding: 20px; width: 440px; max-height: 80vh;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 14px;
            }
            .drakon-search-input {
                background: #3c3c3c; color: #ffffff; border: 1px solid #6b6b6b;
                border-radius: 4px; padding: 8px 12px; font-size: 14px; outline: none;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                width: 100%; box-sizing: border-box;
            }
            .drakon-search-input:focus {
                border-color: #0e639c;
                box-shadow: 0 0 5px rgba(14, 99, 156, 0.5);
            }
            .drakon-results-container {
                overflow-y: auto; flex: 1; max-height: 300px;
                border: 1px solid #3c3c3c; border-radius: 4px; background: #1e1e1e;
            }
            .drakon-result-item {
                padding: 10px 14px; border-bottom: 1px solid #2d2d2d; cursor: pointer;
                transition: background 0.15s ease, border-left-color 0.15s ease;
                display: flex; flex-direction: column; gap: 6px; border-left: 3px solid transparent;
            }
            .drakon-result-item:hover {
                background: #2a2d2e; border-left-color: #0e639c;
            }
            .drakon-result-item:last-child {
                border-bottom: none;
            }
            .drakon-result-header {
                display: flex; align-items: center; justify-content: space-between;
            }
            .drakon-type-tag {
                font-size: 10px; font-weight: 600; text-transform: uppercase;
                padding: 2px 6px; border-radius: 3px; display: inline-block;
            }
            .drakon-type-tag.action { background: #004b7c; color: #5cb8ff; border: 1px solid #005a95; }
            .drakon-type-tag.question { background: #6b1414; color: #ff8b8b; border: 1px solid #7d1a1a; }
            .drakon-type-tag.loop { background: #6d4000; color: #ffd180; border: 1px solid #824d00; }
            .drakon-type-tag.branch { background: #195219; color: #8bff8b; border: 1px solid #206720; }
            .drakon-type-tag.comment { background: #4a4a4a; color: #e0e0e0; border: 1px solid #575757; }
            .drakon-type-tag.other { background: #333333; color: #aaaaaa; border: 1px solid #444444; }
            .drakon-result-id {
                font-size: 11px; color: #858585; font-family: monospace;
            }
            .drakon-result-content {
                font-size: 13px; color: #e1e1e1; white-space: pre-wrap; word-break: break-word;
            }
            .drakon-no-results {
                padding: 20px; text-align: center; color: #858585; font-size: 13px;
            }
        `;
        document.head.appendChild(styleTag);
    }
    
    const overlay = document.createElement("div");
    overlay.className = "drakon-search-overlay";
    
    const modal = document.createElement("div");
    modal.className = "drakon-search-modal";
    
    const title = document.createElement("h3");
    title.innerText = "Поиск текста в иконах";
    title.style.cssText = "margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;";
    modal.appendChild(title);
    
    const input = document.createElement("input");
    input.type = "text";
    input.className = "drakon-search-input";
    input.placeholder = "Введите текст для поиска...";
    modal.appendChild(input);
    
    const resultsList = document.createElement("div");
    resultsList.className = "drakon-results-container";
    modal.appendChild(resultsList);
    
    const buttons = document.createElement("div");
    buttons.style.cssText = "display: flex; justify-content: flex-end; margin-top: 6px;";
    
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Закрыть";
    closeBtn.style.cssText = `
        background: #3c3c3c; color: #ffffff; border: none; border-radius: 4px;
        padding: 6px 14px; cursor: pointer; font-size: 13px; font-weight: 500;
        transition: background 0.15s ease;
    `;
    closeBtn.onmouseenter = () => closeBtn.style.background = "#4f4f4f";
    closeBtn.onmouseleave = () => closeBtn.style.background = "#3c3c3c";
    closeBtn.onclick = () => document.body.removeChild(overlay);
    buttons.appendChild(closeBtn);
    modal.appendChild(buttons);
    
    // Fetch and search items
    const currentDiagramId = isolatedStorage.getItem("current-diagram");
    let items = {};
    if (currentDiagramId) {
        const diagramStr = isolatedStorage.getItem(currentDiagramId);
        if (diagramStr) {
            const diagram = JSON.parse(diagramStr);
            items = diagram.items || {};
        }
    }
    
    function getTypeLabel(type) {
        switch (type) {
            case "action": return { text: "Действие", css: "action" };
            case "question": return { text: "Вопрос", css: "question" };
            case "loopbegin": return { text: "Начало цикла", css: "loop" };
            case "loopend": return { text: "Конец цикла", css: "loop" };
            case "branch": return { text: "Ветвь", css: "branch" };
            case "comment": return { text: "Комментарий", css: "comment" };
            case "insertion": return { text: "Вставка", css: "action" };
            case "select": return { text: "Выбор", css: "loop" };
            case "case": return { text: "Вариант", css: "other" };
            case "input": return { text: "Ввод", css: "action" };
            case "output": return { text: "Вывод", css: "action" };
            case "simpleinput": return { text: "Ввод", css: "action" };
            case "simpleoutput": return { text: "Вывод", css: "action" };
            default: return { text: type || "Элемент", css: "other" };
        }
    }
    
    function renderResults(query) {
        resultsList.innerHTML = "";
        query = query.toLowerCase().trim();
        
        const matched = [];
        for (const [id, item] of Object.entries(items)) {
            if (item && item.content) {
                const text = item.content.toString();
                if (!query || text.toLowerCase().indexOf(query) !== -1) {
                    matched.push({ id, item, text });
                }
            }
        }
        
        if (matched.length === 0) {
            const noResults = document.createElement("div");
            noResults.className = "drakon-no-results";
            noResults.innerText = query ? "Совпадений не найдено." : "Введите текст, чтобы начать поиск.";
            resultsList.appendChild(noResults);
            return;
        }
        
        matched.forEach(({ id, item, text }) => {
            const itemUI = document.createElement("div");
            itemUI.className = "drakon-result-item";
            
            const header = document.createElement("div");
            header.className = "drakon-result-header";
            
            const badgeInfo = getTypeLabel(item.type);
            const tag = document.createElement("span");
            tag.className = `drakon-type-tag ${badgeInfo.css}`;
            tag.innerText = badgeInfo.text;
            header.appendChild(tag);
            
            const idSpan = document.createElement("span");
            idSpan.className = "drakon-result-id";
            idSpan.innerText = `ID: ${id}`;
            header.appendChild(idSpan);
            
            itemUI.appendChild(header);
            
            const content = document.createElement("div");
            content.className = "drakon-result-content";
            content.innerText = text;
            itemUI.appendChild(content);
            
            itemUI.onclick = () => {
                m.drakon.showItem(id);
                document.body.removeChild(overlay);
            };
            
            resultsList.appendChild(itemUI);
        });
    }
    
    // Live search as they type
    input.addEventListener("input", (e) => {
        renderResults(e.target.value);
    });
    
    // Initial display
    renderResults("");
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    input.focus();
}

function showGlobalSearchDialog() {
    closeMenu();
    
    // Inject styles for global search list and tags if not already present
    let styleTag = document.getElementById("drakon-global-search-styles");
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "drakon-global-search-styles";
        styleTag.innerHTML = `
            .drakon-gsearch-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.65); display: flex; align-items: center;
                justify-content: center; z-index: 10005;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .drakon-gsearch-modal {
                background: #252526; color: #cccccc; border: 1px solid #454545;
                border-radius: 8px; padding: 20px; width: 500px; max-height: 80vh;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 14px;
            }
            .drakon-gsearch-input {
                background: #3c3c3c; color: #ffffff; border: 1px solid #6b6b6b;
                border-radius: 4px; padding: 8px 12px; font-size: 14px; outline: none;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                width: 100%; box-sizing: border-box;
            }
            .drakon-gsearch-input:focus {
                border-color: #0e639c;
                box-shadow: 0 0 5px rgba(14, 99, 156, 0.5);
            }
            .drakon-gresults-container {
                overflow-y: auto; flex: 1; max-height: 350px;
                border: 1px solid #3c3c3c; border-radius: 4px; background: #1e1e1e;
            }
            .drakon-gresult-item {
                padding: 12px 14px; border-bottom: 1px solid #2d2d2d; cursor: pointer;
                transition: background 0.15s ease, border-left-color 0.15s ease;
                display: flex; flex-direction: column; gap: 6px; border-left: 3px solid transparent;
            }
            .drakon-gresult-item:hover {
                background: #2a2d2e; border-left-color: #0e639c;
            }
            .drakon-gresult-item:last-child {
                border-bottom: none;
            }
            .drakon-gresult-header {
                display: flex; align-items: center; justify-content: space-between;
            }
            .drakon-gresult-file {
                font-size: 12px; font-weight: 600; color: #3794ff;
            }
            .drakon-gresult-meta {
                display: flex; align-items: center; gap: 8px;
            }
            .drakon-gtype-tag {
                font-size: 9px; font-weight: 600; text-transform: uppercase;
                padding: 1px 4px; border-radius: 2px; display: inline-block;
            }
            .drakon-gtype-tag.action { background: #004b7c; color: #5cb8ff; border: 1px solid #005a95; }
            .drakon-gtype-tag.question { background: #6b1414; color: #ff8b8b; border: 1px solid #7d1a1a; }
            .drakon-gtype-tag.loop { background: #6d4000; color: #ffd180; border: 1px solid #824d00; }
            .drakon-gtype-tag.branch { background: #195219; color: #8bff8b; border: 1px solid #206720; }
            .drakon-gtype-tag.comment { background: #4a4a4a; color: #e0e0e0; border: 1px solid #575757; }
            .drakon-gtype-tag.other { background: #333333; color: #aaaaaa; border: 1px solid #444444; }
            .drakon-gresult-id {
                font-size: 10px; color: #858585; font-family: monospace;
            }
            .drakon-gresult-content {
                font-size: 13px; color: #e1e1e1; white-space: pre-wrap; word-break: break-word;
            }
            .drakon-gresult-path {
                font-size: 10px; color: #6e6e6e; margin-top: 2px;
            }
            .drakon-gno-results {
                padding: 20px; text-align: center; color: #858585; font-size: 13px;
            }
        `;
        document.head.appendChild(styleTag);
    }
    
    const overlay = document.createElement("div");
    overlay.className = "drakon-gsearch-overlay";
    
    const modal = document.createElement("div");
    modal.className = "drakon-gsearch-modal";
    
    const title = document.createElement("h3");
    title.innerText = "Глобальный поиск по проекту";
    title.style.cssText = "margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;";
    modal.appendChild(title);
    
    const input = document.createElement("input");
    input.type = "text";
    input.className = "drakon-gsearch-input";
    input.placeholder = "Введите text для поиска по всем схемам...";
    modal.appendChild(input);
    
    const resultsList = document.createElement("div");
    resultsList.className = "drakon-gresults-container";
    modal.appendChild(resultsList);
    
    const buttons = document.createElement("div");
    buttons.style.cssText = "display: flex; justify-content: flex-end; margin-top: 6px;";
    
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Закрыть";
    closeBtn.style.cssText = `
        background: #3c3c3c; color: #ffffff; border: none; border-radius: 4px;
        padding: 6px 14px; cursor: pointer; font-size: 13px; font-weight: 500;
        transition: background 0.15s ease;
    `;
    closeBtn.onmouseenter = () => closeBtn.style.background = "#4f4f4f";
    closeBtn.onmouseleave = () => closeBtn.style.background = "#3c3c3c";
    closeBtn.onclick = () => {
        window.activeGlobalSearchResultsHandler = null;
        document.body.removeChild(overlay);
    };
    buttons.appendChild(closeBtn);
    modal.appendChild(buttons);
    
    function getTypeLabel(type) {
        switch (type) {
            case "action": return { text: "Действие", css: "action" };
            case "question": return { text: "Вопрос", css: "question" };
            case "loopbegin": return { text: "Начало цикла", css: "loop" };
            case "loopend": return { text: "Конец цикла", css: "loop" };
            case "branch": return { text: "Ветвь", css: "branch" };
            case "comment": return { text: "Комментарий", css: "comment" };
            case "insertion": return { text: "Вставка", css: "action" };
            case "select": return { text: "Выбор", css: "loop" };
            case "case": return { text: "Вариант", css: "other" };
            case "input": return { text: "Ввод", css: "action" };
            case "output": return { text: "Вывод", css: "action" };
            case "simpleinput": return { text: "Ввод", css: "action" };
            case "simpleoutput": return { text: "Вывод", css: "action" };
            default: return { text: type || "Элемент", css: "other" };
        }
    }
    
    window.activeGlobalSearchResultsHandler = function (results) {
        resultsList.innerHTML = "";
        
        if (results.length === 0) {
            const noResults = document.createElement("div");
            noResults.className = "drakon-gno-results";
            noResults.innerText = input.value.trim() ? "Совпадений не найдено." : "Введите текст, чтобы начать глобальный поиск.";
            resultsList.appendChild(noResults);
            return;
        }
        
        results.forEach((res) => {
            const itemUI = document.createElement("div");
            itemUI.className = "drakon-gresult-item";
            
            const header = document.createElement("div");
            header.className = "drakon-gresult-header";
            
            const fileSpan = document.createElement("span");
            fileSpan.className = "drakon-gresult-file";
            fileSpan.innerText = res.fileName;
            header.appendChild(fileSpan);
            
            const meta = document.createElement("div");
            meta.className = "drakon-gresult-meta";
            
            const badgeInfo = getTypeLabel(res.type);
            const tag = document.createElement("span");
            tag.className = `drakon-gtype-tag ${badgeInfo.css}`;
            tag.innerText = badgeInfo.text;
            meta.appendChild(tag);
            
            const idSpan = document.createElement("span");
            idSpan.className = "drakon-gresult-id";
            idSpan.innerText = `ID: ${res.id}`;
            meta.appendChild(idSpan);
            
            header.appendChild(meta);
            itemUI.appendChild(header);
            
            const content = document.createElement("div");
            content.className = "drakon-gresult-content";
            content.innerText = res.content;
            itemUI.appendChild(content);
            
            const pathUI = document.createElement("div");
            pathUI.className = "drakon-gresult-path";
            pathUI.innerText = res.relativePath;
            itemUI.appendChild(pathUI);
            
            itemUI.onclick = () => {
                if (window.vscode) {
                    window.vscode.postMessage({
                        command: 'openAndShowItem',
                        uri: res.uri,
                        itemId: res.id
                    });
                }
                window.activeGlobalSearchResultsHandler = null;
                document.body.removeChild(overlay);
            };
            
            resultsList.appendChild(itemUI);
        });
    };
    
    // Live search as they type
    input.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        if (!query) {
            resultsList.innerHTML = "";
            const noResults = document.createElement("div");
            noResults.className = "drakon-gno-results";
            noResults.innerText = "Введите текст, чтобы начать глобальный поиск.";
            resultsList.appendChild(noResults);
            return;
        }
        
        if (window.vscode) {
            window.vscode.postMessage({
                command: 'globalSearchText',
                query: query
            });
        }
    });
    
    // Initial display
    resultsList.innerHTML = "";
    const noResults = document.createElement("div");
    noResults.className = "drakon-gno-results";
    noResults.innerText = "Введите текст, чтобы начать глобальный поиск.";
    resultsList.appendChild(noResults);
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    input.focus();
}

main()

})();

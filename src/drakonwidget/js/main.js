

// Created with Drakon Tech https://drakon.tech/

(function() {

    // Send console logs to the extension
    const oldLog = console.log;
    console.log = function(...args) {
        oldLog.apply(console, args);
        if (window.vscode) {
            window.vscode.postMessage({
                command: 'log',
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            });
        }
    };
    const oldError = console.error;
    console.error = function(...args) {
        oldError.apply(console, args);
        if (window.vscode) {
            window.vscode.postMessage({
                command: 'log',
                message: '[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
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
            console.log('setItem namespacedKey: ', namespacedKey);
            console.log('setItem value: ' + JSON.stringify(value));
        },

        getItem: (key) => {
            const namespacedKey = `${WEBVIEW_NAMESPACE}:${key}`;
            const value = localStorage.getItem(namespacedKey);
            console.log('getItem namespacedKey: ', namespacedKey);
            console.log('getItem value: ' + value);
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
        vscode.postMessage({
            command: 'changeTheme',
            theme: this.value
        });
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
    var canSelect, config, currentTheme;
    canSelect = (
        m.currentMode !== "no-select"
    );
    currentTheme = localStorage.getItem(
        "current-theme"
    )
    config = JSON.parse(
        localStorage.getItem(currentTheme)
    )
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
            ontainer.style.paddingLeft = core.config.padding
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

function eventListener(event) {
    var _sw_9, currentDiagram, diagram, diagramStr;
    if (event.data) {
        _sw_9 = event.data.command;
        if (_sw_9 === 'toggleShowIds') {
            toggleShowIds();
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
                console.log(
                    'loadDiagram. Diagram: ',
                    JSON.stringify(diagram, null, 2)
                )
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
                                    vscode.postMessage({
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
                                    vscode.postMessage({
                                        command: 'themeData',
                                        theme: name,
                                        data: themeData
                                    });
                                } else if (_sw_9 === 'loadCustomThemes') {
                                    console.log("WebView received loadCustomThemes, payload:", event.data.themes);
                                    if (event.data.themes) {
                                        // Ensure default themes are initialized first
                                        loadThemes();
                                        
                                        // Read existing theme IDs from localStorage
                                        const currentIds = getThemes() || [];
                                        console.log("Current theme IDs before merge:", JSON.stringify(currentIds));
                                        
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
                                            
                                            console.log("Saving custom theme: " + themeId + " -> " + JSON.stringify(themeObj));
                                            localStorage.setItem(themeId, JSON.stringify(themeObj));
                                            
                                            if (currentIds.indexOf(themeId) === -1) {
                                                currentIds.push(themeId);
                                            }
                                        }
                                        
                                        console.log("Saving updated theme list after merge:", JSON.stringify(currentIds));
                                        localStorage.setItem('themes', JSON.stringify(currentIds));
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
                                            console.log("applyTheme (themeClass) applying vs theme class: " + event.data.themeClass);
                                            document.body.classList.remove(
                                                'vscode-light',
                                                'vscode-dark',
                                                'drakon-light',
                                                'drakon-dark'
                                            );
                                            document.body.classList.add(event.data.themeClass);
                                            let themeKey = "theme-class";
                                            if (event.data.themeClass.includes('dark')) {
                                                themeKey = "theme-greys";
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
    var _6_col, _6_it, _6_length, theme, themeId, themes;
    combo.innerHTML = ""
    themes = getThemes()
    _6_it = 0;
    _6_col = themes;
    _6_length = _6_col.length;
    while (true) {
        if (_6_it < _6_length) {
            themeId = _6_col[_6_it];
            theme = JSON.parse(
                localStorage.getItem(themeId)
            )
            addOption(combo, themeId, theme.name)
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
    console.log("getThemes() raw string from localStorage: " + str);
    if (str) {
        try {
            const parsed = JSON.parse(str);
            console.log("getThemes() parsed list: " + JSON.stringify(parsed));
            return parsed;
        } catch (e) {
            console.error("getThemes() parse error: " + e.message);
            return undefined;
        }
    } else {
        console.log("getThemes() - 'themes' key not found in localStorage");
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
    if (list) {
        for (i = 0; i < list.length; i++) {
            if (!localStorage.getItem(list[i])) {
                console.log("loadThemes() theme missing from storage: " + list[i]);
                missing = true;
                break;
            }
        }
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
        "set-theme-json-button",
        setThemeJson
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
    themes = createThemes()
    ids = themes.map(
        function (theme) {
            return theme.id
        }
    )
    localStorage.setItem(
        "themes",
        JSON.stringify(ids)
    )
    console.log("saveThemesInStorage() wrote default theme IDs: " + JSON.stringify(ids));
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
        "theme-class"
    )
    console.log("saveThemesInStorage() finished");
}

function sendUpdateToVSCode(diagram) {
    if (vscode) {
        vscode.postMessage(
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

async function setThemeJson(evt) {
    var beautiful, current, errTry, newContent, newDiagram, theme;
    current = localStorage.getItem(
        "current-theme"
    )
    theme = JSON.parse(
        localStorage.getItem(current)
    )
    beautiful = JSON.stringify(
        theme,
        null,
        4
    )
    newContent = await m.widgets.largeBox(
        evt.clientX,
        evt.clientY,
        "Theme",
        beautiful,
        undefined
    )
    if (newContent === undefined) {
    } else {
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
            if ((newDiagram.name) && (newDiagram.id)) {
                isolatedStorage.setItem(
                    current,
                    newContent
                )
                reloadCurrent()
                closeMenu()
            } else {
                m.widgets.showErrorSnack(
                    "Error in theme structure"
                )
            }
        }
    }
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
    
    const title = document.createElement("h3");
    title.innerText = `Редактор цвета: ${themeObj.name || themeObj.id}`;
    title.style.cssText = "margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #ffffff; border-bottom: 1px solid #3c3c3c; padding-bottom: 12px;";
    modal.appendChild(title);
    
    function createColorRow(label, property, initialValue) {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;";
        
        const textLabel = document.createElement("span");
        textLabel.innerText = label;
        textLabel.style.cssText = "font-size: 13px; color: #bbbbbb;";
        row.appendChild(textLabel);
        
        const swatch = document.createElement("div");
        swatch.style.cssText = `
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 2px solid #555555;
            background: ${initialValue || "#ffffff"};
            cursor: pointer;
            position: relative;
            box-shadow: inset 0 0 4px rgba(0,0,0,0.3);
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
            
            themeColors[property] = newColor;
            localStorage.setItem(currentThemeId, JSON.stringify(themeObj));
            reloadCurrent();
        });
        
        swatch.appendChild(colorInput);
        row.appendChild(swatch);
        return row;
    }
    
    modal.appendChild(createColorRow("Цвет фона (Canvas Background)", "background", themeColors.background));
    modal.appendChild(createColorRow("Фон блоков (Block Background)", "iconBack", themeColors.iconBack));
    modal.appendChild(createColorRow("Контур блоков (Block Border)", "iconBorder", themeColors.iconBorder));
    
    if (themeColors.shadowColor !== undefined) {
        modal.appendChild(createColorRow("Цвет тени (Shadow Color)", "shadowColor", themeColors.shadowColor));
    }
    
    const lineRow = document.createElement("div");
    lineRow.style.cssText = "display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; margin-top: 10px; border-top: 1px solid #3c3c3c; padding-top: 14px;";
    
    const lineLabel = document.createElement("span");
    lineLabel.innerText = "Толщина линий (Line Width)";
    lineLabel.style.cssText = "font-size: 13px; color: #bbbbbb;";
    lineRow.appendChild(lineLabel);
    
    const lineInput = document.createElement("input");
    lineInput.type = "range";
    lineInput.min = "1";
    lineInput.max = "4";
    lineInput.value = themeColors.lineWidth || 1;
    lineInput.style.cssText = "width: 100px; cursor: pointer;";
    lineInput.addEventListener("input", (e) => {
        themeColors.lineWidth = parseInt(e.target.value);
        localStorage.setItem(currentThemeId, JSON.stringify(themeObj));
        reloadCurrent();
    });
    lineRow.appendChild(lineInput);
    modal.appendChild(lineRow);
    
    const isBuiltIn = [
        "theme-bq", "theme-str", "theme-class", "theme-egg", 
        "theme-green", "theme-greys", "theme-gow", "theme-white"
    ].indexOf(currentThemeId) !== -1;
    
    const footer = document.createElement("div");
    footer.style.cssText = `
        display: flex;
        justify-content: ${isBuiltIn ? "flex-end" : "space-between"};
        align-items: center;
        margin-top: 24px;
        border-top: 1px solid #3c3c3c;
        padding-top: 16px;
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
        deleteBtn.onclick = () => {
            if (confirm(`Вы действительно хотите удалить тему "${themeObj.name || themeObj.id}"?`)) {
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
                if (vscode) {
                    vscode.postMessage({
                        command: 'deleteCustomTheme',
                        themeName: themeObj.name || themeObj.id
                    });
                }
                localStorage.setItem("current-theme", "theme-class");
                if (combo) {
                    combo.value = "theme-class";
                }
                reloadCurrent();
                document.body.removeChild(overlay);
            }
        };
        footer.appendChild(deleteBtn);
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
        if (vscode) {
            vscode.postMessage({
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

main()

})();

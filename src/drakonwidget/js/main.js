

// Created with Drakon Tech https://drakon.tech/

(function() {

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

function addText(element, text) {
    var newNode;
    newNode = document.createTextNode(text);
    add(element, newNode)
}

function addToBuffer(buffer, ch) {
    buffer.text += ch
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

function eventListener(event) {
    var _sw_9, currentDiagram, diagram, diagramStr;
    if (event.data) {
        _sw_9 = event.data.command;
        if (_sw_9 === 'loadDiagram') {
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
                                        createEditSender()
                                    )
                                    console.log(
                                        'revertFilename. Diagram: ',
                                        JSON.stringify(diagram, null, 2)
                                    )
                                }
                            } else {
                                if (_sw_9 === 'applyTheme') {
                                } else {
                                    throw new Error("Unexpected Choice value: " + _sw_9);
                                }
                                document.body.classList.remove(
                                    'vscode-light',
                                    'vscode-dark',
                                    'drakon-light',
                                    'drakon-dark'
                                )
                                document.body.classList.add(
                                    event.data.themeClass
                                )
                                if ((window.DrakonWidget) && (window.DrakonWidget.setTheme)) {
                                    window.DrakonWidget.setTheme(
                                        event.data.themeClass.includes(
                                            'dark'
                                        ) ? 'dark': 'light'
                                    )
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
    if (str) {
        return JSON.parse(str)
    } else {
        return undefined
    }
}

function initDrakonWidget() {
    m.drakon = createDrakonWidget()
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

function initToolbar() {
    var below, toolbar;
    toolbar = get("left-toolbar")
    addIconButton(
        toolbar,
        "menu.png",
        showMenu,
        "Menu"
    )
    addVSpace(toolbar)
    addIconButton(
        toolbar,
        "zoom.png",
        showZoom,
        "Zoom"
    )
    addVSpace(toolbar)
    addIconButton(
        toolbar,
        "undo.png",
        undo,
        "Undo. Key: Ctrl+Z"
    )
    addIconButton(
        toolbar,
        "redo.png",
        redo,
        "Redo. Key: Ctrl+Y"
    )
    addVSpace(toolbar)
    addInsertButton(
        toolbar,
        "action.png",
        "action",
        "Action. Key: A",
        "A"
    )
    addInsertButton(
        toolbar,
        "question.png",
        "question",
        "Question. Key: Q",
        "Q"
    )
    addInsertButton(
        toolbar,
        "select.png",
        "select",
        "Choice. Key: S",
        "S"
    )
    addInsertButton(
        toolbar,
        "case.png",
        "case",
        "Case. Key: C",
        "C"
    )
    addInsertButton(
        toolbar,
        "foreach.png",
        "foreach",
        "FOR loop. Key: L",
        "L"
    )
    addVSpace(toolbar)
    addIconButton(
        toolbar,
        "silhouette.png",
        toggleSilhouette,
        "Toggle silhouette/primitive"
    )
    addInsertButton(
        toolbar,
        "branch.png",
        "branch",
        "Silhouette branch. Key: B",
        "B"
    )
    addVSpace(toolbar)
    addInsertButton(
        toolbar,
        "insertion.png",
        "insertion",
        "Insertion"
    )
    addInsertButton(
        toolbar,
        "comment.png",
        "comment",
        "Comment"
    )
    addInsertButton(
        toolbar,
        "sinput.png",
        "simpleinput",
        "Simple input"
    )
    addInsertButton(
        toolbar,
        "soutput.png",
        "simpleoutput",
        "Simple output"
    )
    addInsertButton(
        toolbar,
        "parblock.png",
        "parblock",
        "Concurrent processes"
    )
    addInsertButton(
        toolbar,
        "par.png",
        "par",
        "Add path"
    )
    addInsertButton(
        toolbar,
        "timer.png",
        "timer",
        "Timer"
    )
    addInsertButton(
        toolbar,
        "pause.png",
        "pause",
        "Pause"
    )
    addInsertButton(
        toolbar,
        "duration.png",
        "duration",
        "Duration"
    )
    addInsertButton(
        toolbar,
        "shelf.png",
        "shelf",
        "Shelf"
    )
    addInsertButton(
        toolbar,
        "process.png",
        "process",
        "Process"
    )
    addInsertButton(
        toolbar,
        "input.png",
        "input",
        "Input"
    )
    addInsertButton(
        toolbar,
        "output.png",
        "output",
        "Output"
    )
    addInsertButton(
        toolbar,
        "ctrl-start.png",
        "ctrlstart",
        "Start of control period"
    )
    addInsertButton(
        toolbar,
        "ctrl-end.png",
        "ctrlend",
        "End of control period"
    )
    addIconButton(
        toolbar,
        "group-duration.png",
        insertGroupDurationLeft,
        "Group duration (left)"
    )
    addIconButton(
        toolbar,
        "group-duration-r.png",
        insertGroupDurationRight,
        "Group duration (right)"
    )
    below = div()
    below.style.height = "50px"
    add(toolbar, below)
}

function insertGroupDurationLeft() {
    m.drakon.insertFree("group-duration-left")
}

function insertGroupDurationRight() {
    m.drakon.insertFree("group-duration-right")
}

function insertIcon(type) {
    m.drakon.showInsertionSockets(type)
}

function loadThemes() {
    var list;
    list = getThemes()
    if (list) {
    } else {
        saveThemesInStorage()
    }
}

function main() {
    var actualVersion, closeButton, currentVersion;
    m.widgets = createSimpleWidgets()
    m.widgets.init(tr)
    initDrakonWidget()
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
    initToolbar()
    loadThemes()
    closeButton = get("close-button")
    closeButton.addEventListener(
        "click",
        closeMenu
    )
    registerClick(
        "set-theme-json-button",
        setThemeJson
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
    m.drakon.setDiagram(
        currentDiagram,
        diagram,
        sender
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
    element = get(id)
    element.addEventListener(
        "change",
        action
    )
}

function registerClick(id, action) {
    var element;
    element = get(id)
    element.addEventListener("click", action)
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
    openDiagram(current)
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
            diagram.name + ".drakon",
            name + ".drakon"
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
                createEditSender()
            )
            console.log(
                'updateFileName. Diagram: ',
                JSON.stringify(diagram, null, 2)
            )
        }
    }
}

main()

})();

/* global WEBVIEW_NAMESPACE */
/* global localStorage */
/* global vscode */
/* global document */
/* global window */
/* global Mousetrap */
/* global extensionBaseUri */
/* global canvas */

(function () {
    var iconSize = 20
    var widgets
    var drakon
    var currentMode = "write"

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


    function sendUpdateToVSCode(diagram) {
        if (vscode) {
            vscode.postMessage({
                command: 'updateDiagram',
                diagram: diagram
            });
            console.log("ДРАКОН послали апдейт схемы ", JSON.stringify(diagram, null, 2))
        }
    }

    document.getElementById('themes-combobox').addEventListener('change', function () {
        vscode.postMessage({
            command: 'changeTheme',
            theme: this.value
        });
    });

    // Добавляем функции для работы с именем файла
    function updateFilename(name) {
        const currentDiagram = isolatedStorage.getItem("current-diagram");
        const diagramStr = isolatedStorage.getItem(currentDiagram);
        const diagram = JSON.parse(diagramStr);

        if (diagram.name !== name) {
            diagram.id = diagram.id.replace(diagram.name + ".drakon", name + ".drakon");
            diagram.name = name;
            isolatedStorage.setItem(currentDiagram, JSON.stringify(diagram));
            if (drakon) {
                drakon.setDiagram(currentDiagram, diagram, createEditSender());
                console.log('updateFileName. Diagram: ', JSON.stringify(diagram, null, 2));
            }
        }
    }

    function registerEventVscode() {
        window.addEventListener('message', event => {
            if (event.data?.command === 'loadDiagram') {
                const diagram = event.data.diagram;
                isolatedStorage.setItem(diagram.id, JSON.stringify(diagram));
                isolatedStorage.setItem('current-diagram', diagram.id);

                if (drakon) {
                    openDiagram(diagram.id);
                    console.log('loadDiagram. Diagram: ', JSON.stringify(diagram, null, 2));
                } else {
                    console.error("Drakon widget not initialized!");
                }
            } else if (event.data?.command === 'updateFilename') {
                updateFilename(event.data.filename);
            } else if (event.data?.command === 'revertFilename') {
                const currentDiagram = isolatedStorage.getItem("current-diagram");
                const diagramStr = isolatedStorage.getItem(currentDiagram);
                const diagram = JSON.parse(diagramStr);
                diagram.name = event.data.filename;
                isolatedStorage.setItem(currentDiagram, JSON.stringify(diagram));
                if (drakon) {
                    drakon.setDiagram(currentDiagram, diagram, createEditSender());
                    console.log('revertFilename. Diagram: ', JSON.stringify(diagram, null, 2));
                }
            } else if (event.data?.command === 'applyTheme') {
                // Удаляем все классы тем
                document.body.classList.remove(
                    'vscode-light', 'vscode-dark',
                    'drakon-light', 'drakon-dark'
                );

                // Добавляем нужный класс темы
                document.body.classList.add(event.data.themeClass);
                // Обновляем тему в DrakonWidget (если используется)
                if (window.DrakonWidget && window.DrakonWidget.setTheme) {
                    window.DrakonWidget.setTheme(event.data.themeClass.includes('dark') ? 'dark' : 'light');
                }
            }
        });
    }

    function main() {

        widgets = createSimpleWidgets()
        widgets.init(tr)
        initDrakonWidget()
        var currentVersion = drakon.getVersion()
        var actualVersion = localStorage.getItem("drakon-widget-version")
        if (actualVersion !== currentVersion) {
            localStorage.clear()
            localStorage.setItem("drakon-widget-version", currentVersion)
        }

        initToolbar()
        loadThemes()
        var closeButton = get("close-button")
        closeButton.addEventListener("click", closeMenu)

        registerClick("set-diagram-json-button", setDiagramJson)
        registerClick("set-theme-json-button", setThemeJson)

        registerChange("themes-combobox", onThemesChanged)
        registerChange("modes-combobox", onModesChanged)

        initShortcuts()
        window.onresize = debounce(onResize, 500)

        registerEventVscode();

        // Инициализация темы по умолчанию
        document.body.classList.add('vscode-light');

    }

    function initShortcuts() {
        Mousetrap.bind(['ctrl+c', 'command+c'], copy, "keydown");
        Mousetrap.bind(['ctrl+v', 'command+v'], paste, "keydown");
        Mousetrap.bind(['ctrl+x', 'command+x'], cut, "keydown");
        Mousetrap.bind(['ctrl+z', 'command+z'], undo, "keydown");
        Mousetrap.bind(['ctrl+y', 'command+y'], redo, "keydown");
        Mousetrap.bind(['del', 'backspace'], deleteSelection, "keydown");
        Mousetrap.bind('enter', editContent, "keydown");
        Mousetrap.bind('up', arrowUp, "keydown");
        Mousetrap.bind('down', arrowDown, "keydown");
        Mousetrap.bind('left', arrowLeft, "keydown");
        Mousetrap.bind('right', arrowRight, "keydown");
    }

    function arrowUp(evt) {
        evt.preventDefault()
        drakon.arrowUp()
    }

    function arrowDown(evt) {
        evt.preventDefault()
        drakon.arrowDown()
    }

    function arrowLeft(evt) {
        evt.preventDefault()
        drakon.arrowLeft()
    }

    function arrowRight(evt) {
        evt.preventDefault()
        drakon.arrowRight()
    }

    function editContent() {
        drakon.editContent()
    }

    function deleteSelection() {
        drakon.deleteSelection()
    }

    function copy() {
        drakon.copySelection()
    }

    function paste() {
        drakon.showPaste()
    }

    function cut() {
        drakon.cutSelection()
    }

    function debounce(action, delay) {
        var timeoutId = undefined
        var onTimeout = function () {
            timeoutId = undefined
            action()
        }
        var resetDebounce = function () {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
            timeoutId = setTimeout(onTimeout, delay)
        }

        return function () {
            resetDebounce()
        }
    }

    function registerChange(id, action) {
        var element = get(id)
        element.addEventListener("change", action)
    }

    function registerClick(id, action) {
        var element = get(id)
        element.addEventListener("click", action)
    }

    function onModesChanged() {
        var modes = get("modes-combobox")
        currentMode = modes.value
        reloadCurrent()
        closeMenu()
    }

    function reloadCurrent() {
        var current = isolatedStorage.getItem("current-diagram")
        openDiagram(current)
    }

    function onThemesChanged() {
        var themes = get("themes-combobox")
        localStorage.setItem("current-theme", themes.value)
        reloadCurrent()
        closeMenu()
    }

    async function setThemeJson(evt) {
        var current = localStorage.getItem("current-theme")
        var theme = JSON.parse(localStorage.getItem(current))
        var beautiful = JSON.stringify(theme, null, 4)
        var newContent = await widgets.largeBox(
            evt.clientX,
            evt.clientY,
            "Theme",
            beautiful,
            undefined
        )
        if (newContent === undefined) {
            return
        }
        var newDiagram
        try {
            newDiagram = JSON.parse(newContent)
        } catch (ex) {
            widgets.showErrorSnack("Error in JSON: " + ex.message)
            return
        }

        if (!newDiagram.name || !newDiagram.id) {
            widgets.showErrorSnack("Error in theme structure")
            return
        }

        isolatedStorage.setItem(current, newContent)
        reloadCurrent()
        closeMenu()
    }

    async function setDiagramJson(evt) {
        var current = isolatedStorage.getItem("current-diagram")
        var diagram = JSON.parse(isolatedStorage.getItem(current))
        delete diagram.id
        var beautiful = JSON.stringify(diagram, null, 4)
        var newContent = await widgets.largeBox(
            evt.clientX,
            evt.clientY,
            "Diagram source",
            beautiful,
            undefined
        )
        if (newContent === undefined) {
            return
        }
        var newDiagram
        try {
            newDiagram = JSON.parse(newContent)
        } catch (ex) {
            widgets.showErrorSnack("Error in JSON: " + ex.message)
            return
        }

        if (!newDiagram.name || !newDiagram.items) {
            widgets.showErrorSnack("Error in diagram structure")
            return
        }

        isolatedStorage.setItem(current, newContent)
        openDiagram(current)
        closeMenu()
    }

    function createEmptyDiagram(name) {
        var diagram = { name: name, items: {} }
        var list = getDiagramList()
        var id = generateId(list)
        var diagramStr = JSON.stringify(diagram)
        list.push(id)
        isolatedStorage.setItem("diagram-list", JSON.stringify(list))
        isolatedStorage.setItem(id, diagramStr)
        return id
    }

    function initToolbar() {
        var toolbar = get("left-toolbar")
        addIconButton(toolbar, "menu.png", showMenu, "Menu")
        addVSpace(toolbar)
        addIconButton(toolbar, "zoom.png", showZoom, "Zoom")
        addVSpace(toolbar)
        addIconButton(toolbar, "undo.png", undo, "Undo. Key: Ctrl+Z")
        addIconButton(toolbar, "redo.png", redo, "Redo. Key: Ctrl+Y")
        addVSpace(toolbar)
        addInsertButton(toolbar, "action.png", "action", "Action. Key: A", "A")
        addInsertButton(toolbar, "question.png", "question", "Question. Key: Q", "Q")
        addInsertButton(toolbar, "select.png", "select", "Choice. Key: S", "S")
        addInsertButton(toolbar, "case.png", "case", "Case. Key: C", "C")
        addInsertButton(toolbar, "foreach.png", "foreach", "FOR loop. Key: L", "L")
        addVSpace(toolbar)
        addIconButton(toolbar, "silhouette.png", toggleSilhouette, "Toggle silhouette/primitive")
        addInsertButton(toolbar, "branch.png", "branch", "Silhouette branch. Key: B", "B")
        addVSpace(toolbar)
        addInsertButton(toolbar, "insertion.png", "insertion", "Insertion")
        addInsertButton(toolbar, "comment.png", "comment", "Comment")
        addInsertButton(toolbar, "sinput.png", "simpleinput", "Simple input")
        addInsertButton(toolbar, "soutput.png", "simpleoutput", "Simple output")
        addInsertButton(toolbar, "parblock.png", "parblock", "Concurrent processes")
        addInsertButton(toolbar, "par.png", "par", "Add path")
        addInsertButton(toolbar, "timer.png", "timer", "Timer")
        addInsertButton(toolbar, "pause.png", "pause", "Pause")
        addInsertButton(toolbar, "duration.png", "duration", "Duration")
        addInsertButton(toolbar, "shelf.png", "shelf", "Shelf")
        addInsertButton(toolbar, "process.png", "process", "Process")
        addInsertButton(toolbar, "input.png", "input", "Input")
        addInsertButton(toolbar, "output.png", "output", "Output")
        addInsertButton(toolbar, "ctrl-start.png", "ctrlstart", "Start of control period")
        addInsertButton(toolbar, "ctrl-end.png", "ctrlend", "End of control period")
        addIconButton(toolbar, "group-duration.png", insertGroupDurationLeft, "Group duration (left)")
        addIconButton(toolbar, "group-duration-r.png", insertGroupDurationRight, "Group duration (right)")
        below = div()
        below.style.height = "50px"
        add(toolbar, below)
    }

    function showMenu() {
        var menu = get("menu")
        var diagrams = get("diagrams-combobox")
        var themes = get("themes-combobox")
        var modes = get("modes-combobox")
        fillDiagrams(diagrams)
        fillModes(modes)
        fillThemes(themes)
        menu.style.display = "inline-block"
    }

    function showZoom(ign, evt) {
        var items = []
        addZooomLevel(items, "2500", "25%")
        addZooomLevel(items, "5000", "50%")
        addZooomLevel(items, "6667", "66.667%")
        items.push({ type: "separator" })
        addZooomLevel(items, "10000", "100%")
        items.push({ type: "separator" })
        addZooomLevel(items, "11000", "110%")
        addZooomLevel(items, "12000", "120%")
        addZooomLevel(items, "15000", "150%")
        addZooomLevel(items, "20000", "200%")
        addZooomLevel(items, "40000", "400%")
        widgets.showContextMenu(
            evt.clientX,
            evt.clientY,
            items
        )
    }

    function addZooomLevel(items, value, text) {
        items.push({
            text: text,
            action: function () { setZoom(value) }
        })
    }

    function setZoom(zoom) {
        var zoomValue = parseInt(zoom)
        drakon.setZoom(zoomValue)
        closeMenu()
    }

    function closeMenu() {
        var menu = get("menu")
        menu.style.display = "none"
    }


    function fillDiagrams(diagrams) {
        diagrams.innerHTML = ""
        var diagramObjects = getDiagramObjects()
        diagramObjects.diagrams.sort(by("name"))
        for (var diagram of diagramObjects.diagrams) {
            addOption(diagrams, diagram.id, diagram.name)
        }
        diagrams.value = diagramObjects.currentDiagram
    }

    function by(prop) {
        return function (leftObj, rightObj) {
            var left = leftObj[prop]
            var right = rightObj[prop]
            if (left < right) {
                return -1
            } else if (left > right) {
                return 1
            }

            return 0
        }
    }

    function getThemes() {
        var str = localStorage.getItem("themes")
        if (str) {
            return JSON.parse(str)
        }

        return undefined
    }

    function fillThemes(combo) {
        combo.innerHTML = ""
        var themes = getThemes()
        for (var themeId of themes) {
            var theme = JSON.parse(localStorage.getItem(themeId))
            addOption(combo, themeId, theme.name)
        }
        combo.value = localStorage.getItem("current-theme")
    }

    function fillModes(modes) {
        modes.innerHTML = ""
        addOption(modes, "write", "Read/write")
        addOption(modes, "read", "Read-only")
        addOption(modes, "no-select", "Read-only, no select")
        modes.value = currentMode
    }

    function undo() {
        drakon.undo()
    }

    function redo() {
        drakon.redo()
    }

    function toggleSilhouette() {
        drakon.toggleSilhouette()
    }

    function addVSpace(toolbar) {
        var space = div()
        space.style.height = "5px";
        add(toolbar, space)
    }

    function div(className) {
        var element = document.createElement("div")
        if (className) {
            element.className = className
        }
        return element
    }

    function addInsertButton(container, image, type, tooltip, shortcut) {
        var action = function () {
            insertIcon(type)
        }

        addIconButton(container, image, action, tooltip)
        if (shortcut) {
            Mousetrap.bind(shortcut.toLowerCase(), action, "keydown")
        }
    }

    function addIconButton(container, image, action, tooltip) {
        var button = widgets.createIconButton(extensionBaseUri + "/images/" + image, action, tooltip)
        button.style.marginBottom = "3px"
        add(container, button)
        var br = document.createElement("br")
        add(container, br)
    }

    function get(id) {
        var element;
        element = document.getElementById(id);
        if (element) {
            return element;
        } else {
            throw new Error('get: Element with id not found: ' + id);
        }
    }

    function add(parent, child) {
        parent.appendChild(child);
    }

    function addOption(select, value, text) {
        var option;
        option = document.createElement('option');
        option.value = value
        addText(option, text);
        add(select, option);
    }

    function addText(element, text) {
        var newNode;
        newNode = document.createTextNode(text);
        add(element, newNode);
    }

    function insertIcon(type) {
        drakon.showInsertionSockets(type)
    }

    function insertGroupDurationRight() {
        drakon.insertFree("group-duration-right")
    }

    function insertGroupDurationLeft() {
        drakon.insertFree("group-duration-left")
    }

    function loadThemes() {
        var list = getThemes()
        if (!list) {
            saveThemesInStorage()
        }
    }

    function saveThemesInStorage() {
        var themes = createThemes()
        var ids = themes.map(function (theme) { return theme.id })
        localStorage.setItem("themes", JSON.stringify(ids))
        for (var theme of themes) {
            localStorage.setItem(theme.id, JSON.stringify(theme))
        }
        localStorage.setItem("current-theme", "theme-class")
    }

    function getDiagramList() {
        var listStr = isolatedStorage.getItem("diagram-list")
        var list = undefined
        if (listStr) {
            try {
                list = JSON.parse(listStr)
            } catch (ex) {
            }
        }
        return list
    }

    function generateId(list) {
        var id = "diagram-" + Math.floor(Math.random() * 1000 + 100)
        while (list.indexOf(id) != -1) {
            id = "diagram-" + Math.floor(Math.random() * 1000 + 100)
        }
        return id
    }

    function getDiagramObjects() {
        var list = getDiagramList()
        var output = { diagrams: [] }
        for (var id of list) {
            var diagramStr = isolatedStorage.getItem(id)
            var diagram = JSON.parse(diagramStr)
            output.diagrams.push({
                id: id,
                name: diagram.name
            })
        }
        output.currentDiagram = isolatedStorage.getItem("current-diagram")
        return output
    }

    function onItemClick(prim, pos, evt) {
        if (prim.type === "insertion") {
            if (onInsertionHotspot(prim, pos)) {
                tryGoToDiagram(prim.content)
            }
        } else if (prim.type === "action" && prim.link) {
            if (onActionHotspot(prim, pos)) {
                window.open(prim.link, '_blank');
            }
        }
    }

    function getCursorForItem(prim, pos, evt) {
        if (prim.type === "insertion") {
            if (onInsertionHotspot(prim, pos)) {
                return "pointer"
            }
        } else if (prim.type === "action" && prim.link) {
            if (onActionHotspot(prim, pos)) {
                return "pointer"
            }
        }

        return "grab"
    }

    function tryGoToDiagram(name) {
        if (!name) {
            return
        }

        name = name.toLowerCase().trim()
        var diagrams = getDiagramObjects()
        for (var diagram of diagrams.diagrams) {
            var dname = diagram.name.toLowerCase()
            if (dname === name) {
                openDiagram(diagram.id)
                return
            }
        }
    }

    function onInsertionHotspot(prim, pos) {
        var padding = 10
        var left = prim.diagramLeft + padding * 2
        var top = prim.diagramTop + padding
        var right = prim.diagramLeft + prim.diagramWidth - padding * 2
        var bottom = prim.diagramTop + prim.diagramHeight - padding
        if (pos.x > left && pos.x < right && pos.y > top && pos.y < bottom) {
            return true
        }
        return false
    }

    function onActionHotspot(prim, pos) {
        var padding = 10
        var left = prim.diagramLeft
        var top = prim.diagramTop
        var right = prim.diagramLeft + iconSize + padding * 2
        var bottom = prim.diagramTop + prim.diagramHeight
        if (pos.x > left && pos.x < right && pos.y > top && pos.y < bottom) {
            return true
        }
        return false
    }

    function startEditContent(prim, ro) {
        if (prim.type === "header") {
            if (ro) {
                widgets.inputBoxRo(
                    prim.left,
                    prim.top,
                    "Name",
                    prim.content
                )
            } else {
                widgets.inputBox(
                    prim.left,
                    prim.top,
                    tr("Rename"),
                    prim.content,
                    nameNotEmpty
                ).then(function (newContent) {
                    if (newContent && newContent !== prim.content) {
                        drakon.setContent(
                            prim.id,
                            newContent
                        )
                        drakon.redraw()
                    }
                })
            }
        } else {
            if (ro) {
                widgets.largeBoxRo(
                    prim.left,
                    prim.top,
                    "",
                    prim.content
                )
            } else {
                widgets.largeBox(
                    prim.left,
                    prim.top,
                    "",
                    prim.content
                ).then(function (newContent) {
                    if (newContent !== undefined && newContent != prim.content) {
                        drakon.setContent(
                            prim.id,
                            newContent
                        )
                    }
                })
            }
        }
    }

    async function startEditSecondary(prim, ro) {

        if (ro) {
            widgets.largeBoxRo(
                prim.left,
                prim.top,
                "",
                prim.secondary
            )
        } else {
            var newContent = await widgets.largeBox(
                prim.left,
                prim.top,
                "",
                prim.secondary
            )

            if (newContent !== undefined && newContent != prim.secondary) {
                drakon.setSecondary(
                    prim.id,
                    newContent
                )
            }
        }
    }

    async function startEditStyle(ids, oldStyle, x, y) {
        var old = JSON.stringify(oldStyle, null, 4)
        var newContent = await widgets.largeBox(
            x,
            y,
            "",
            old
        )


        if (newContent !== undefined) {
            var style = ""
            if (newContent) {
                style = JSON.parse(newContent)
            }
            drakon.setStyle(
                ids,
                style
            )
        }
    }

    async function startEditDiagramStyle(oldStyle, x, y) {
        var old = JSON.stringify(oldStyle, null, 4)
        var newContent = await widgets.largeBox(
            x,
            y,
            "",
            old
        )


        if (newContent !== undefined) {
            var style = ""
            if (newContent) {
                style = JSON.parse(newContent)
            }
            drakon.setDiagramStyle(
                style
            )
        }
    }

    async function startEditLink(prim, ro) {

        if (ro) {
            widgets.largeBoxRo(
                prim.left,
                prim.top,
                "",
                prim.link
            )
        } else {
            var newContent = await widgets.largeBox(
                prim.left,
                prim.top,
                "",
                prim.link
            )

            if (newContent !== undefined && newContent != prim.link) {
                drakon.setLink(
                    prim.id,
                    newContent
                )
            }
        }
    }

    function tr(text) {
        console.log("tr", text)
        return text
    }

    function nameNotEmpty(text) {
        text = text || ""
        if (!text.trim()) {
            return "Name cannot be empty"
        }

        return undefined
    }

    function buildConfig() {
        var canSelect = (currentMode !== "no-select");
        var currentTheme = localStorage.getItem("current-theme")
        var config = JSON.parse(localStorage.getItem(currentTheme))
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

    function showContextMenu(x, y, items, options) {
        items.forEach(addIconPath)
        widgets.showContextMenu(x, y, items, options)
    }

    function addIconPath(item) {
        if (item.icon) {
            item.icon = extensionBaseUri + "/images/" + item.icon
        }
    }

    function createEditSender() {
        return {
            stop: function () { },
            pushEdit: pushEdit
        }
    }

    function pushEdit(edit) {
        console.log("pushEdit", JSON.stringify(edit, null, 4))
        var currentDiagram = isolatedStorage.getItem("current-diagram")
        var diagramStr = isolatedStorage.getItem(currentDiagram)
        var diagram = JSON.parse(diagramStr)
        for (var change of edit.changes) {
            if (change.id) {
                updateDiagramItem(diagram, change.id, change.op, change.fields)
            } else {
                Object.assign(diagram, change.fields)
            }
        }
        var changedDiagram = JSON.stringify(diagram)
        isolatedStorage.setItem(currentDiagram, changedDiagram)

        sendUpdateToVSCode(diagram)

    }

    function updateDiagramItem(diagram, itemId, op, fields) {
        if (!diagram.items) {
            diagram.items = {}
        }
        switch (op) {
            case "insert":
                diagram.items[itemId] = fields
                break;
            case "update":
                Object.assign(diagram.items[itemId], fields)
                break;
            case "delete":
                delete diagram.items[itemId]
                break;
            default:
                throw new Error("Unsupported edit operation: " + op)
        }
    }

    function renderEditorWidget() {
        var editorArea = get("editor-area")
        var rect = editorArea.getBoundingClientRect()
        editorArea.innerHTML = ""
        var config = buildConfig()
        canvas = drakon.render(
            rect.width,
            rect.height,
            config
        )
        add(editorArea, canvas)
    }

    function openDiagram(currentDiagram) {
        renderEditorWidget()
        var sender = createEditSender()
        var diagramStr = isolatedStorage.getItem(currentDiagram)
        var diagram = JSON.parse(diagramStr)
        if (currentMode === "write") {
            diagram.access = "write"
        } else {
            diagram.access = "read"
        }

        drakon.setDiagram(
            currentDiagram,
            diagram,
            sender
        )

        isolatedStorage.setItem("current-diagram", currentDiagram)

    }

    function onResize() {
        renderEditorWidget()
        drakon.redraw()
    }

    function initDrakonWidget() {
        drakon = createDrakonWidget()
    }

    function buildIconCore(context) {
        var core = {}
        Object.assign(core, context)
        core.buildDom = function () { return customBuildDom(core) }
        return core
    }

    function getThemeValue(core, name) {
        if (core.style && core.style[name]) {
            return core.style[name]
        }

        var theme = core.config.theme
        if (theme.icons && theme.icons.action && theme.icons.action[name]) {
            return theme.icons.action[name]
        }

        return theme[name]
    }

    function customBuildDom(core) {
        if (core.type !== "action") {
            return undefined
        }

        var paddingTop = core.config.padding + "px"
        var paddingBottom = core.config.padding + "px"
        var paddingLeft = core.config.padding + "px"
        var paddingRight = core.config.padding + "px"
        var color = getThemeValue(core, "color")
        var textAlign = getThemeValue(core, "textAlign")
        textAlign = textAlign || "left"
        var font = getThemeValue(core, "font")
        font = font || core.config.font

        var container = div("icon-container")
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
        container.style.minWidth = core.config.minWidth + "px"
        container.style.maxWidth = core.config.maxWidth + "px"
        container.style.lineHeight = core.config.lineHeight * 100 + "%"

        parseHomeMadeMarkdown(core.content, container)

        if (core.link) {
            container.style.paddingLeft = core.config.padding * 2 + iconSize + "px"
            var icon = document.createElement("img")
            icon.src = extensionBaseUri + "/images/link.png"
            icon.style.width = iconSize + "px"
            icon.style.height = iconSize + "px"
            icon.style.display = "inline-block"
            icon.style.position = "absolute"
            icon.style.verticalAlign = "middle"
            icon.style.left = core.config.padding + "px"
            icon.style.top = "50%"
            icon.style.transform = "translateY(-50%)"
            add(container, icon)
        }

        return container
    }

    function parseHomeMadeMarkdown(text, container) {
        if (!text) {
            return
        }

        var lines = text.split("\n")


        for (var line of lines) {
            var element = parseParagraph(line)
            add(container, element)
        }
    }


    function createBuffer(type) {
        return {
            text: "",
            type: type
        }
    }

    function completeBuffer(buffer, par) {
        if (buffer.text) {
            switch (buffer.type) {
                case "normal":
                    addText(par, buffer.text)
                    break
                case "strong":
                    var strong = document.createElement("strong")
                    addText(strong, buffer.text)
                    add(par, strong)
                    break
                case "em":
                    var em = document.createElement("em")
                    addText(em, buffer.text)
                    add(par, em)
                    break
            }
            buffer.text = ""
        }
    }

    function addToBuffer(buffer, ch) {
        buffer.text += ch
    }

    function parseParagraph(line) {
        var par = document.createElement("p")
        var buffer = createBuffer("normal")
        var state = "start"
        for (var c of line) {
            switch (state) {
                case "start":
                    if (c === "-") {
                        addToBuffer(buffer, "•")
                        state = "normal"
                    } else if (c === "_") {
                        state = "under-1"
                    } else {
                        addToBuffer(buffer, c)
                        state = "normal"
                    }
                    break
                case "normal":
                    if (c === "_") {
                        state = "under-1"
                    } else {
                        addToBuffer(buffer, c)
                        state = "normal"
                    }
                    break
                case "under-1":
                    if (c === "_") {
                        state = "under-2"
                    } else {
                        completeBuffer(buffer, par)
                        buffer = createBuffer("em")
                        addToBuffer(buffer, c)
                        state = "em"
                    }
                    break
                case "under-2":
                    if (c === "_") {
                        addToBuffer(buffer, c)
                        state = "normal"
                    } else {
                        completeBuffer(buffer, par)
                        buffer = createBuffer("strong")
                        addToBuffer(buffer, c)
                        state = "strong"
                    }
                    break
                case "strong":
                    if (c === "_") {
                        state = "end-under-1"
                    } else {
                        addToBuffer(buffer, c)
                        state = "strong"
                    }
                    break
                case "em":
                    if (c === "_") {
                        completeBuffer(buffer, par)
                        buffer = createBuffer("normal")
                        state = "normal"
                    } else {
                        addToBuffer(buffer, c)
                        state = "em"
                    }
                    break
                case "end-under-1":
                    if (c === "_") {
                        completeBuffer(buffer, par)
                        buffer = createBuffer("normal")
                        state = "normal"
                    } else {
                        addToBuffer(buffer, "_")
                        addToBuffer(buffer, c)
                        state = "strong"
                    }
                    break
            }
        }
        completeBuffer(buffer, par)
        return par
    }

    main()
})();
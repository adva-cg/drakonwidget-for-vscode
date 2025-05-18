"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const assert = require('assert');
const path = require('path');
const fs = require('fs');
// Define the directory containing .drakon files
const drakonFilesDir = path.resolve(__dirname, '../../src/drakongen/examples/outdr');
function buildBranchGraph(items) {
    const mainGraph = new Map();
    const branches = new Map();
    const branchRoots = new Set();
    // 1. Строим основной граф
    for (const [nodeId, node] of Object.entries(items)) {
        const edges = [];
        if (node.one)
            edges.push(node.one);
        if (node.two)
            edges.push(node.two);
        mainGraph.set(nodeId, edges);
        if (node.type === 'branch') {
            branchRoots.add(nodeId);
        }
    }
    // 2. Для каждого branch-узла строим подграф, исключая address и следующие за ними узлы
    branchRoots.forEach(branchId => {
        var _a, _b;
        const branchGraph = new Map();
        const visited = new Set();
        const stack = [branchId];
        while (stack.length > 0) {
            const currentId = stack.pop();
            if (visited.has(currentId))
                continue;
            const currentNode = items[currentId];
            visited.add(currentId);
            // Пропускаем узлы типа 'address' и не добавляем их в подграф
            if (currentNode.type === 'address')
                continue;
            const edges = [];
            // Обрабатываем связи, исключая переходы через address
            if (currentNode.one && ((_a = items[currentNode.one]) === null || _a === void 0 ? void 0 : _a.type) !== 'address') {
                edges.push(currentNode.one);
            }
            if (currentNode.two && ((_b = items[currentNode.two]) === null || _b === void 0 ? void 0 : _b.type) !== 'address') {
                edges.push(currentNode.two);
            }
            branchGraph.set(currentId, edges);
            // Добавляем в стек только не-address узлы
            edges.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    stack.push(neighbor);
                }
            });
        }
        branches.set(branchId, branchGraph);
    });
    return {
        branches,
        mainGraph
    };
}
function buildGraph(items) {
    const graph = new Map();
    // Проходим по всем узлам в items
    for (const [nodeId, node] of Object.entries(items)) {
        const edges = [];
        if (node.one)
            edges.push(node.one);
        if (node.two)
            edges.push(node.two);
        graph.set(nodeId, edges); // Используем ключ объекта как id узла
    }
    return graph;
}
function isPlanar(graph) {
    const nodes = Array.from(graph.keys());
    // Граф с менее чем 5 узлами всегда планарен
    if (nodes.length < 5)
        return true;
    const vertices = Array.from(graph.keys());
    // Быстрая проверка по формуле Эйлера для планарных графов
    const E = Array.from(graph.values()).reduce((sum, edges) => sum + edges.length, 0) / 2;
    const V = vertices.length;
    if (E > 3 * V - 6)
        return false;
    // Проверка на K5 и K33
    function isK5(subgraph) {
        var _a;
        if (subgraph.length !== 5)
            return false;
        for (let i = 0; i < 5; i++) {
            for (let j = i + 1; j < 5; j++) {
                if (!((_a = graph.get(subgraph[i])) === null || _a === void 0 ? void 0 : _a.includes(subgraph[j]))) {
                    return false;
                }
            }
        }
        return true;
    }
    function isK33(groupA, groupB) {
        var _a;
        if (groupA.length !== 3 || groupB.length !== 3)
            return false;
        for (const a of groupA) {
            for (const b of groupB) {
                if (!((_a = graph.get(a)) === null || _a === void 0 ? void 0 : _a.includes(b))) {
                    return false;
                }
            }
        }
        return true;
    }
    // Генератор комбинаций
    function* combinations(arr, k) {
        if (k === 0)
            yield [];
        else {
            for (let i = 0; i <= arr.length - k; i++) {
                for (const c of combinations(arr.slice(i + 1), k - 1)) {
                    yield [arr[i], ...c];
                }
            }
        }
    }
    // Проверка K5
    for (const candidate of combinations(vertices, 5)) {
        if (isK5(candidate)) {
            console.log("Найден K₅:", candidate);
            return false;
        }
    }
    // Проверка K33
    for (const groupA of combinations(vertices, 3)) {
        const remaining = vertices.filter(v => !groupA.includes(v));
        for (const groupB of combinations(remaining, 3)) {
            if (isK33(groupA, groupB)) {
                console.log("Найден K₃₃:", groupA, "↔", groupB);
                return false;
            }
        }
    }
    return true;
}
function simplifyGraph(graph) {
    const invertedGraph = new Map();
    const simplified = new Map();
    // 1. Строим обратный граф (какие узлы ссылаются на текущий)
    graph.forEach((edges, nodeId) => {
        edges.forEach(target => {
            if (!invertedGraph.has(target))
                invertedGraph.set(target, []);
            invertedGraph.get(target).push(nodeId);
        });
    });
    // 2. Копируем исходный граф
    graph.forEach((edges, nodeId) => {
        simplified.set(nodeId, [...edges]);
    });
    let changed;
    do {
        changed = false;
        const nodesToRemove = new Set();
        // 3. Находим узлы для удаления:
        simplified.forEach((edges, nodeId) => {
            var _a;
            const inDegree = ((_a = invertedGraph.get(nodeId)) === null || _a === void 0 ? void 0 : _a.length) || 0;
            const outDegree = edges.length;
            // Удаляем узлы-листья (без выходов и не на них ссылаются)
            if (outDegree === 0 && inDegree === 0) {
                nodesToRemove.add(nodeId);
                return;
            }
            // Удаляем узлы с одним входом и одним выходом (не ветвления)
            if (outDegree === 1 && inDegree === 1) {
                const [onlyChild] = edges;
                const [onlyParent] = invertedGraph.get(nodeId);
                // Перекидываем ссылку от родителя к ребёнку
                const parentEdges = simplified.get(onlyParent);
                const index = parentEdges.indexOf(nodeId);
                if (index !== -1) {
                    parentEdges[index] = onlyChild;
                    nodesToRemove.add(nodeId);
                    changed = true;
                }
            }
        });
        // 4. Удаляем помеченные узлы
        nodesToRemove.forEach(nodeId => {
            simplified.delete(nodeId);
            invertedGraph.delete(nodeId);
        });
    } while (changed); // Повторяем, пока граф изменяется
    return simplified;
}
function isPlanarOptimized(graph) {
    const simplified = simplifyGraph(graph);
    console.log(`Упрощенный граф: ${Array.from(simplified.keys()).join(', ')}`);
    return isPlanar(simplified); // Используем оригинальную проверку
}
describe('Drakon Extension Path Validation', () => {
    // Add a variable to control verbose output
    const verboseOutput = false; // Set to true to enable verbose output
    // Get a list of .drakon files before running tests
    const drakonFiles = fs.readdirSync(drakonFilesDir).filter((file) => file.endsWith('.drakon'));
    // Create a test case for each .drakon file
    drakonFiles.forEach((drakonFile => {
        it(`should have valid paths to end in ${drakonFile}`, () => __awaiter(void 0, void 0, void 0, function* () {
            const drakonFilePath = path.join(drakonFilesDir, drakonFile);
            console.log(`Testing file: ${drakonFilePath}`);
            // Read the content of the .drakon file
            const drakonFileContent = fs.readFileSync(drakonFilePath, 'utf-8');
            let diagramData;
            try {
                // Parse the drakonFileContent into a JavaScript object
                diagramData = JSON.parse(drakonFileContent);
            }
            catch (parseError) {
                assert.fail(`Failed to parse ${drakonFile}: ${parseError}`);
                return; // Exit the test case if parsing fails
            }
            // --- START: Content Validation ---
            if (diagramData.items) { // Проверка на наличие items
                for (const nodeId in diagramData.items) {
                    const node = diagramData.items[nodeId];
                    // Check if the content property exists
                    if (node.content !== undefined) {
                        // Check if content is an object
                        if (typeof node.content === 'object' && node.content !== null) {
                            // Content is an object, which is invalid
                            assert.fail(`File ${drakonFile}: Node ${nodeId} has invalid content type (object). Content: ${JSON.stringify(node.content)}`);
                        }
                        // Check if content is not a string
                        if (typeof node.content !== 'string' && node.content !== null) {
                            // Content is not a string, which is invalid
                            assert.fail(`File ${drakonFile}: Node ${nodeId} has invalid content type (not string). Content: ${JSON.stringify(node.content)}`);
                        }
                    }
                }
            }
            // --- END: Content Validation ---
            // Check if all paths lead to the end icon
            if (diagramData.items) {
                const endNodeId = Object.keys(diagramData.items).find(key => diagramData.items[key].type === 'end');
                if (endNodeId) {
                    const visited = new Set();
                    const queue = [];
                    // Find all start nodes
                    for (const key in diagramData.items) {
                        if (diagramData.items[key].type === 'branch' || (!diagramData.items[key].one && !diagramData.items[key].two)) {
                            if (key !== 'header') {
                                queue.push(key);
                                visited.add(key);
                            }
                        }
                    }
                    while (queue.length > 0) {
                        const currentId = queue.shift();
                        const currentItem = diagramData.items[currentId];
                        if (currentItem.one && !visited.has(currentItem.one)) {
                            if (currentItem.one !== endNodeId) {
                                queue.push(currentItem.one);
                            }
                            visited.add(currentItem.one);
                        }
                        if (currentItem.two && !visited.has(currentItem.two)) {
                            if (currentItem.two !== endNodeId) {
                                queue.push(currentItem.two);
                            }
                            visited.add(currentItem.two);
                        }
                    }
                    // Check if all nodes are visited or lead to the end
                    for (const key in diagramData.items) {
                        if (key !== endNodeId && !visited.has(key) && key !== 'header') {
                            assert.fail(`Node ${key} does not lead to the end node or is not reachable.`);
                        }
                    }
                }
                else {
                    console.log(`File ${drakonFile} does not have an end node.`);
                    const branchNodes = Object.keys(diagramData.items)
                        .filter(key => diagramData.items[key].type === 'branch');
                    const branchNodeCount = branchNodes.length;
                    if (branchNodeCount === 1) {
                        assert.fail(`File ${drakonFile} does not have an end node.`);
                    }
                }
            }
            else {
                console.log(`File ${drakonFile} is empty.`);
            }
            // --- START: Branch Path and Incoming Icons Check ---
            if (diagramData.items) {
                const branchData = {};
                const allBranchNodes = Object.keys(diagramData.items).filter(key => diagramData.items[key].type === 'branch');
                // Helper function to find paths recursively
                function findPaths(startNodeId, currentPath, currentIncoming) {
                    const paths = [];
                    const currentNode = diagramData.items[startNodeId];
                    if (verboseOutput)
                        console.log(`  currentNode: ${JSON.stringify(currentNode)}`);
                    // Check for cycles, but allow the branch itself to be the first node in the path
                    if (currentPath.length > 1) {
                        if (currentPath.includes(startNodeId)) {
                            // Cycle detected, stop exploring this path
                            return paths;
                        }
                    }
                    // Add current node to the path
                    if (verboseOutput)
                        console.log(`findPaths: startNodeId=${startNodeId}, currentPath=${currentPath.join(' -> ')}, currentIncoming=${currentIncoming.join(', ')}`);
                    // Add current node to incoming icons if it's not a branch
                    if (currentNode.type !== 'branch') {
                        currentPath.push(startNodeId);
                        currentIncoming.push(startNodeId);
                    }
                    // Check for end conditions
                    if (currentNode.type === 'end') {
                        if (verboseOutput)
                            console.log(`  Found end: path=${[...currentPath].join(' -> ')}, incomingIcons=${[...currentIncoming].join(', ')}`);
                        paths.push({ path: [...currentPath], incomingIcons: [...currentIncoming] });
                        return paths;
                    }
                    // Check 'two' connection first
                    if (currentNode.two) {
                        const targetNode = diagramData.items[currentNode.two];
                        if (targetNode.type === 'branch') {
                            if (verboseOutput)
                                console.log(`  Found branch (two): path=${[...currentPath, currentNode.two].join(' -> ')}, incomingIcons=${[...currentIncoming].join(', ')}`);
                            paths.push({ path: [...currentPath, currentNode.two], incomingIcons: [...currentIncoming] });
                        }
                        else {
                            paths.push(...findPaths(currentNode.two, [...currentPath], [...currentIncoming]));
                        }
                    }
                    // Check 'one' connection next
                    if (currentNode.one) {
                        const targetNode = diagramData.items[currentNode.one];
                        if (targetNode.type === 'branch') {
                            if (verboseOutput)
                                console.log(`  Found branch (one): path=${[...currentPath, currentNode.one].join(' -> ')}, incomingIcons=${[...currentIncoming].join(', ')}`);
                            paths.push({ path: [...currentPath, currentNode.one], incomingIcons: [...currentIncoming] });
                        }
                        else {
                            paths.push(...findPaths(currentNode.one, [...currentPath], [...currentIncoming]));
                        }
                    }
                    return paths;
                }
                // Find paths for each branch (остальной код без изменений)
                allBranchNodes.forEach(branchId => {
                    branchData[branchId] = { paths: [], incomingIcons: [] };
                    if (verboseOutput)
                        console.log(`Processing branch: ${branchId}`);
                    const paths = findPaths(branchId, [branchId], []);
                    paths.forEach(pathInfo => {
                        branchData[branchId].paths.push(pathInfo.path);
                        branchData[branchId].incomingIcons.push(...pathInfo.incomingIcons);
                    });
                    if (branchData[branchId].paths.length === 0) {
                        if (verboseOutput)
                            console.log(`  No paths found for branch ${branchId}.`);
                    }
                    else {
                        if (verboseOutput)
                            console.log(`  Found ${branchData[branchId].paths.length} paths for branch ${branchId}.`);
                    }
                    // Remove duplicate icons
                    branchData[branchId].incomingIcons = [...new Set(branchData[branchId].incomingIcons)];
                });
                if (true) { //verboseOutput
                    for (const branchId in branchData) {
                        console.log(`Branch ${branchId}:`);
                        console.log(`  All Branch Nodes: ${allBranchNodes.join(', ')}`);
                        console.log(`  Paths: ${branchData[branchId].paths.map(path => path.join('>')).join('\n         ')}`);
                        console.log("  Incoming Icons:");
                        [...branchData[branchId].incomingIcons] // Создание копии массива
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .forEach(iconId => {
                            const icon = diagramData.items[iconId];
                            console.log(`    ${iconId}(${icon.type}${icon.content ? ': ' + icon.content : ''})`);
                        });
                    }
                }
                ;
                // --- START: Path Validation ---
                for (const branchId in branchData) {
                    const { paths, incomingIcons } = branchData[branchId];
                    if (paths.length < 2)
                        continue;
                    const validatedIcons = [];
                    for (let i = 0; i < paths.length - 1; i++) {
                        const j = i + 1;
                        // for (let j = i + 1; j < paths.length; j++) {
                        const path1Icons = paths[i].slice(1); // Exclude the branch node itself
                        const path2Icons = paths[j].slice(1);
                        const path1OnlyIcons = path1Icons.filter(icon => !path2Icons.includes(icon));
                        for (const icon of path1OnlyIcons) {
                            // Check if the icon from path1 (not in path2) is referenced by an invalid incoming icon
                            const invalidReferences = incomingIcons.filter(incIcon => {
                                const incNode = diagramData.items[incIcon];
                                return (incNode.one === icon || incNode.two === icon || diagramData.items[icon].two === incIcon) && !path1Icons.includes(incIcon) && !validatedIcons.includes(incIcon);
                            });
                            if (invalidReferences.length > 0) {
                                console.log(`Branch ${branchId}: Icon ${icon}, path ${paths[i].map(id => `${id}`).join('>')}, not in path ${paths[j].map(id => `${id}`).join('>')}) is referenced by invalid incoming icons: ${invalidReferences.map(id => `${id}`).join(', ')}`);
                                assert.fail(`Branch ${branchId}: Icon ${icon}, path ${paths[i].map(id => `${id}`).join('>')}, not in path ${paths[j].map(id => `${id}`).join('>')}) is referenced by invalid incoming icons: ${invalidReferences.map(id => `${id}`).join(', ')}`);
                            }
                            else {
                                validatedIcons.push(icon);
                            }
                        }
                    }
                }
                // --- END: Path Validation ---
            }
            ;
            // --- END: Intersection Check ---
        }));
        it(`${drakonFile} should be planar`, () => {
            const content = fs.readFileSync(path.join(drakonFilesDir, drakonFile), 'utf-8');
            const data = JSON.parse(content);
            const { branches } = buildBranchGraph(data.items);
            // Проверяем планарность для каждой ветки
            branches.forEach((branchGraph, branchId) => {
                // Преобразуем Map в массив узлов для проверки
                //const branchNodes = Array.from(branchGraph.keys());
                if (!isPlanarOptimized(branchGraph)) {
                    assert.fail(`Ветка ${branchId} в ${drakonFile} содержит K₅ или K₃₃ и непланарна!`);
                }
            });
            // // Также можно проверить весь граф целиком
            // if (!isPlanarOptimized(mainGraph)) {
            //     assert.fail(`Основной граф в ${drakonFile} непланарен!`);
            // }
        });
    }));
});
//# sourceMappingURL=drakonExtensionValidation.test.js.map
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Define the directory containing .drakon files
const drakonFilesDir = path.resolve(__dirname, '../../src/drakongen/examples/outdr');

// --- Удалены интерфейсы ---

function buildBranchGraph(items) {
    const mainGraph = new Map();
    const branches = new Map();
    const branchRoots = new Set();

    // 1. Строим основной граф
    for (const [nodeId, node] of Object.entries(items)) {
        const edges = [];
        if (node.one) edges.push(node.one);
        if (node.two) edges.push(node.two);
        mainGraph.set(nodeId, edges);

        if (node.type === 'branch') {
            branchRoots.add(nodeId);
        }
    }

    // 2. Для каждого branch-узла строим подграф, исключая address и следующие за ними узлы
    branchRoots.forEach(branchId => {
        const branchGraph = new Map();
        const visited = new Set();
        const stack = [branchId];

        while (stack.length > 0) {
            const currentId = stack.pop();
            if (visited.has(currentId)) continue;

            const currentNode = items[currentId];
            visited.add(currentId);

            // Пропускаем узлы типа 'address' и не добавляем их в подграф
            if (currentNode.type === 'address') continue;

            const edges = [];

            // Обрабатываем связи, исключая переходы через address
            if (currentNode.one && items[currentNode.one]?.type !== 'address') {
                edges.push(currentNode.one);
            }
            if (currentNode.two && items[currentNode.two]?.type !== 'address') {
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
        if (node.one) edges.push(node.one);
        if (node.two) edges.push(node.two);
        graph.set(nodeId, edges);  // Используем ключ объекта как id узла
    }

    return graph;
}

function isPlanar(graph) {
    const nodes = Array.from(graph.keys());
    if (nodes.length < 5) return true;

    const vertices = Array.from(graph.keys());
    const E = Array.from(graph.values()).reduce((sum, edges) => sum + edges.length, 0) / 2;
    const V = vertices.length;
    if (E > 3 * V - 6) return false;

    function isK5(subgraph) {
        if (subgraph.length !== 5) return false;
        for (let i = 0; i < 5; i++) {
            for (let j = i + 1; j < 5; j++) {
                if (!graph.get(subgraph[i])?.includes(subgraph[j])) {
                    return false;
                }
            }
        }
        return true;
    }

    function isK33(groupA, groupB) {
        if (groupA.length !== 3 || groupB.length !== 3) return false;
        for (const a of groupA) {
            for (const b of groupB) {
                if (!graph.get(a)?.includes(b)) {
                    return false;
                }
            }
        }
        return true;
    }

    function* combinations(arr, k) {
        if (k === 0) yield [];
        else {
            for (let i = 0; i <= arr.length - k; i++) {
                for (const c of combinations(arr.slice(i + 1), k - 1)) {
                    yield [arr[i], ...c];
                }
            }
        }
    }

    for (const candidate of combinations(vertices, 5)) {
        if (isK5(candidate)) {
            console.log("Найден K₅:", candidate);
            return false;
        }
    }

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

    graph.forEach((edges, nodeId) => {
        edges.forEach(target => {
            if (!invertedGraph.has(target)) invertedGraph.set(target, []);
            invertedGraph.get(target).push(nodeId);
        });
    });

    graph.forEach((edges, nodeId) => {
        simplified.set(nodeId, [...edges]);
    });

    let changed;
    do {
        changed = false;
        const nodesToRemove = new Set();

        simplified.forEach((edges, nodeId) => {
            const inDegree = invertedGraph.get(nodeId)?.length || 0;
            const outDegree = edges.length;

            if (outDegree === 0 && inDegree === 0) {
                nodesToRemove.add(nodeId);
                return;
            }

            if (outDegree === 1 && inDegree === 1) {
                const [onlyChild] = edges;
                const [onlyParent] = invertedGraph.get(nodeId);

                const parentEdges = simplified.get(onlyParent);
                const index = parentEdges.indexOf(nodeId);
                if (index !== -1) {
                    parentEdges[index] = onlyChild;
                    nodesToRemove.add(nodeId);
                    changed = true;
                }
            }
        });

        nodesToRemove.forEach(nodeId => {
            simplified.delete(nodeId);
            invertedGraph.delete(nodeId);
        });

    } while (changed);

    return simplified;
}

function isPlanarOptimized(graph) {
    const simplified = simplifyGraph(graph);
    console.log(`Упрощенный граф: ${Array.from(simplified.keys()).join(', ')}`);
    return isPlanar(simplified);
}

describe('Drakon Extension Path Validation', () => {
    const verboseOutput = false;

    const drakonFiles = fs.readdirSync(drakonFilesDir).filter(file => file.endsWith('.drakon'));

    drakonFiles.forEach((drakonFile => {

        it(`should have valid paths to end in ${drakonFile}`, async () => {
            const drakonFilePath = path.join(drakonFilesDir, drakonFile);
            console.log(`Testing file: ${drakonFilePath}`);

            const drakonFileContent = fs.readFileSync(drakonFilePath, 'utf-8');

            let diagramData;
            try {
                diagramData = JSON.parse(drakonFileContent);
            } catch (parseError) {
                assert.fail(`Failed to parse ${drakonFile}: ${parseError}`);
                return;
            }

            // --- START: Content Validation ---
            if (diagramData.items) {
                for (const nodeId in diagramData.items) {
                    const node = diagramData.items[nodeId];
                    if (node.content !== undefined) {
                        if (typeof node.content === 'object' && node.content !== null) {
                            assert.fail(`File ${drakonFile}: Node ${nodeId} has invalid content type (object). Content: ${JSON.stringify(node.content)}`);
                        }
                        if (typeof node.content !== 'string' && node.content !== null) {
                            assert.fail(`File ${drakonFile}: Node ${nodeId} has invalid content type (not string). Content: ${JSON.stringify(node.content)}`);
                        }
                    }
                }
            }
            // --- END: Content Validation ---

            if (diagramData.items) {
                const endNodeId = Object.keys(diagramData.items).find(key => diagramData.items[key].type === 'end');

                if (endNodeId) {
                    const visited = new Set();
                    const queue = [];

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

                    for (const key in diagramData.items) {
                        if (key !== endNodeId && !visited.has(key) && key !== 'header') {
                            assert.fail(`Node ${key} does not lead to the end node or is not reachable.`);
                        }
                    }
                } else {
                    console.log(`File ${drakonFile} does not have an end node.`);
                    const branchNodes = Object.keys(diagramData.items)
                        .filter(key => diagramData.items[key].type === 'branch');
                    const branchNodeCount = branchNodes.length;
                    if (branchNodeCount === 1) {
                        assert.fail(`File ${drakonFile} does not have an end node.`);
                    }
                }
            } else {
                console.log(`File ${drakonFile} is empty.`);
            }

            // --- START: Branch Path and Incoming Icons Check ---
            if (diagramData.items) {
                const branchData = {};
                const allBranchNodes = Object.keys(diagramData.items).filter(key => diagramData.items[key].type === 'branch');

                function findPaths(startNodeId, currentPath, currentIncoming) {
                    const paths = [];
                    const currentNode = diagramData.items[startNodeId];
                    if (verboseOutput) console.log(`  currentNode: ${JSON.stringify(currentNode)}`);
                    if (currentPath.length > 1) {
                        if (currentPath.includes(startNodeId)) {
                            return paths;
                        }
                    }

                    if (currentNode.type !== 'branch') {
                        currentPath.push(startNodeId);
                        currentIncoming.push(startNodeId);
                    }

                    if (currentNode.type === 'end') {
                        if (verboseOutput) console.log(`  Found end: path=${[...currentPath].join(' -> ')}, incomingIcons=${[...currentIncoming].join(', ')}`);
                        paths.push({ path: [...currentPath], incomingIcons: [...currentIncoming] });
                        return paths;
                    }

                    if (currentNode.two) {
                        const targetNode = diagramData.items[currentNode.two];
                        if (targetNode.type === 'branch') {
                            if (verboseOutput) console.log(`  Found branch (two): path=${[...currentPath, currentNode.two].join(' -> ')}, incomingIcons=${[...currentIncoming].join(', ')}`);
                            paths.push({ path: [...currentPath, currentNode.two], incomingIcons: [...currentIncoming] });
                        } else {
                            paths.push(...findPaths(currentNode.two, [...currentPath], [...currentIncoming]));
                        }
                    }

                    if (currentNode.one) {
                        const targetNode = diagramData.items[currentNode.one];
                        if (targetNode.type === 'branch') {
                            if (verboseOutput) console.log(`  Found branch (one): path=${[...currentPath, currentNode.one].join(' -> ')}, incomingIcons=${[...currentIncoming].join(', ')}`);
                            paths.push({ path: [...currentPath, currentNode.one], incomingIcons: [...currentIncoming] });
                        } else {
                            paths.push(...findPaths(currentNode.one, [...currentPath], [...currentIncoming]));
                        }
                    }

                    return paths;
                }

                allBranchNodes.forEach(branchId => {
                    branchData[branchId] = { paths: [], incomingIcons: [] };
                    if (verboseOutput) console.log(`Processing branch: ${branchId}`);

                    const paths = findPaths(branchId, [branchId], []);
                    paths.forEach(pathInfo => {
                        branchData[branchId].paths.push(pathInfo.path);
                        branchData[branchId].incomingIcons.push(...pathInfo.incomingIcons);
                    });

                    if (branchData[branchId].paths.length === 0) {
                        if (verboseOutput) console.log(`  No paths found for branch ${branchId}.`);
                    } else {
                        if (verboseOutput) console.log(`  Found ${branchData[branchId].paths.length} paths for branch ${branchId}.`);
                    }
                    branchData[branchId].incomingIcons = [...new Set(branchData[branchId].incomingIcons)];
                });

                if (true) {
                    for (const branchId in branchData) {
                        console.log(`Branch ${branchId}:`);
                        console.log(`  All Branch Nodes: ${allBranchNodes.join(', ')}`);
                        console.log(`  Paths: ${branchData[branchId].paths.map(path => path.join('>')).join('\n         ')}`);
                        console.log("  Incoming Icons:");
                        [...branchData[branchId].incomingIcons]
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .forEach(iconId => {
                                const icon = diagramData.items[iconId];
                                console.log(`    ${iconId}(${icon.type}${icon.content ? ': ' + icon.content : ''})`);
                            });
                    }
                }

                for (const branchId in branchData) {
                    const { paths, incomingIcons } = branchData[branchId];

                    if (paths.length < 2) continue;
                    const validatedIcons = [];
                    for (let i = 0; i < paths.length - 1; i++) {
                        const j = i + 1;
                        const path1Icons = paths[i].slice(1);
                        const path2Icons = paths[j].slice(1);
                        const path1OnlyIcons = path1Icons.filter(icon => !path2Icons.includes(icon));

                        for (const icon of path1OnlyIcons) {
                            const invalidReferences = incomingIcons.filter(incIcon => {
                                const incNode = diagramData.items[incIcon];
                                return (incNode.one === icon || incNode.two === icon || diagramData.items[icon].two === incIcon) && !path1Icons.includes(incIcon) && !validatedIcons.includes(incIcon);
                            });
                            if (invalidReferences.length > 0) {
                                console.log(`Branch ${branchId}: Icon ${icon}, path ${paths[i].map(id => `${id}`).join('>')}, not in path ${paths[j].map(id => `${id}`).join('>')}) is referenced by invalid incoming icons: ${invalidReferences.map(id => `${id}`).join(', ')}`);
                                assert.fail(`Branch ${branchId}: Icon ${icon}, path ${paths[i].map(id => `${id}`).join('>')}, not in path ${paths[j].map(id => `${id}`).join('>')}) is referenced by invalid incoming icons: ${invalidReferences.map(id => `${id}`).join(', ')}`);
                            } else {
                                validatedIcons.push(icon);
                            }
                        }
                    }
                }
            }
        });

        it(`${drakonFile} should be planar`, () => {
            const content = fs.readFileSync(path.join(drakonFilesDir, drakonFile), 'utf-8');
            const data = JSON.parse(content);
            const { branches } = buildBranchGraph(data.items);

            branches.forEach((branchGraph, branchId) => {
                if (!isPlanarOptimized(branchGraph)) {
                    assert.fail(`Ветка ${branchId} в ${drakonFile} содержит K₅ или K₃₃ и непланарна!`);
                }
            });
        });

    }));
});
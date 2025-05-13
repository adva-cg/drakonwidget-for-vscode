const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Define the directory containing .drakon files
const drakonFilesDir = path.resolve(__dirname, '../../src/drakongen/examples/outdr');

interface DrakonNode {
    type: 'action' | 'question' | 'branch' | 'insert' | 'loopbegin' | 'loopend' | 'arrow-loop' | 'end' | 'address';
    one?: string;  // Ссылка на следующий узел (id)
    two?: string;  // Ветвь условия (если есть)
    content?: string;
}

interface GraphStructure {
    [nodeId: string]: string[];
}

function buildBranchGraph(items: Record<string, DrakonNode>): {
    branches: Map<string, Map<string, string[]>>;
    mainGraph: Map<string, string[]>;
} {
    const mainGraph = new Map<string, string[]>();
    const branches = new Map<string, Map<string, string[]>>();
    const branchRoots = new Set<string>();

    // 1. Строим основной граф
    for (const [nodeId, node] of Object.entries(items)) {
        const edges: string[] = [];
        if (node.one) edges.push(node.one);
        if (node.two) edges.push(node.two);
        mainGraph.set(nodeId, edges);

        if (node.type === 'branch') {
            branchRoots.add(nodeId);
        }
    }

    // 2. Для каждого branch-узла строим подграф, исключая address и следующие за ними узлы
    branchRoots.forEach(branchId => {
        const branchGraph = new Map<string, string[]>();
        const visited = new Set<string>();
        const stack: string[] = [branchId];

        while (stack.length > 0) {
            const currentId = stack.pop()!;
            if (visited.has(currentId)) continue;

            const currentNode = items[currentId];
            visited.add(currentId);

            // Пропускаем узлы типа 'address' и не добавляем их в подграф
            if (currentNode.type === 'address') continue;

            const edges: string[] = [];

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

function buildGraph(items: Record<string, DrakonNode>): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Проходим по всем узлам в items
    for (const [nodeId, node] of Object.entries(items)) {
        const edges: string[] = [];
        if (node.one) edges.push(node.one);
        if (node.two) edges.push(node.two);
        graph.set(nodeId, edges);  // Используем ключ объекта как id узла
    }

    return graph;
}

function isPlanar(graph: Map<string, string[]>): boolean {

    const nodes = Array.from(graph.keys());
    // Граф с менее чем 5 узлами всегда планарен
    if (nodes.length < 5) return true;

    const vertices = Array.from(graph.keys());

    // Быстрая проверка по формуле Эйлера для планарных графов
    const E = Array.from(graph.values()).reduce((sum, edges) => sum + edges.length, 0) / 2;
    const V = vertices.length;
    if (E > 3 * V - 6) return false;


    // Проверка на K5 и K33
    function isK5(subgraph: string[]): boolean {
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

    function isK33(groupA: string[], groupB: string[]): boolean {
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

    // Генератор комбинаций
    function* combinations(arr: string[], k: number): Generator<string[]> {
        if (k === 0) yield [];
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

function simplifyGraph(graph: Map<string, string[]>): Map<string, string[]> {
    const invertedGraph = new Map<string, string[]>();
    const simplified = new Map<string, string[]>();

    // 1. Строим обратный граф (какие узлы ссылаются на текущий)
    graph.forEach((edges, nodeId) => {
        edges.forEach(target => {
            if (!invertedGraph.has(target)) invertedGraph.set(target, []);
            invertedGraph.get(target)!.push(nodeId);
        });
    });

    // 2. Копируем исходный граф
    graph.forEach((edges, nodeId) => {
        simplified.set(nodeId, [...edges]);
    });

    let changed: boolean;
    do {
        changed = false;
        const nodesToRemove = new Set<string>();

        // 3. Находим узлы для удаления:
        simplified.forEach((edges, nodeId) => {
            const inDegree = invertedGraph.get(nodeId)?.length || 0;
            const outDegree = edges.length;

            // Удаляем узлы-листья (без выходов и не на них ссылаются)
            if (outDegree === 0 && inDegree === 0) {
                nodesToRemove.add(nodeId);
                return;
            }

            // Удаляем узлы с одним входом и одним выходом (не ветвления)
            if (outDegree === 1 && inDegree === 1) {
                const [onlyChild] = edges;
                const [onlyParent] = invertedGraph.get(nodeId)!;

                // Перекидываем ссылку от родителя к ребёнку
                const parentEdges = simplified.get(onlyParent)!;
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

function isPlanarOptimized(graph: Map<string, string[]>): boolean {
    const simplified = simplifyGraph(graph);
    console.log(`Упрощенный граф: ${Array.from(simplified.keys()).join(', ')}`);
    return isPlanar(simplified);  // Используем оригинальную проверку
}

describe('Drakon Extension Path Validation', () => {
    // Add a variable to control verbose output
    const verboseOutput = false; // Set to true to enable verbose output

    // Get a list of .drakon files before running tests
    const drakonFiles: string[] = fs.readdirSync(drakonFilesDir).filter((file: string) => file.endsWith('.drakon'));

    // Create a test case for each .drakon file
    drakonFiles.forEach((drakonFile => {

        it(`should have valid paths to end in ${drakonFile}`, async () => {


            const drakonFilePath = path.join(drakonFilesDir, drakonFile);
            console.log(`Testing file: ${drakonFilePath}`);

            // Read the content of the .drakon file
            const drakonFileContent = fs.readFileSync(drakonFilePath, 'utf-8');

            let diagramData: any;
            try {
                // Parse the drakonFileContent into a JavaScript object
                diagramData = JSON.parse(drakonFileContent);
            } catch (parseError) {
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
                    const visited = new Set<string>();
                    const queue: string[] = [];

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
                        const currentId = queue.shift()!;
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
                } else {
                    console.log(`File ${drakonFile} does not have an end node.`);
                    const branchNodes: string[] = Object.keys(diagramData.items)
                        .filter(key => diagramData.items[key].type === 'branch');
                    const branchNodeCount: number = branchNodes.length;
                    if (branchNodeCount === 1) {
                        assert.fail(`File ${drakonFile} does not have an end node.`);
                    }
                }
            } else {
                console.log(`File ${drakonFile} is empty.`);
            }

            // --- START: Branch Path and Incoming Icons Check ---
            if (diagramData.items) {
                const branchData: { [key: string]: { paths: string[][], incomingIcons: string[] } } = {};
                const allBranchNodes = Object.keys(diagramData.items).filter(key => diagramData.items[key].type === 'branch');

                // Helper function to find paths recursively
                function findPaths(startNodeId: string, currentPath: string[], currentIncoming: string[]): { path: string[], incomingIcons: string[] }[] {
                    const paths: { path: string[], incomingIcons: string[] }[] = [];
                    const currentNode = diagramData.items[startNodeId];
                    if (verboseOutput) console.log(`  currentNode: ${JSON.stringify(currentNode)}`);
                    // Check for cycles, but allow the branch itself to be the first node in the path
                    if (currentPath.length > 1) {
                        if (currentPath.includes(startNodeId)) {
                            // Cycle detected, stop exploring this path
                            return paths;
                        }
                    }

                    // Add current node to the path
                    if (verboseOutput) console.log(`findPaths: startNodeId=${startNodeId}, currentPath=${currentPath.join(' -> ')}, currentIncoming=${currentIncoming.join(', ')}`);

                    // Add current node to incoming icons if it's not a branch
                    if (currentNode.type !== 'branch') {
                        currentPath.push(startNodeId);
                        currentIncoming.push(startNodeId);
                    }

                    // Check for end conditions
                    if (currentNode.type === 'end') {
                        if (verboseOutput) console.log(`  Found end: path=${[...currentPath].join(' -> ')}, incomingIcons=${[...currentIncoming].join(', ')}`);
                        paths.push({ path: [...currentPath], incomingIcons: [...currentIncoming] });
                        return paths;
                    }

                    // Check 'two' connection first
                    if (currentNode.two) {
                        const targetNode = diagramData.items[currentNode.two];
                        if (targetNode.type === 'branch') {
                            if (verboseOutput) console.log(`  Found branch (two): path=${[...currentPath, currentNode.two].join(' -> ')}, incomingIcons=${[...currentIncoming].join(', ')}`);
                            paths.push({ path: [...currentPath, currentNode.two], incomingIcons: [...currentIncoming] });
                        } else {
                            paths.push(...findPaths(currentNode.two, [...currentPath], [...currentIncoming]));
                        }
                    }

                    // Check 'one' connection next
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

                // Find paths for each branch (остальной код без изменений)
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
                };

                // --- START: Path Validation ---
                for (const branchId in branchData) {
                    const { paths, incomingIcons } = branchData[branchId];

                    if (paths.length < 2) continue;
                    const validatedIcons: string[] = [];
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
                            } else {
                                validatedIcons.push(icon);
                            }
                        }
                    }
                }
                // --- END: Path Validation ---

            };
            // --- END: Intersection Check ---


        });

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

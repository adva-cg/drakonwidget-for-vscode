const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Define the directory containing .drakon files
const drakonFilesDir = path.resolve(__dirname, '../../src/drakongen/examples/outdr');

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
                        // const path2OnlyIcons = path2Icons.filter(icon => !path1Icons.includes(icon));
                        // const allPathIcons = [...new Set([...path1Icons, ...path2Icons])];

                        for (const icon of path1OnlyIcons) {
                            // Check if the icon from path1 (not in path2) is referenced by an invalid incoming icon
                            const invalidReferences = incomingIcons.filter(incIcon => {
                                const incNode = diagramData.items[incIcon];
                                return (incNode.one === icon || incNode.two === icon || diagramData.items[icon].two === incIcon) && !path1Icons.includes(incIcon) && !validatedIcons.includes(incIcon);
                            });
                            if (invalidReferences.length > 0) {
                                console.log(`Branch ${branchId}: Icon ${icon}, path ${paths[i].map(id => `${id}`).join('> ')}, not in path ${paths[j].map(id => `${id}`).join('>')}) is referenced by invalid incoming icons: ${invalidReferences.map(id => `${id}`).join(', ')}`);
                                assert.fail(`Branch ${branchId}: Icon ${icon}, path ${paths[i].map(id => `${id}`).join('> ')}, not in path ${paths[j].map(id => `${id}`).join('>')}) is referenced by invalid incoming icons: ${invalidReferences.map(id => `${id}`).join(', ')}`);
                            } else {
                                validatedIcons.push(icon);
                            }
                        }
                        // for (const icon of path2OnlyIcons) {
                        //     // Check if the icon from path2 (not in path1) is referenced by an invalid incoming icon
                        //     const invalidReferences = incomingIcons.filter(incIcon => {
                        //         const incNode = diagramData.items[incIcon];
                        //         return (incNode.one === icon || incNode.two === icon) && !allPathIcons.includes(incIcon) && !validatedIcons.includes(incIcon);
                        //     });
                        //     if (invalidReferences.length > 0) {
                        //         console.log(`Branch ${branchId}: Icon ${icon}, path ${paths[i].map(id => `${id}`).join('>')}, not in path ${paths[j].map(id => `${id}`).join('>')}) is referenced by invalid incoming icons: ${invalidReferences.map(id => `${id}`).join(', ')}`);
                        //         assert.fail(`Branch ${branchId}: Icon ${icon}, path ${paths[i].map(id => `${id}`).join('>')}, not in path ${paths[j].map(id => `${id}`).join('>')}) is referenced by invalid incoming icons: ${invalidReferences.map(id => `${id}`).join(', ')}`);
                        //         // } else {
                        //         //     validatedIcons.push(icon);
                        //     }
                        // }
                        // // }
                    }
                }
                // --- END: Path Validation ---

            };
            // --- END: Intersection Check ---
        });

    }));
});

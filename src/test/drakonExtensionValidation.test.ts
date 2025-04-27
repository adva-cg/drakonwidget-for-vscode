const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Define the directory containing .drakon files
const drakonFilesDir = path.resolve(__dirname, '../../src/drakongen/examples');

describe('Drakon Extension Path Validation', () => {
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

            // Check if all paths lead to the end icon
            const endNodeId = Object.keys(diagramData.items).find(key => diagramData.items[key].type === 'end');
            if (endNodeId) {
                const visited = new Set<string>();
                const queue: string[] = [];

                // Find all start nodes
                for (const key in diagramData.items) {
                    if (diagramData.items[key].type === 'branch') {
                        queue.push(key);
                        visited.add(key);
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
                    if (key !== endNodeId && !visited.has(key)) {
                        assert.fail(`Node ${key} does not lead to the end node or is not reachable.`);
                    }
                }
            } else {
                console.log(`File ${drakonFile} does not have an end node.`);
            }
        });
    }));
});

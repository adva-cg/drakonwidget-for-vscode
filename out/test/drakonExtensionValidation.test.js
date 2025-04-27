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
const drakonFilesDir = path.resolve(__dirname, '../../src/drakongen/examples');
describe('Drakon Extension Path Validation', () => {
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
            // Check if all paths lead to the end icon
            const endNodeId = Object.keys(diagramData.items).find(key => diagramData.items[key].type === 'end');
            if (endNodeId) {
                const visited = new Set();
                const queue = [];
                // Find all start nodes
                for (const key in diagramData.items) {
                    if (diagramData.items[key].type === 'branch') {
                        queue.push(key);
                        visited.add(key);
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
                    if (key !== endNodeId && !visited.has(key)) {
                        assert.fail(`Node ${key} does not lead to the end node or is not reachable.`);
                    }
                }
            }
            else {
                console.log(`File ${drakonFile} does not have an end node.`);
            }
        }));
    }));
});
//# sourceMappingURL=drakonExtensionValidation.test.js.map
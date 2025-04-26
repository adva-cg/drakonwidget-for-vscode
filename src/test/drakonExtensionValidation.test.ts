const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Include setupJSDOM.ts to set up the JSDOM environment
require('./setupJSDOM');

// Define the directory containing .drakon files
const drakonFilesDir = path.resolve(__dirname, '../../src/drakongen/examples'); // Changed directory here

// Now require drakongen
const drakongen = require('../../src/drakongen/src/index.js');

describe('Drakon Extension Validation', () => {
    // Get a list of .drakon files before running tests
    const drakonFiles: string[] = fs.readdirSync(drakonFilesDir).filter((file: string) => file.endsWith('.drakon')); // Explicit type annotation for file

    // Create a test case for each .drakon file
    drakonFiles.forEach((drakonFile => { // Explicit type annotation for drakonFile
        it(`should load ${drakonFile} successfully`, async () => {
            const drakonFilePath = path.join(drakonFilesDir, drakonFile);
            console.log(`Testing file: ${drakonFilePath}`);

            // Read the content of the .drakon file
            const drakonFileContent = fs.readFileSync(drakonFilePath, 'utf-8');

            // Now require drakonWidget *after* jsdom is set up
            const drakonWidgetPath = path.resolve(__dirname, '../../src/drakonwidget/libs/drakonwidget.js');
            const drakonWidget = require(drakonWidgetPath);

            // Create a Drakon widget
            const widget = drakonWidget.createDrakonWidget();
            assert.ok(widget, 'Drakon widget should be created');

            // Generate a unique diagramId for each file
            const diagramId = `diagram-${drakonFile}`;

            // Create a config object
            const config = {
                startEditContent: () => { },
                showContextMenu: () => { }
            };

            // Call render() and append to the DOM
            const widgetElement = widget.render(800, 600, config); // Example width and height
            document.body.appendChild(widgetElement);

            // Attempt to load the .drakon file content into the widget
            try {
                // Parse the drakonFileContent into a JavaScript object
                let diagramData;
                try {
                    diagramData = JSON.parse(drakonFileContent);
                } catch (parseError) {
                    assert.fail(`Failed to parse ${drakonFile}: ${parseError}`);
                    return; // Exit the test case if parsing fails
                }

                // Assuming there's a method like setDiagram on the widget
                // Replace 'setDiagram' with the actual method name if it's different
                widget.setDiagram(diagramId, diagramData, {
                    pushEdit: (edit: any) => {
                        console.log('pushEdit', edit);
                    }
                }); // Pass diagramId and parsed diagramData
                // If no error is thrown, the file loaded successfully
                console.log(`File ${drakonFile} loaded successfully.`);
            } catch (error) {
                // If an error is thrown, the file failed to load
                console.log(`File ${drakonFile} failed to load: ${error}`);
                assert.fail(`Failed to load ${drakonFile}: ${error}`);
            }

            // Now run drakongen.toTree
            try {
                const language = 'ru'; // Default language for tests
                const treeString = drakongen.toTree(drakonFileContent, drakonFile, drakonFilePath, language); // Added language parameter
                const struct = JSON.parse(treeString);
                console.log(`drakongen.toTree for ${drakonFile} completed successfully.`);
            } catch (error) {
                console.log(`drakongen.toTree failed for ${drakonFile}: ${error}`);
                assert.fail(`drakongen.toTree failed for ${drakonFile}: ${error}`);
            }
        });
    }));
});

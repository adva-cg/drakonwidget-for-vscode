const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Include setupJSDOM.ts to set up the JSDOM environment
require('./setupJSDOM');

// Define the directory containing .drakon files
const drakonFilesDir = path.resolve(__dirname, '../../src/drakongen/examples'); // Changed directory here

describe('Drakon Extension Validation', () => {
    // Get a list of .drakon files before running tests
    const drakonFiles: string[] = fs.readdirSync(drakonFilesDir).filter((file: string) => file.endsWith('.drakon')); // Explicit type annotation for file

    // Create a test case for each .drakon file
    drakonFiles.forEach((drakonFile: string) => { // Explicit type annotation for drakonFile
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

            // Attempt to load the .drakon file content into the widget
            try {
                // Assuming there's a method like loadDiagram or setDiagram on the widget
                // Replace 'setDiagram' with the actual method name if it's different
                widget.setDiagram(drakonFileContent);
                // If no error is thrown, the file loaded successfully
                console.log(`File ${drakonFile} loaded successfully.`);
            } catch (error) {
                // If an error is thrown, the file failed to load
                assert.fail(`Failed to load ${drakonFile}: ${error}`);
            }
        });
    });
});

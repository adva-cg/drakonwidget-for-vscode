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
// Include setupJSDOM.ts to set up the JSDOM environment
require('./setupJSDOM');
// Define the directory containing .drakon files
const drakonFilesDir = path.resolve(__dirname, '../../src/drakongen/examples'); // Changed directory here
describe('Drakon Extension Validation', () => {
    // Get a list of .drakon files before running tests
    const drakonFiles = fs.readdirSync(drakonFilesDir).filter((file) => file.endsWith('.drakon')); // Explicit type annotation for file
    // Create a test case for each .drakon file
    drakonFiles.forEach((drakonFile => {
        it(`should load ${drakonFile} successfully`, () => __awaiter(void 0, void 0, void 0, function* () {
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
                // Parse the drakonFileContent into a JavaScript object
                let diagramData;
                try {
                    diagramData = JSON.parse(drakonFileContent);
                }
                catch (parseError) {
                    assert.fail(`Failed to parse ${drakonFile}: ${parseError}`);
                    return; // Exit the test case if parsing fails
                }
                // Assuming there's a method like setDiagram on the widget
                // Replace 'setDiagram' with the actual method name if it's different
                widget.setDiagram("diagramId", diagramData); // Pass diagramId and parsed diagramData
                // If no error is thrown, the file loaded successfully
                console.log(`File ${drakonFile} loaded successfully.`);
            }
            catch (error) {
                // If an error is thrown, the file failed to load
                console.log(`File ${drakonFile} failed to load: ${error}`);
                assert.fail(`Failed to load ${drakonFile}: ${error}`);
            }
        }));
    }));
});
//# sourceMappingURL=drakonExtensionValidation.test.js.map
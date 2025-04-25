"use strict";
const assert = require('assert');
const fs = require('fs');
const path = require('path');
// Import the Drakonwidget library (adjust path as needed)
const drakonWidgetPath = require.resolve('../../drakonwidget/libs/drakonwidget.js');
console.log('drakonWidgetPath:', drakonWidgetPath);
const drakonWidget = require('../../drakonwidget/libs/drakonwidget.js'); //const createHtml = require('../../../drakonwidget/libs/simplewidgets.js');
//const drakongen = require('../drakongen/src/index.js');
const createDrakonWidget = drakonWidget.createDrakonWidget;
const createEditTools = createDrakonWidget.edit_tools;
const createUtils = createDrakonWidget.utils;
// Helper function to check if a diagram has a specific item
function hasItem(widget, itemId) {
    return widget.model && widget.model.items && widget.model.items[itemId] !== undefined;
}
// Helper function to check item type
function checkItemType(widget, itemId, expectedType) {
    var _a;
    const item = (_a = widget.model) === null || _a === void 0 ? void 0 : _a.items[itemId];
    return item && item.type === expectedType;
}
// Helper function to check item content
function checkItemContent(widget, itemId, expectedContent) {
    var _a;
    const item = (_a = widget.model) === null || _a === void 0 ? void 0 : _a.items[itemId];
    return item && item.content === expectedContent;
}
describe('Drakon Diagram Loading', () => {
    const diagramsDir = path.join(__dirname, '../../../drakongen/examples');
    const diagramFiles = fs.readdirSync(diagramsDir).filter((file) => file.endsWith('.drakon'));
    diagramFiles.forEach(diagramFile => {
        const diagramFilePath = path.join(diagramsDir, diagramFile);
        const diagramName = path.basename(diagramFile, '.drakon');
        it(`Should load diagram: ${diagramName}`, () => {
            // 1. Instantiate Drakonwidget
            const widget = createDrakonWidget();
            // 2. Create a mock sender (we don't need to inspect edits for now)
            const mockSender = {
                pushEdit: (edit) => {
                    // In a real test, you might want to inspect the edit object here
                    // to ensure that the correct changes are being tracked.
                    console.log("pushEdit", edit);
                }
            };
            // 3. Load JSON data
            const diagramJson = fs.readFileSync(diagramFilePath, 'utf8');
            let diagramData;
            try {
                diagramData = JSON.parse(diagramJson);
            }
            catch (error) {
                if (error instanceof Error) {
                    assert.fail(`Failed to parse JSON in ${diagramFile}: ${error.message}`);
                }
                else {
                    assert.fail(`Failed to parse JSON in ${diagramFile}: Unknown error`);
                }
                return;
            }
            // 4. Call setDiagram
            return widget.setDiagram(diagramName, diagramData, mockSender)
                .then(() => {
                // 5. Assert success
                // Check if the diagram loaded correctly by inspecting the widget's model
                assert.ok(widget.model, 'Diagram model should be created');
                assert.ok(widget.model.items, 'Diagram model should have items');
                assert.ok(Object.keys(widget.model.items).length > 0, 'Diagram should have at least one item');
                // Add more specific assertions based on the expected structure of your diagram
                if (diagramName === 'valid_diagram') {
                    assert.ok(hasItem(widget, '1'), 'Diagram should have item 1');
                    assert.ok(checkItemType(widget, '1', 'action'), 'Item 1 should be an action');
                    assert.ok(checkItemContent(widget, '1', 'Do something'), 'Item 1 should have content "Do something"');
                    assert.ok(hasItem(widget, '2'), 'Diagram should have item 2');
                    assert.ok(checkItemType(widget, '2', 'end'), 'Item 2 should be an end');
                }
            })
                .catch((error) => {
                assert.fail(`Diagram loading failed for ${diagramFile}: ${error.message}`);
            });
        });
    });
});
//# sourceMappingURL=drakonExtensionValidation.test.js.map
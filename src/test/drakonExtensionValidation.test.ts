const assert = require('assert');
const path = require('path');
const fs = require('fs');
const drakonWidget = require('../../src/drakonwidget/libs/drakonwidget.js');

//const __filename = __filename; // Remove this line
//const __dirname = __dirname;   // Remove this line

describe('Drakon Extension Validation', () => {
    it('should validate the drakon extension', async () => {
        const drakonWidgetPath = path.resolve(__dirname, '../../src/drakonwidget/libs/drakonwidget.js');
        console.log('drakonWidgetPath:', drakonWidgetPath);
        const createHtmlPath = path.resolve(__dirname, '../../src/drakonwidget/libs/simplewidgets.js');
        console.log('createHtmlPath:', createHtmlPath);

        // Now require drakonWidget and createHtml *after* jsdom is set up
        const createHtml = require(createHtmlPath);

        assert.ok(drakonWidget.createDrakonWidget(), 'Drakon widget should be created');
    });
});

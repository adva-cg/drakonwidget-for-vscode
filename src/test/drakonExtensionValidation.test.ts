import * as assert from 'assert';
import { JSDOM } from 'jsdom'; // Import JSDOM
import * as path from 'path';
import * as fs from 'fs';
import { createDrakonWidget } from '../../drakonwidget/libs/drakonwidget.js';
// const drakonWidget = require('../../../drakonwidget/libs/drakonwidget.js'); // Remove this line
// const createHtml = require('../../../drakonwidget/libs/simplewidgets.js'); // Remove this line

describe('Drakon Extension Validation', () => {
    it('should validate the drakon extension', async () => {
        const drakonWidgetPath = require.resolve('../../../drakonwidget/libs/drakonwidget.js');
        console.log('drakonWidgetPath:', drakonWidgetPath);
        const createHtmlPath = require.resolve('../../../drakonwidget/libs/simplewidgets.js');
        console.log('createHtmlPath:', createHtmlPath);

        // Now require drakonWidget and createHtml *after* jsdom is set up
        const drakonWidget = require('../../../drakonwidget/libs/drakonwidget.js');
        const createHtml = require('../../../drakonwidget/libs/simplewidgets.js');

        assert.ok(drakonWidget.createDrakonWidget(), 'Drakon widget should be created');
    });
});

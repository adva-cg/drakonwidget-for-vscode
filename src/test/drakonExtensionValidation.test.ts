import * as assert from 'assert';
import { JSDOM } from 'jsdom';
import * as path from 'path';
import * as url from 'url'; // Import the 'url' module
//import * as fs from 'fs';
//import { createDrakonWidget } from '../../src/drakonwidget/libs/drakonwidget.js';

// const __filename = url.fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// describe('Drakon Extension Validation', () => {
//     it('should validate the drakon extension', async () => {
//         const drakonWidgetPath = path.resolve(__dirname, '../../src/drakonwidget/libs/drakonwidget.js');
//         console.log('drakonWidgetPath:', drakonWidgetPath);
//         const createHtmlPath = path.resolve(__dirname, '../../src/drakonwidget/libs/simplewidgets.js');
//         console.log('createHtmlPath:', createHtmlPath);

//         // Now require drakonWidget and createHtml *after* jsdom is set up
//         const drakonWidget = await import(drakonWidgetPath);
//         const createHtml = await import(createHtmlPath);

//         assert.ok(drakonWidget.createDrakonWidget(), 'Drakon widget should be created');
//     });
// });

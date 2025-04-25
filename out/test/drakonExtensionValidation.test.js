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
const drakonWidget = require('../../src/drakonwidget/libs/drakonwidget.js');
//const __filename = __filename; // Remove this line
//const __dirname = __dirname;   // Remove this line
describe('Drakon Extension Validation', () => {
    it('should validate the drakon extension', () => __awaiter(void 0, void 0, void 0, function* () {
        const drakonWidgetPath = path.resolve(__dirname, '../../src/drakonwidget/libs/drakonwidget.js');
        console.log('drakonWidgetPath:', drakonWidgetPath);
        const createHtmlPath = path.resolve(__dirname, '../../src/drakonwidget/libs/simplewidgets.js');
        console.log('createHtmlPath:', createHtmlPath);
        // Now require drakonWidget and createHtml *after* jsdom is set up
        const createHtml = require(createHtmlPath);
        assert.ok(drakonWidget.createDrakonWidget(), 'Drakon widget should be created');
    }));
});
//# sourceMappingURL=drakonExtensionValidation.test.js.map
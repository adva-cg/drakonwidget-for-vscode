"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
const dom = new jsdom_1.JSDOM('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document</title></head><body></body></html>', {
    url: "http://localhost/" // Optional: Set a base URL
});
global.document = dom.window.document;
global.window = dom.window; // Type assertion
global.navigator = {
    userAgent: 'node.js'
}; // Type assertion
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.Image = dom.window.Image;
global.MouseEvent = dom.window.MouseEvent;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;
global.HTMLOptionElement = dom.window.HTMLOptionElement;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = function (callback) {
    return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (handle) {
    clearTimeout(handle);
};
// Copy properties of the JSDOM window to the Node global object
function copyProps(src, target) {
    Object.defineProperties(target, Object.assign(Object.assign({}, Object.getOwnPropertyDescriptors(src)), Object.getOwnPropertyDescriptors(target)));
}
copyProps(dom.window, global);
//# sourceMappingURL=setupJSDOM.js.map
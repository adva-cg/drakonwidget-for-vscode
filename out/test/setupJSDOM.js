"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
const { JSDOM } = require('jsdom');
const { Canvas, createCanvas } = require('canvas'); // Remove ImageData from import
const dom = new JSDOM('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document</title></head><body></body></html>', {
    url: "http://localhost/", // Optional: Set a base URL
    canvas: {
        createCanvas,
        //ImageData // Remove this line
    }
});
global.document = dom.window.document;
global.window = dom.window; // Type assertion
// Use Object.defineProperty to define userAgent on the existing navigator object
if (!global.navigator) {
    global.navigator = {};
}
Object.defineProperty(global.navigator, 'userAgent', {
    value: 'node.js',
    writable: false, // Make it read-only
    configurable: true, // Allow it to be redefined later if needed
});
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.Image = dom.window.Image;
global.ImageData = dom.window.ImageData; // Add this line
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
// Add AsyncIteratorPrototype to global
global.AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(function () { return __asyncGenerator(this, arguments, function* () { }); }).prototype);
//# sourceMappingURL=setupJSDOM.js.map
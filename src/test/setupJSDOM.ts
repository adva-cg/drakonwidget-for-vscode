import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document</title></head><body></body></html>', {
    url: "http://localhost/" // Optional: Set a base URL
});

global.document = dom.window.document;
global.window = dom.window as any; // Type assertion
global.navigator = {
    userAgent: 'node.js'
} as any; // Type assertion
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.Image = dom.window.Image;
global.MouseEvent = dom.window.MouseEvent;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;
global.HTMLOptionElement = dom.window.HTMLOptionElement;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = function(callback: FrameRequestCallback): number {
    return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function(handle: number): void {
    clearTimeout(handle);
};

// Copy properties of the JSDOM window to the Node global object
function copyProps(src: object, target: object) { // Type annotations
    Object.defineProperties(target, {
        ...Object.getOwnPropertyDescriptors(src),
        ...Object.getOwnPropertyDescriptors(target),
    });
}

copyProps(dom.window, global);

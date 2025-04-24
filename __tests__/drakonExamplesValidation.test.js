const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Get the absolute path to the project root
const projectRoot = path.resolve(__dirname, '..', '..');

// Get the absolute path to drakonwidget.js
const drakonWidgetPath = path.join(projectRoot, 'drakonwidget', 'libs', 'drakonwidget.js'); // Corrected path
// Assuming you have drakonwidget.js in your project
const drakonWidgetCode = fs.readFileSync(drakonWidgetPath, 'utf-8');

// Helper function to read JSON files
function readJsonFile(filePath) {
  const rawData = fs.readFileSync(filePath);
  return JSON.parse(rawData);
}

// Helper function to check if JSON is valid
function isValidDrakonJson(drakonJson) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, { runScripts: "dangerously" });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  // Load drakonwidget.js into the JSDOM environment
  const script = window.document.createElement('script');
  script.textContent = drakonWidgetCode;
  window.document.head.appendChild(script);

  try {
    // Use drakonwidget's API to load the JSON
    window.DRAGON.load(drakonJson);
    return true; // No error thrown, so it's valid
  } catch (error) {
    console.error(error);
    return false; // Error thrown, so it's invalid
  }
}

describe('DRAKON Examples Validation', () => {
  // Get the absolute path to the examples directory
  const examplesDir = path.join(projectRoot, 'drakongen', 'examples');

  // Get all .drakon files in the examples directory
  const drakonFiles = fs.readdirSync(examplesDir).filter(file => file.endsWith('.drakon'));

  // Create a test case for each .drakon file
  drakonFiles.forEach(drakonFile => {
    it(`should validate ${drakonFile}`, () => {
      const filePath = path.join(examplesDir, drakonFile);
      const drakonJson = JSON.stringify(readJsonFile(filePath));
      const isValid = isValidDrakonJson(drakonJson);
      expect(isValid).toBe(true);
    });
  });
});

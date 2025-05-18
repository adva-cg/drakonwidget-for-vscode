declare module './structToDrakon.js' {
  export function astToDrakon(astJson: string): { fileName: string; content: string; };
  export function generateDrakonFiles(inputDir: string, outputDir: string): void;
  // Add other exported functions if any
}
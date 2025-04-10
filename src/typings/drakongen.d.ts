declare module '../drakongen/src/index.js' {
    export function toPseudocode(
      drakon: string,
      name: string,
      filename: string,
      language: 'en' | 'no' | 'ru'
    ): string;
  
    export function toTree(
      drakon: string,
      name: string,
      filename: string,
      language: 'en' | 'no' | 'ru'
    ): string;
  }
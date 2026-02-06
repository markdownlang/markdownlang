// Stubs for Node.js 'fs' and 'path' modules in the browser.
// File imports are not supported in the web REPL.

export function readFileSync(): never {
  throw new Error('File imports are not supported in the web REPL.');
}

export function resolve(...segments: string[]): string {
  return segments.join('/');
}

export function dirname(p: string): string {
  const parts = p.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

// Stubs for Node.js 'fs' and 'path' modules in the browser.
// Supports a virtual filesystem so file-import examples can work.

const virtualFS = new Map<string, string>();

export function registerFile(path: string, content: string): void {
  virtualFS.set(normalizePath(path), content);
}

export function clearFiles(): void {
  virtualFS.clear();
}

function normalizePath(p: string): string {
  // Collapse ../ and ./ segments
  const parts = p.split('/').filter(Boolean);
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.') {
      resolved.push(part);
    }
  }
  return '/' + resolved.join('/');
}

export function readFileSync(path: string): string {
  const normalized = normalizePath(path);
  const content = virtualFS.get(normalized);
  if (content !== undefined) {
    return content;
  }
  throw new Error(`File imports are not supported in the web REPL. File not found: ${path}`);
}

export function resolve(...segments: string[]): string {
  return normalizePath(segments.join('/'));
}

export function dirname(p: string): string {
  const parts = p.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

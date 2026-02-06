import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { createInterface } from 'readline';
import { parse } from '@markdownlang/core/parser';
import { interpretAsync } from '@markdownlang/core/interpreter';

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: markdownlang <file.md>');
    process.exit(1);
  }

  const filePath = args[0];
  const absolutePath = resolve(filePath);
  const baseDir = dirname(absolutePath);

  const markdown = readFileSync(absolutePath, 'utf-8');
  const program = parse(markdown);

  // Create readline interface for interactive input
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Input reader function that prompts user
  const lineBuffer: string[] = [];
  let lineResolve: ((value: string) => void) | null = null;
  let rlClosed = false;

  rl.on('line', (line) => {
    if (lineResolve) {
      const resolve = lineResolve;
      lineResolve = null;
      resolve(line);
    } else {
      lineBuffer.push(line);
    }
  });

  rl.on('close', () => {
    rlClosed = true;
    if (lineResolve) {
      const resolve = lineResolve;
      lineResolve = null;
      resolve('');
    }
  });

  const inputReader = (): Promise<string> => {
    if (lineBuffer.length > 0) {
      return Promise.resolve(lineBuffer.shift()!);
    }
    if (rlClosed) {
      return Promise.resolve('');
    }
    return new Promise((resolve) => {
      lineResolve = resolve;
    });
  };

  // Print handler for immediate output
  const printHandler = (value: unknown): void => {
    console.log(value);
  };

  interpretAsync(program, 'main', [], baseDir, inputReader, printHandler)
    .then(() => {
      rl.close();
    })
    .catch((error: Error) => {
      console.error(`Error: ${error.message}`);
      rl.close();
      process.exit(1);
    });
}

main();

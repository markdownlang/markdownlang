#!/usr/bin/env node

import { readFileSync } from 'fs';
import { parse } from './parser/index.js';
import { interpret } from './interpreter/index.js';

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: markdownlang <file.md>');
    process.exit(1);
  }

  const filePath = args[0];

  try {
    const markdown = readFileSync(filePath, 'utf-8');
    const program = parse(markdown);
    const output = interpret(program);

    for (const line of output) {
      console.log(line);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

import { markdownToMdast } from './markdown-to-mdast.ts';
import { mdastToProgram } from './mdast-to-program.ts';
import type { Program } from '../types.ts';

/**
 * Parse markdown source into Program AST
 */
export function parse(markdown: string): Program {
  const mdast = markdownToMdast(markdown);
  return mdastToProgram(mdast);
}

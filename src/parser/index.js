import { markdownToMdast } from './markdown-to-mdast.js';
import { mdastToProgram } from './mdast-to-program.js';

/**
 * Parse markdown source into Program AST
 */
export function parse(markdown) {
  const mdast = markdownToMdast(markdown);
  return mdastToProgram(mdast);
}

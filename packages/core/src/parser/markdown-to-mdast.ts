import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root } from 'mdast';

/**
 * Stage 1: Convert markdown string to mdast
 */
export function markdownToMdast(markdown: string): Root {
  const processor = unified().use(remarkParse);
  return processor.parse(markdown);
}

import { unified } from 'unified';
import remarkParse from 'remark-parse';

/**
 * Stage 1: Convert markdown string to mdast
 */
export function markdownToMdast(markdown) {
  const processor = unified().use(remarkParse);
  return processor.parse(markdown);
}

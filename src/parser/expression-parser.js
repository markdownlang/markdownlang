import jsep from 'jsep';

/**
 * Parse an expression string into an AST using jsep
 */
export function parseExpression(exprString) {
  return jsep(exprString);
}

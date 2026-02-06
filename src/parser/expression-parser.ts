import jsep, { type Expression } from 'jsep';

/**
 * Parse an expression string into an AST using jsep
 */
export function parseExpression(exprString: string): Expression {
  return jsep(exprString);
}

import type { Expression } from "jsep";
import type {
  RuntimeValue,
  RuntimeInterface,
  TemplateLiteralExpression,
} from "../types.ts";
import { expectNumber, expectStringOrNumber } from "./type-guards.ts";

type EvaluableExpression = Expression | TemplateLiteralExpression;

/**
 * Evaluate an expression AST node
 */
export function evaluate(
  node: EvaluableExpression,
  runtime: RuntimeInterface,
  line?: number,
): RuntimeValue {
  switch (node.type) {
    case "Literal":
      return (node as Expression & { value: RuntimeValue }).value;

    case "Identifier":
      return runtime.getVariable((node as Expression & { name: string }).name);

    case "BinaryExpression":
      return evaluateBinaryExpression(node as Expression, runtime, line);

    case "UnaryExpression":
      return evaluateUnaryExpression(node as Expression, runtime, line);

    case "TemplateLiteral":
      return evaluateTemplateLiteral(
        node as TemplateLiteralExpression,
        runtime,
        line,
      );

    case "MemberExpression":
      return evaluateMemberExpression(node as Expression, runtime, line);

    case "CallExpression":
      // Handle built-in functions if needed
      throw new Error(
        `Call expressions not supported: ${(node as Expression & { callee?: { name: string } }).callee?.name}`,
      );

    default:
      throw new Error(`Unknown expression type: ${node.type}`);
  }
}

interface BinaryExpressionNode extends Expression {
  left: Expression;
  right: Expression;
  operator: string;
}

function evaluateBinaryExpression(
  node: Expression,
  runtime: RuntimeInterface,
  line?: number,
): RuntimeValue {
  const binNode = node as BinaryExpressionNode;
  const left = evaluate(binNode.left, runtime, line);
  const right = evaluate(binNode.right, runtime, line);

  switch (binNode.operator) {
    // Arithmetic (+ also handles string concatenation)
    case "+":
      // Allow string concatenation: string + string OR string + number OR number + string
      if (typeof left === "string" || typeof right === "string") {
        return String(left ?? "") + String(right ?? "");
      }
      return (
        expectNumber(left, "left operand of +", line) +
        expectNumber(right, "right operand of +", line)
      );
    case "-":
      return (
        expectNumber(left, "left operand of -", line) -
        expectNumber(right, "right operand of -", line)
      );
    case "*":
      return (
        expectNumber(left, "left operand of *", line) *
        expectNumber(right, "right operand of *", line)
      );
    case "/":
      return (
        expectNumber(left, "left operand of /", line) /
        expectNumber(right, "right operand of /", line)
      );
    case "%":
      return (
        expectNumber(left, "left operand of %", line) %
        expectNumber(right, "right operand of %", line)
      );

    // Comparison
    case "==":
      return left == right;
    case "!=":
      return left != right;
    case "<":
      return (
        expectNumber(left, "left operand of <", line) <
        expectNumber(right, "right operand of <", line)
      );
    case ">":
      return (
        expectNumber(left, "left operand of >", line) >
        expectNumber(right, "right operand of >", line)
      );
    case "<=":
      return (
        expectNumber(left, "left operand of <=", line) <=
        expectNumber(right, "right operand of <=", line)
      );
    case ">=":
      return (
        expectNumber(left, "left operand of >=", line) >=
        expectNumber(right, "right operand of >=", line)
      );
    case "===":
      return left === right;
    case "!==":
      return left !== right;

    // Logical
    case "&&":
      return left && right;
    case "||":
      return left || right;

    default:
      throw new Error(`Unknown operator: ${binNode.operator}`);
  }
}

interface UnaryExpressionNode extends Expression {
  argument: Expression;
  operator: string;
}

function evaluateUnaryExpression(
  node: Expression,
  runtime: RuntimeInterface,
  line?: number,
): RuntimeValue {
  const unaryNode = node as UnaryExpressionNode;
  const argument = evaluate(unaryNode.argument, runtime, line);

  switch (unaryNode.operator) {
    case "!":
      return !argument;
    case "-":
      return -expectNumber(argument, "operand of unary -", line);
    case "+":
      return +expectNumber(argument, "operand of unary +", line);
    default:
      throw new Error(`Unknown unary operator: ${unaryNode.operator}`);
  }
}

function evaluateTemplateLiteral(
  node: TemplateLiteralExpression,
  runtime: RuntimeInterface,
  line?: number,
): string {
  let result = "";
  for (const part of node.parts) {
    if (part.type === "literal") {
      result += part.value;
    } else if (part.type === "expression") {
      result += evaluate(part.expr, runtime, line);
    }
  }
  return result;
}

interface MemberExpressionNode extends Expression {
  object: Expression;
  property: Expression & { name?: string };
  computed: boolean;
}

function evaluateMemberExpression(
  node: Expression,
  runtime: RuntimeInterface,
  line?: number,
): RuntimeValue {
  const memberNode = node as MemberExpressionNode;
  const object = evaluate(memberNode.object, runtime, line);

  if (memberNode.computed) {
    // word[i] - computed property access
    const property = evaluate(memberNode.property, runtime, line);
    const index = expectStringOrNumber(property, "member access index", line);
    if (typeof object === "string") {
      return object[index as number];
    }
    if (object && typeof object === "object") {
      return (object as Record<string | number, RuntimeValue>)[index];
    }
    return undefined;
  } else {
    // word.length - dot notation
    const propName = memberNode.property.name!;
    if (typeof object === "string") {
      if (propName === "length") return object.length;
      return undefined;
    }
    if (object && typeof object === "object") {
      return (object as Record<string, RuntimeValue>)[propName];
    }
    return undefined;
  }
}

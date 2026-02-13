import type { Expression } from "jsep";
import type { Root, RootContent, PhrasingContent } from "mdast";
import { parseExpression } from "./expression-parser.ts";
import type {
  Program,
  FunctionDeclaration,
  Statement,
  ConditionalBlock,
  TemplatePart,
  TemplateLiteralExpression,
} from "../types.ts";

// Node type that may have children or value
interface MdastNode {
  type: string;
  value?: string;
  children?: MdastNode[];
  position?: { start?: { line?: number } };
}

/**
 * Stage 2: Transform mdast to Program AST
 */
export function mdastToProgram(mdast: Root): Program {
  const program: Program = {
    type: "Program",
    functions: {},
  };

  let currentFunction: FunctionDeclaration | null = null;
  let blockStack: Statement[][] = []; // blockStack[0] = function body, blockStack[n] = deeper scopes

  for (const node of mdast.children) {
    if (node.type === "heading" && (node as { depth: number }).depth === 1) {
      // Function declaration: # name
      const funcName = extractText(node as MdastNode);
      currentFunction = {
        type: "FunctionDeclaration",
        name: funcName,
        parameters: [],
        body: [],
      };
      blockStack = [currentFunction.body];
      program.functions[funcName] = currentFunction;
    } else if (node.type === "heading" && currentFunction) {
      const depth = (node as { depth: number }).depth;
      if (depth >= 2 && depth <= 6) {
        // Conditional block: ## - ###### *condition*
        // Trim blockStack to the required parent depth (depth - 1)
        while (blockStack.length >= depth) {
          blockStack.pop();
        }
        if (blockStack.length === depth - 1) {
          const conditionText = extractEmphasisText(node as MdastNode);
          if (conditionText) {
            const currentBlock = blockStack[blockStack.length - 1];
            const conditional: ConditionalBlock = {
              type: "ConditionalBlock",
              condition: parseExpression(conditionText),
              body: [],
              line: (node as MdastNode).position?.start?.line,
            };
            currentBlock.push(conditional);
            blockStack.push(conditional.body);
          }
        }
      }
    } else if (
      node.type === "list" &&
      node.ordered &&
      currentFunction &&
      blockStack.length === 1
    ) {
      // Ordered list items are parameter declarations (only at function body level)
      // 1. paramName
      for (const item of node.children) {
        const itemText = extractText(item as MdastNode);
        currentFunction.parameters.push(itemText);
      }
    } else if (
      node.type === "list" &&
      !node.ordered &&
      currentFunction &&
      blockStack.length > 0
    ) {
      // Unordered list items are variable declarations
      // - varname = expr  -> declare with value
      // - varname         -> declare as undefined
      const currentBlock = blockStack[blockStack.length - 1];
      for (const item of node.children) {
        const itemText = extractText(item as MdastNode);
        const line = (item as MdastNode).position?.start?.line;

        const declMatch = itemText.match(/^(\w+)\s*=\s*(.+)$/);
        if (declMatch) {
          const [, varName, valueStr] = declMatch;
          currentBlock.push({
            type: "VariableDeclaration",
            variable: varName,
            value: parseExpression(valueStr),
            line,
          });
        } else {
          // Bare item: declare variable as undefined
          currentBlock.push({
            type: "VariableDeclaration",
            variable: itemText,
            value: { type: "Literal", value: undefined } as Expression,
            line,
          });
        }
      }
    } else if (node.type === "paragraph" && blockStack.length > 0) {
      const statement = parseParagraph(node as MdastNode);
      if (statement) {
        statement.line = (node as MdastNode).position?.start?.line;
        blockStack[blockStack.length - 1].push(statement);
      }
    } else if (node.type === "thematicBreak" && currentFunction) {
      // Break statement: --- adds break to current block and pops one scope level
      if (blockStack.length > 0) {
        blockStack[blockStack.length - 1].push({
          type: "BreakStatement",
          line: (node as MdastNode).position?.start?.line,
        });
      }
      if (blockStack.length > 1) {
        blockStack.pop();
      }
    } else if (node.type === "blockquote" && blockStack.length > 0) {
      // Input statement: > variableName
      const varName = extractText(node as MdastNode).trim();
      if (varName) {
        blockStack[blockStack.length - 1].push({
          type: "InputStatement",
          variable: varName,
          line: (node as MdastNode).position?.start?.line,
        });
      }
    }
    // Note: 'code' blocks are ignored (treated as comments)
  }

  return program;
}

/**
 * Extract plain text from an mdast node
 */
function extractText(node: MdastNode): string {
  let text = "";
  if (node.type === "inlineCode") {
    return ""; // Skip inline code - treat as comment
  }
  if (node.value) {
    text += node.value;
  }
  if (node.children) {
    for (const child of node.children) {
      text += extractText(child);
    }
  }
  return text.trim();
}

/**
 * Extract text from emphasis (*text*) within a node
 */
function extractEmphasisText(node: MdastNode): string | null {
  for (const child of node.children || []) {
    if (child.type === "emphasis") {
      return extractText(child);
    }
  }
  return null;
}

/**
 * Parse a template literal string into parts (literals and expressions)
 * e.g. "Hello, {name}!" -> [{ type: 'literal', value: 'Hello, ' }, { type: 'expression', expr: ... }, { type: 'literal', value: '!' }]
 */
function parseTemplateLiteral(text: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let current = "";
  let i = 0;

  while (i < text.length) {
    if (text[i] === "{") {
      // Save any accumulated literal text
      if (current) {
        parts.push({ type: "literal", value: current });
        current = "";
      }
      // Find matching closing brace
      let braceCount = 1;
      let j = i + 1;
      while (j < text.length && braceCount > 0) {
        if (text[j] === "{") braceCount++;
        if (text[j] === "}") braceCount--;
        j++;
      }
      const exprText = text.slice(i + 1, j - 1);
      parts.push({ type: "expression", expr: parseExpression(exprText) });
      i = j;
    } else {
      current += text[i];
      i++;
    }
  }

  // Save any remaining literal text
  if (current) {
    parts.push({ type: "literal", value: current });
  }

  return parts;
}

/**
 * Parse a paragraph into a statement
 */
function parseParagraph(node: MdastNode): Statement | null {
  const children = node.children || [];

  // Check for print statement: **{expr}**, **text**, or **template {expr} string**
  if (children.length === 1 && children[0].type === "strong") {
    const strongText = extractText(children[0]);
    // Check if expression is wrapped in {expr}
    const match = strongText.match(/^\{([^}]+)\}$/);
    if (match) {
      return {
        type: "PrintStatement",
        expression: parseExpression(match[1]),
      };
    }
    // Check for template string with embedded expressions
    if (strongText.includes("{") && strongText.includes("}")) {
      const parts = parseTemplateLiteral(strongText);
      const templateExpr: TemplateLiteralExpression = {
        type: "TemplateLiteral",
        parts,
      };
      return {
        type: "PrintStatement",
        expression: templateExpr,
      };
    }
    // Otherwise treat as literal string
    return {
      type: "PrintStatement",
      expression: { type: "Literal", value: strongText } as Expression,
    };
  }

  // Check for function call: [args](#func) or [args](file.md#func)
  if (children.length === 1 && children[0].type === "link") {
    const link = children[0] as MdastNode & { url: string };
    const argsText = extractText(link);
    const args = argsText
      ? argsText.split(",").map((a) => parseExpression(a.trim()))
      : [];

    let functionName: string;
    let externalFile: string | null = null;

    if (link.url.startsWith("#")) {
      // Internal call: #function-name
      functionName = link.url.slice(1);
    } else if (link.url.includes("#")) {
      // External call: filename.md#function-name
      const hashIndex = link.url.indexOf("#");
      externalFile = link.url.slice(0, hashIndex);
      functionName = link.url.slice(hashIndex + 1);
    } else {
      // No hash - treat as internal call (backwards compatibility)
      functionName = link.url;
    }

    return {
      type: "FunctionCallStatement",
      functionName: functionName,
      externalFile: externalFile,
      arguments: args,
    };
  }

  // Otherwise, it's an assignment: varname += expr or varname = expr
  const text = extractText(node);

  // Match compound assignment: varname += expr
  const compoundMatch = text.match(/^(\w+)\s*(\+|\-|\*|\/)?=\s*(.+)$/);
  if (compoundMatch) {
    const [, varName, operator, valueStr] = compoundMatch;
    return {
      type: "AssignmentStatement",
      variable: varName,
      operator: (operator as "+" | "-" | "*" | "/") || null,
      value: parseExpression(valueStr),
    };
  }

  return null;
}

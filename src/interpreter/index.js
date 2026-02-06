import { Runtime } from './runtime.js';
import { evaluate } from './evaluator.js';

/**
 * Interpret a Program AST
 */
export function interpret(program, entryPoint = 'main', args = []) {
  const runtime = new Runtime();

  // Find the entry function
  const mainFunc = program.functions[entryPoint];
  if (!mainFunc) {
    throw new Error(`Entry function '${entryPoint}' not found`);
  }

  // Execute the entry function
  executeFunction(program, mainFunc, args, runtime);

  return runtime.getOutput();
}

function executeFunction(program, func, args, runtime) {
  // Create argument bindings
  const argBindings = {};
  for (let i = 0; i < func.parameters.length; i++) {
    argBindings[func.parameters[i]] = args[i];
  }

  // Push call frame
  runtime.pushFrame(func.name, argBindings);

  // Execute function body
  executeBlock(program, func.body, runtime);

  // Pop call frame
  runtime.popFrame();
}

function executeBlock(program, statements, runtime) {
  for (const statement of statements) {
    if (runtime.breakFlag) {
      break;
    }
    executeStatement(program, statement, runtime);
  }
}

function executeStatement(program, statement, runtime) {
  switch (statement.type) {
    case 'PrintStatement':
      executePrint(statement, runtime);
      break;

    case 'AssignmentStatement':
      executeAssignment(statement, runtime);
      break;

    case 'FunctionCallStatement':
      executeFunctionCall(program, statement, runtime);
      break;

    case 'ConditionalBlock':
      executeConditional(program, statement, runtime);
      break;

    case 'BreakStatement':
      runtime.setBreak();
      break;

    default:
      throw new Error(`Unknown statement type: ${statement.type}`);
  }
}

function executePrint(statement, runtime) {
  const value = evaluate(statement.expression, runtime);
  runtime.print(value);
}

function executeAssignment(statement, runtime) {
  const newValue = evaluate(statement.value, runtime);

  if (statement.operator) {
    // Compound assignment
    const currentValue = runtime.getVariable(statement.variable) ?? getDefaultValue(newValue);
    let result;

    switch (statement.operator) {
      case '+':
        result = currentValue + newValue;
        break;
      case '-':
        result = currentValue - newValue;
        break;
      case '*':
        result = currentValue * newValue;
        break;
      case '/':
        result = currentValue / newValue;
        break;
      default:
        throw new Error(`Unknown compound operator: ${statement.operator}`);
    }

    runtime.setVariable(statement.variable, result);
  } else {
    // Simple assignment
    runtime.setVariable(statement.variable, newValue);
  }
}

function getDefaultValue(value) {
  if (typeof value === 'string') return '';
  if (typeof value === 'number') return 0;
  return undefined;
}

function executeFunctionCall(program, statement, runtime) {
  const func = program.functions[statement.functionName];
  if (!func) {
    throw new Error(`Function '${statement.functionName}' not found`);
  }

  // Evaluate arguments
  const args = statement.arguments.map(arg => evaluate(arg, runtime));

  // Execute function
  executeFunction(program, func, args, runtime);
}

function executeConditional(program, statement, runtime) {
  const condition = evaluate(statement.condition, runtime);

  if (condition) {
    executeBlock(program, statement.body, runtime);
  }
}

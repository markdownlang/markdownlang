/**
 * Runtime manages the call stack, variable scopes, and output
 */
export class Runtime {
  constructor() {
    this.callStack = [];
    this.output = [];
    this.breakFlag = false;
  }

  /**
   * Push a new call frame onto the stack
   */
  pushFrame(functionName, args = {}) {
    this.callStack.push({
      functionName,
      variables: { ...args }
    });
  }

  /**
   * Pop the current call frame
   */
  popFrame() {
    return this.callStack.pop();
  }

  /**
   * Get the current call frame
   */
  currentFrame() {
    return this.callStack[this.callStack.length - 1];
  }

  /**
   * Get a variable value from current scope
   */
  getVariable(name) {
    const frame = this.currentFrame();
    if (frame && name in frame.variables) {
      return frame.variables[name];
    }
    return undefined;
  }

  /**
   * Set a variable in current scope
   */
  setVariable(name, value) {
    const frame = this.currentFrame();
    if (frame) {
      frame.variables[name] = value;
    }
  }

  /**
   * Add output
   */
  print(value) {
    this.output.push(value);
  }

  /**
   * Get all output
   */
  getOutput() {
    return this.output;
  }

  /**
   * Set the break flag
   */
  setBreak() {
    this.breakFlag = true;
  }

  /**
   * Check and clear break flag
   */
  shouldBreak() {
    if (this.breakFlag) {
      this.breakFlag = false;
      return true;
    }
    return false;
  }

  /**
   * Clear break flag (when exiting a conditional block)
   */
  clearBreak() {
    this.breakFlag = false;
  }
}

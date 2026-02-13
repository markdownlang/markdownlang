import { test, describe } from "node:test";
import assert from "node:assert";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { parse } from "../src/parser/index.ts";
import { interpret } from "../src/interpreter/index.ts";
import type { RuntimeValue } from "../src/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = resolve(__dirname, "../../examples/src");

function runWithValue(x: number): RuntimeValue[] {
  const md = readFileSync(
    resolve(examplesDir, "nested-conditionals.md"),
    "utf-8",
  );
  const program = parse(md);
  return interpret(program, "main", [], examplesDir);
}

describe("nested-conditionals.md", () => {
  test("big positive (n > 100)", () => {
    const md = `
# main

[200](#classify)

# classify

1. n

## *n > 0*

### *n > 100*

**big positive**

---

### *n > 5*

**medium positive**

---

**small positive**

---

## *n == 0*

**zero**

---

**negative**
`;
    const program = parse(md);
    const output = interpret(program, "main", [], examplesDir);
    assert.deepStrictEqual(output, ["big positive"]);
  });

  test("medium-high positive (n > 8, within n > 5)", () => {
    const md = `
# main

[10](#classify)

# classify

1. n

## *n > 0*

### *n > 100*

**big positive**

---

### *n > 5*

#### *n > 8*

**medium-high positive**

---

**medium-low positive**

---

**small positive**

---

## *n == 0*

**zero**

---

**negative**
`;
    const program = parse(md);
    const output = interpret(program, "main", [], examplesDir);
    assert.deepStrictEqual(output, ["medium-high positive"]);
  });

  test("medium-low positive (n <= 8 but n > 5)", () => {
    const md = `
# main

[7](#classify)

# classify

1. n

## *n > 0*

### *n > 100*

**big positive**

---

### *n > 5*

#### *n > 8*

**medium-high positive**

---

**medium-low positive**

---

**small positive**

---

## *n == 0*

**zero**

---

**negative**
`;
    const program = parse(md);
    const output = interpret(program, "main", [], examplesDir);
    assert.deepStrictEqual(output, ["medium-low positive"]);
  });

  test("small positive (n <= 5 but n > 0)", () => {
    const md = `
# main

[3](#classify)

# classify

1. n

## *n > 0*

### *n > 100*

**big positive**

---

### *n > 5*

**medium positive**

---

**small positive**

---

## *n == 0*

**zero**

---

**negative**
`;
    const program = parse(md);
    const output = interpret(program, "main", [], examplesDir);
    assert.deepStrictEqual(output, ["small positive"]);
  });

  test("zero", () => {
    const md = `
# main

[0](#classify)

# classify

1. n

## *n > 0*

**positive**

---

## *n == 0*

**zero**

---

**negative**
`;
    const program = parse(md);
    const output = interpret(program, "main", [], examplesDir);
    assert.deepStrictEqual(output, ["zero"]);
  });

  test("negative", () => {
    const md = `
# main

[-5](#classify)

# classify

1. n

## *n > 0*

**positive**

---

## *n == 0*

**zero**

---

**negative**
`;
    const program = parse(md);
    const output = interpret(program, "main", [], examplesDir);
    assert.deepStrictEqual(output, ["negative"]);
  });

  test("deeply nested h1-h4 with example file", () => {
    const output = runWithValue(10);
    assert.deepStrictEqual(output, ["medium-high positive"]);
  });
});

import { parse } from '../../src/parser/index.ts';
import { interpretAsync } from '../../src/interpreter/index.ts';
import type { RuntimeValue } from '../../src/types.ts';

const DEFAULT_PROGRAM = `# main

[1, 100](#fizzbuzz)

# fizzbuzz

- start
- end

[start, end](#loop)

# loop

- i
- end
- text = ""

## _i > end_

---

## _i % 15 == 0_

**fizzbuzz**

[i + 1, end](#loop)

---

## _i % 3 == 0_

text = "fizz"

## _i % 5 == 0_

text += "buzz"

## _text_

**{text}**

[i + 1, end](#loop)

---

**{i}**

[i + 1, end](#loop)
`;

const editor = document.getElementById('editor') as HTMLTextAreaElement;
const output = document.getElementById('output') as HTMLPreElement;
const runBtn = document.getElementById('run') as HTMLButtonElement;

editor.value = DEFAULT_PROGRAM;

async function run() {
  output.textContent = '';
  output.classList.remove('error');

  const source = editor.value;

  try {
    const program = parse(source);

    const inputReader = async (): Promise<string> => {
      const result = window.prompt('Program requests input:');
      return result ?? '';
    };

    const printHandler = (value: RuntimeValue): void => {
      output.textContent += String(value) + '\n';
    };

    await interpretAsync(program, 'main', [], '', inputReader, printHandler);
  } catch (err: unknown) {
    output.classList.add('error');
    output.textContent = err instanceof Error ? err.message : String(err);
  }
}

runBtn.addEventListener('click', run);

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    run();
  }
});

editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
  }
});

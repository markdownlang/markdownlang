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
const output = document.getElementById('output') as HTMLDivElement;
const runBtn = document.getElementById('run') as HTMLButtonElement;

editor.value = DEFAULT_PROGRAM;

function appendText(text: string) {
  output.appendChild(document.createTextNode(text));
  output.scrollTop = output.scrollHeight;
}

function inlineInput(): Promise<string> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-input';
    output.appendChild(input);
    input.focus();
    output.scrollTop = output.scrollHeight;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value;
        input.disabled = true;
        input.classList.add('submitted');
        appendText('\n');
        resolve(value);
      }
    });
  });
}

async function run() {
  output.textContent = '';
  output.classList.remove('error');

  const source = editor.value;

  try {
    const program = parse(source);

    const printHandler = (value: RuntimeValue): void => {
      appendText(String(value) + '\n');
    };

    await interpretAsync(program, 'main', [], '', inlineInput, printHandler);
  } catch (err: unknown) {
    output.classList.add('error');
    appendText(err instanceof Error ? err.message : String(err));
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

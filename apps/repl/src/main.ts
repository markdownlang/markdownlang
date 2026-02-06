import { parse } from '@markdownlang/core/parser';
import { interpretAsync, clearExternalProgramCache } from '@markdownlang/core/interpreter';
import type { RuntimeValue } from '@markdownlang/core/types';
import { registerFile, clearFiles } from './node-stubs.ts';

import fizzbuzz from '@markdownlang/examples/fizzbuzz.md?raw';
import helloWorld from '@markdownlang/examples/hello-world.md?raw';
import palindrome from '@markdownlang/examples/palindrome.md?raw';
import kitchenSink from '@markdownlang/examples/kitchen-sink.md?raw';
import fileImport from '@markdownlang/examples/file-import/import-test.md?raw';
import fileImportLib from '@markdownlang/examples/file-import/lib.md?raw';
import typeError from '@markdownlang/examples/errors/type-error.md?raw';
import undeclaredError from '@markdownlang/examples/errors/undeclared-error.md?raw';

interface Project {
  entry: string;
  files: { name: string; path: string; content: string }[];
}

const EXAMPLES: Record<string, Project> = {
  'hello-world': {
    entry: '/hello-world.md',
    files: [{ name: 'hello-world.md', path: '/hello-world.md', content: helloWorld }],
  },
  'kitchen-sink': {
    entry: '/kitchen-sink.md',
    files: [{ name: 'kitchen-sink.md', path: '/kitchen-sink.md', content: kitchenSink }],
  },
  'fizzbuzz': {
    entry: '/fizzbuzz.md',
    files: [{ name: 'fizzbuzz.md', path: '/fizzbuzz.md', content: fizzbuzz }],
  },
  'palindrome': {
    entry: '/palindrome.md',
    files: [{ name: 'palindrome.md', path: '/palindrome.md', content: palindrome }],
  },
  'file-import': {
    entry: '/import-test.md',
    files: [
      { name: 'import-test.md', path: '/import-test.md', content: fileImport },
      { name: 'lib.md', path: '/lib.md', content: fileImportLib },
    ],
  },
  'type-error': {
    entry: '/type-error.md',
    files: [{ name: 'type-error.md', path: '/type-error.md', content: typeError }],
  },
  'undeclared-error': {
    entry: '/undeclared-error.md',
    files: [{ name: 'undeclared-error.md', path: '/undeclared-error.md', content: undeclaredError }],
  },
};

const editor = document.getElementById('editor') as HTMLTextAreaElement;
const output = document.getElementById('output') as HTMLDivElement;
const runBtn = document.getElementById('run') as HTMLButtonElement;
const examplesSelect = document.getElementById('examples') as HTMLSelectElement;
const tabBar = document.getElementById('tab-bar') as HTMLDivElement;

let currentFiles: { name: string; path: string; content: string }[] = [];
let activeFileIndex = 0;

function loadProject(key: string): void {
  const project = EXAMPLES[key];
  if (!project) return;
  currentFiles = project.files.map(f => ({ ...f }));
  activeFileIndex = 0;
  editor.value = currentFiles[0].content;
  renderTabs();
}

function renderTabs(): void {
  tabBar.innerHTML = '';
  currentFiles.forEach((file, i) => {
    const tab = document.createElement('button');
    tab.className = 'tab' + (i === activeFileIndex ? ' active' : '');
    tab.textContent = file.name;
    tab.addEventListener('click', () => switchTab(i));
    tabBar.appendChild(tab);
  });
}

function switchTab(index: number): void {
  if (index === activeFileIndex) return;
  currentFiles[activeFileIndex].content = editor.value;
  activeFileIndex = index;
  editor.value = currentFiles[index].content;
  renderTabs();
}

loadProject('hello-world');

examplesSelect.addEventListener('change', () => {
  loadProject(examplesSelect.value);
  output.textContent = '';
  output.classList.remove('error');
});

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

  // Save current editor content
  currentFiles[activeFileIndex].content = editor.value;

  // Reset VFS and re-register all project files
  clearFiles();
  for (const f of currentFiles) {
    registerFile(f.path, f.content);
  }
  clearExternalProgramCache();

  // Find entry file content
  const currentKey = examplesSelect.value;
  const project = EXAMPLES[currentKey];
  const entryPath = project ? project.entry : currentFiles[0].path;
  const entryFile = currentFiles.find(f => f.path === entryPath);
  const source = entryFile ? entryFile.content : currentFiles[0].content;

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

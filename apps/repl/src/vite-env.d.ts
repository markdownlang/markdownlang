/// <reference types="vite/client" />

declare module '@markdownlang/examples/*.md?raw' {
  const content: string;
  export default content;
}

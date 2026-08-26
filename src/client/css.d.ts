/** Text import of the override stylesheet (esbuild `--loader:.css=text`). */
declare module '*.css' {
  const css: string
  export default css
}

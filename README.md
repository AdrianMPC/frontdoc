# frontdocs

Zero-config component explorer for React: Swagger for your React components.

Point it at a folder and get a browsable catalog of every component, with its props, live controls, a preview and a copyable JSX snippet. No stories, no config files.

![Explorer](docs/screenshot-explorer.png)

## Install

You don't have to install anything. From the root of your React project:

```sh
npx frontdocs dev src
```

To keep it in the project instead, add it as a dev dependency:

```sh
npm install --save-dev frontdocs
```

and a script to `package.json`:

```json
{
  "scripts": {
    "docs": "frontdocs dev src"
  }
}
```

Then run `npm run docs`.

### Requirements

- Node.js >= 22.12
- A project with `react` and `react-dom` >= 18 installed (`npm install` done). frontdocs renders your components with your project's own React.
- TypeScript is **not** required in your project: frontdocs brings its own, so projects on TypeScript 5, 6, 7 or plain `.tsx` files all work.

## Usage

```sh
frontdocs dev [dir] [--port <port>]
```

| Argument | Default | What it does |
| --- | --- | --- |
| `dir` | `.` | Folder to scan for components, e.g. `src` or `src/components` |
| `--port` | `3333` | Port for the local server |

frontdocs prints a URL (`http://localhost:3333/`); open it in your browser. Leave it running while you work: when you edit a component, the explorer updates by itself.

### What you see

- **Sidebar.** Every component, grouped by folder, with a search box. The dot next to each name shows how well its props are documented: green (all), amber (some), red (none).
- **Preview.** The component rendered with your app's styles.
- **JSX snippet.** The code for what the preview shows, with a copy button.
- **Controls.** One input per prop: a select for unions like `'sm' | 'md' | 'lg'`, a checkbox for booleans, number and text inputs, and a text field for `children`. Change them and the preview and snippet update.
- **Prop table.** Name, type, required, default and description. Props without a description are highlighted.
- **Examples.** One preview per combination of union props (e.g. every `variant` × `size`), up to 16.

![Examples](docs/screenshot-examples.png)

### Document your components

frontdocs reads your TypeScript types and JSDoc comments. Comments above the component and above each prop become its descriptions:

```tsx
export interface ButtonProps {
  /** Text inside the button */
  label: string
  /** Visual style */
  variant?: 'primary' | 'secondary'
}

/** The main call-to-action button. */
export function Button({ label, variant = 'primary' }: ButtonProps) {
  return <button data-variant={variant}>{label}</button>
}
```

Defaults from destructuring (`variant = 'primary'`) show up in the table and as the initial control value.

## What frontdocs picks up automatically

- **Components:** exported components with PascalCase names, plus default exports, in `.tsx` files. Lowercase exports (utilities, hooks), `node_modules`, re-exports from index files and Next.js route files (`page`, `layout`, `loading`, `error`, `not-found`, `template`, `default`) are skipped.
- **Path aliases** from your `tsconfig.json` (e.g. `@/components/...`), for both prop types and previews.
- **Global CSS** imported by your app entry (`app/layout.tsx`, `pages/_app.tsx`, `main.tsx`, `index.tsx` or `App.tsx`), processed with your PostCSS config, so Tailwind works.
- **Public env variables** (`NEXT_PUBLIC_*`, `VITE_*`, `REACT_APP_*`) from your `.env` files, available as `process.env.*` in previews.

## When a preview shows an error

Errors stay inside the preview, with a hint when frontdocs knows the cause:

- **"needs a parent or provider"**: the component only works inside another one (a `Tab` inside `Tabs`) or needs app context (router, query client, auth). Preview its parent instead.
- **"Required props without a value"**: a required prop is an object or data structure that frontdocs can't generate.
- **"Could not load …"**: the file doesn't compile; the message is the compiler error. Fix the file and the preview reloads.

Example files that let you render these cases are planned for v0.2.

## Limitations (v0.1)

- Components that need context providers (theme, router, store) or a parent component don't render on their own.
- Function, object and array props aren't editable. Callbacks log to the browser console.
- Display names for default exports come from the file name.

## Library use

The package also exports the parser it uses, so you can extract the same data in your own scripts:

```ts
import parser, { parserFor } from 'frontdocs'

// Default compiler options
const docs = parser.parse(['src/components/Button.tsx'])

// Options from the nearest tsconfig.json (path aliases, etc.)
const file = 'src/components/Button.tsx'
const docsWithAliases = parserFor(file).parse([file])
```

It is [react-docgen-typescript](https://github.com/styleguidist/react-docgen-typescript)'s parser with the same options the explorer uses.

## Development

```sh
npm install
npm run build
npm test                  # unit and integration tests (node:test)
node scripts/smoke.mjs    # packs frontdocs and runs it in temp React apps (no TS, TS 5, TS 7)
```

CI runs type-checks, build, tests and `publint` on Linux and Windows (Node 22.12 and 24), then the smoke test.

Releases are published from CI with npm trusted publishing:

```sh
npm version patch   # or minor / major: bumps the version and creates the vX.Y.Z tag
git push --follow-tags
```

## License

MIT

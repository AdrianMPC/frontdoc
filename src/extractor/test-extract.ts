import { extractComponents } from './extractComponents'

const results = extractComponents('./__fixtures__/Button.tsx')
console.log(JSON.stringify(results, null, 2))

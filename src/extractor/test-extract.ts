import { fileURLToPath } from 'url'
import { extractComponents } from './extractComponents'

const results = extractComponents(fileURLToPath(new URL('./__fixtures__/Button.tsx', import.meta.url)))
console.log(JSON.stringify(results, null, 2))

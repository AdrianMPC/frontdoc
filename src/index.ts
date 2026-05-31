import docgen from "react-docgen-typescript";
import path from 'path'
import { fileURLToPath } from "url";
// ESM mode
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const tsConfigParser = docgen.withCustomConfig(path.resolve(__dirname, '../tsconfig.json'), {
  savePropValueAsString: true,
  shouldRemoveUndefinedFromOptional: true,
  propFilter: (prop) => {
	  if (prop.declarations && prop.declarations.length > 0) {
		  return prop.declarations.some(
			  (declarations) => ! declarations.fileName.includes("node_modules")
		  );
	}
	return true;
  }
});

export default tsConfigParser;

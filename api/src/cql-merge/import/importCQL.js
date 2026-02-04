import { CQLImporter } from './CQLImporter.js';

function importCQL(libraryRawCQL, dependencyRawCQLs) {
  const importer = new CQLImporter();

  return importer.import(libraryRawCQL, dependencyRawCQLs);
}

export default importCQL;

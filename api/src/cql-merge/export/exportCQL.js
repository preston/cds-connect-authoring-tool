import { CQLExporter } from './CQLExporter.js';

function exportCQL(libraryGroup) {
  const exporter = new CQLExporter();
  return exporter.export(libraryGroup);
}

export default exportCQL;

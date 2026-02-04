import path from 'path';
import fs from 'fs';

import importCQL from '../../src/cql-merge/import/importCQL.js';
import exportCQL from '../../src/cql-merge/export/exportCQL.js';
import RawCQL from '../../src/cql-merge/utils/RawCQL.js';
import { importChaiExpect } from '../utils.js';

import { fileURLToPath } from 'url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

const dependencyRawCQLs = [
  new RawCQL(fs.readFileSync(path.join(currentDirPath, 'fixtures', 'CDS_Connect_Commons_for_FHIRv400.cql'), 'utf-8')),
  new RawCQL(fs.readFileSync(path.join(currentDirPath, 'fixtures', 'CDS_Connect_Conversions.cql'), 'utf-8'))
];

describe('cql-merge', () => {
  let expect;
  before(async () => {
    expect = await importChaiExpect();
  });

  const assertCQLOutput = inputName => {
    const inputText = fs.readFileSync(path.join(currentDirPath, 'fixtures', 'in', inputName), 'utf-8');
    const outputText = fs.readFileSync(path.join(currentDirPath, 'fixtures', 'out', inputName), 'utf-8');
    const mergedCQL = exportCQL(importCQL(new RawCQL(inputText), dependencyRawCQLs));
    expect(mergedCQL.split(/\r?\n/g)).to.deep.equal(outputText.split(/\r?\n/g));
  };

  it('should output for a CQL file', () => {
    assertCQLOutput('Standard.cql');
  });

  it('should output for a CQL file without parameters', () => {
    assertCQLOutput('WithoutParameter.cql');
  });

  it('should output for a CQL file with multiple instances of a library function', () => {
    assertCQLOutput('WithDuplicateFunctions.cql');
  });

  it('should output for a CQL file with existing codesystems, codes, and concepts', () => {
    assertCQLOutput('WithCodesystemsCodesAndConcepts.cql');
  });

  it('should output for a CQL file with a function in a function one level deep', () => {
    assertCQLOutput('WithFunctionInFunction.cql');
  });
});

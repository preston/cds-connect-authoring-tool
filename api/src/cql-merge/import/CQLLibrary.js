import { getRawFromContext } from '../utils/getRawFromContext.js';

class CQLLibrary {
  constructor(context, raw) {
    this.context = context;
    this.raw = raw;
    this.includeNames = new Map();
    this.rawExpressions = new Map();
    this.rawFunctions = new Map();
    this.rawCodesystems = new Map();
    this.rawCodes = new Map();
    this.rawConcepts = new Map();

    this.libraryName = context.libraryDefinition()?.qualifiedIdentifier()?.identifier()?.start.text.replace(/"/g, '');

    context.definition()
      .map(d => d.includeDefinition())
      .filter(i => i) // Filter out null/undefined results
      .forEach(i => {
        const localIdentifier = i.localIdentifier()?.start.text.replace(/"/g, '');
        // const localIdentifier = i.localIdentifier() || i.localIdentifier()?.start.text.replace(/"/g, '');
        const identifier = i.qualifiedIdentifier()?.identifier()?.start.text.replace(/"/g, '');
        this.includeNames.set(identifier, localIdentifier);
      });

    this.statements = context.statement();
    this.statements
      .map(s => s.expressionDefinition())
      .filter(s => s)
      .forEach(s => this.rawExpressions.set(s.identifier().start.text, getRawFromContext(s)));

    this.statements
      .map(s => s.functionDefinition())
      .filter(s => s)
      .forEach(s => {
        // In grammar-1.5, function name is in children[2] which is IdentifierOrFunctionIdentifierContext
        const funcName = s.children[2]?.identifier()?.start?.text?.replace(/"/g, '');
        if (funcName) {
          this.rawFunctions.set(funcName, getRawFromContext(s));
        }
      });

    context.definition()
      .map(d => d.codesystemDefinition())
      .filter(c => c)
      .forEach(c => this.rawCodesystems.set(c.identifier().start.text, getRawFromContext(c)));

    context.definition()
      .map(d => d.codeDefinition())
      .filter(c => c)
      .forEach(c => this.rawCodes.set(c.identifier().start.text, getRawFromContext(c)));

    context.definition()
      .map(d => d.conceptDefinition())
      .filter(c => c)
      .forEach(c => this.rawConcepts.set(c.identifier().start.text, getRawFromContext(c)));
  }
}

export { CQLLibrary };

import { InputStream, CommonTokenStream } from 'antlr4';
import cqlVisitor from './grammar-1.5/cqlVisitor.js';
import cqlLexer from './grammar-1.5/cqlLexer.js';
import cqlParser from './grammar-1.5/cqlParser.js';
import { CQLLibrary } from './CQLLibrary.js';
import { CQLLibraryGroup } from './CQLLibraryGroup.js';
class CQLImporter extends cqlVisitor {
  constructor() {
    super();
  }

  import(libraryRawCQL, dependencyRawCQLs) {
    const library = new CQLLibrary(this.parseLibrary(libraryRawCQL.content), libraryRawCQL);
    const dependencies = dependencyRawCQLs.map(rawCQL => {
      return new CQLLibrary(this.parseLibrary(rawCQL.content), rawCQL);
    });
    return new CQLLibraryGroup(library, dependencies);
  }

  // NOTE: Since the ANTLR parser/lexer is JS (not typescript), we need to use some ts-ignore here.
  parseLibrary(input) {
    const chars = new InputStream(input);
    const lexer = new cqlLexer(chars);
    // @ts-ignore
    lexer.removeErrorListeners();
    // @ts-ignore
    const tokens = new CommonTokenStream(lexer);
    const parser = new cqlParser(tokens);
    // @ts-ignore
    parser.removeErrorListeners();
    // @ts-ignore
    parser.buildParseTrees = true;
    // @ts-ignore
    return parser.library();
  }
}

export { CQLImporter };

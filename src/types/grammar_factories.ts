import {
  GrammarType,
  Grammar,
} from "./grammar_types.ts";

export interface IGrammarFactory {
  createGrammar(nonTerminalSymbols: string[], terminalSymbols: string[], initialNonTerminalSymbol: string): Grammar;
}

export class AbstractGrammarFactory implements IGrammarFactory {
  internalFactory: IGrammarFactory;

  constructor(grammarType: GrammarType) {
    if (grammarType === GrammarType.REGULAR) {
      this.internalFactory = new RegularGrammarFactory();
    } else if (grammarType === GrammarType.CONTEXT_FREE) {
      this.internalFactory = new ContextFreeGrammarFactory();
    } else {
      const supportedTypes = Object.values(GrammarType);
      throw new Error(
        `Unsupported automaton type: ${grammarType}. Supported types are ${JSON.stringify(supportedTypes)}.`
      );
    }
  }

  createGrammar(nonTerminalSymbols: string[], terminalSymbols: string[], initialNonTerminalSymbol: string): Grammar {
    return this.internalFactory.createGrammar(nonTerminalSymbols, terminalSymbols, initialNonTerminalSymbol);
  }
}

export class RegularGrammarFactory implements IGrammarFactory {
  createGrammar(nonTerminalSymbols: string[], terminalSymbols: string[], initialNonTerminalSymbol: string): Grammar {
    return new Grammar(GrammarType.REGULAR, nonTerminalSymbols, terminalSymbols, initialNonTerminalSymbol);
  }
}
export class ContextFreeGrammarFactory implements IGrammarFactory {
  createGrammar(nonTerminalSymbols: string[], terminalSymbols: string[], initialNonTerminalSymbol: string): Grammar {
    return new Grammar(GrammarType.CONTEXT_FREE, nonTerminalSymbols, terminalSymbols, initialNonTerminalSymbol);
  }
}

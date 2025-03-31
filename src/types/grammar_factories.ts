import {
  GrammarType,
  Grammar,
  ProductionRule,
} from "./grammar_types.ts";
import { ErrorMessage } from "./common.ts";

export abstract class IGrammarFactory {
  public abstract createGrammar(nonTerminalSymbols: string[], terminalSymbols: string[], initialNonTerminalSymbol: string): Grammar;
  public abstract createProductionRule(inputNonTerminal: string, outputSymbols: string[], grammar: Grammar): ProductionRule;

  private production_rule_id_increment: number = 0;
  protected nextProductionRuleString(): string {
    return `production_rule_${this.production_rule_id_increment++}`;
  }
}

export class AbstractGrammarFactory extends IGrammarFactory {
  internalFactory: IGrammarFactory;

  constructor(grammarType: GrammarType) {
    super();

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

  public createGrammar(nonTerminalSymbols: string[], terminalSymbols: string[], initialNonTerminalSymbol: string): Grammar {
    return this.internalFactory.createGrammar(nonTerminalSymbols, terminalSymbols, initialNonTerminalSymbol);
  }
  public createProductionRule(inputNonTerminal: string, outputSymbols: string[], grammar: Grammar): ProductionRule {
    if (inputNonTerminal == null) {
      throw new ErrorMessage("Cannot add production rule: input non-terminal is empty.");
    } else if (outputSymbols === undefined) {
      throw new ErrorMessage("Cannot add production rule: output symbols are empty.");
    } else  if (!grammar.hasNonTerminalSymbol(inputNonTerminal)) {
      throw new ErrorMessage(`Cannot add production rule: non-terminal ${inputNonTerminal} is not present in grammar's non-terminals ${grammar.nonTerminalSymbols}`);
    }

    for (const outputSymbol of outputSymbols) {
      if (!grammar.hasNonTerminalSymbol(outputSymbol) && !grammar.hasTerminalSymbol(outputSymbol)) {
        throw new ErrorMessage(`Cannot add production rule: output symbol ${outputSymbol} is not present in grammar's non-terminals ${grammar.nonTerminalSymbols} or terminals ${grammar.terminalSymbols}`);
      }
    }
    return this.internalFactory.createProductionRule(inputNonTerminal, outputSymbols, grammar);
  }
}

export class RegularGrammarFactory extends IGrammarFactory {
  public createGrammar(nonTerminalSymbols: string[], terminalSymbols: string[], initialNonTerminalSymbol: string): Grammar {
    return new Grammar(GrammarType.REGULAR, nonTerminalSymbols, terminalSymbols, initialNonTerminalSymbol);
  }

  public createProductionRule(inputNonTerminal: string, outputSymbols: string[], grammar: Grammar): ProductionRule {
    const lastOutputSymbol = outputSymbols.slice(-1)[0];
    const lastOutputSymbolIsEpsilon = lastOutputSymbol.length === 0;
    const lastOutputSymbolIsNonTerminal = grammar.hasNonTerminalSymbol(lastOutputSymbol);
    const prefixOutputSymbols = outputSymbols.slice(0, -1);
    // fuck this, this is undefined.....
    // const prefixOutputSymbolsIsTerminal = prefixOutputSymbols.every(prefixOutputSymbol => this.grammar.hasTerminalSymbol(prefixOutputSymbol)); // returns true for empty (Vacuous truth)
    // fuck this, this is undefined in grammar.....
    // const prefixOutputSymbolsIsTerminal = prefixOutputSymbols.every(this.grammar.hasTerminalSymbol); // returns true for empty (Vacuous truth)
    let prefixOutputSymbolsIsTerminal = true;
    for (const prefixOutputSymbol of prefixOutputSymbols) {
      prefixOutputSymbolsIsTerminal &&= grammar.hasTerminalSymbol(prefixOutputSymbol);
    }
    const productionRuleIsRegular = prefixOutputSymbolsIsTerminal && (lastOutputSymbolIsEpsilon || lastOutputSymbolIsNonTerminal);

    if (!productionRuleIsRegular) {
      throw new ErrorMessage(`Cannot add production rule: production rule ${inputNonTerminal} -> ${outputSymbols.join("")} is not a regular rule.`);
    }

    return ProductionRule.createByFactory(this.nextProductionRuleString(), inputNonTerminal, outputSymbols);
  }
}

export class ContextFreeGrammarFactory extends IGrammarFactory {
  createGrammar(nonTerminalSymbols: string[], terminalSymbols: string[], initialNonTerminalSymbol: string): Grammar {
    return new Grammar(GrammarType.CONTEXT_FREE, nonTerminalSymbols, terminalSymbols, initialNonTerminalSymbol);
  }
  public createProductionRule(inputNonTerminal: string, outputSymbols: string[], _grammar: Grammar): ProductionRule {
    if (_grammar == null) {
      throw "Fuck eslint when so that i can successfully commit this shit.";
    }
    return ProductionRule.createByFactory(this.nextProductionRuleString(), inputNonTerminal, outputSymbols);
  }
}

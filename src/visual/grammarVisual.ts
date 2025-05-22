import { Kind } from "../core/core";
import { Grammar } from "../engine/grammar/grammar";

// for now this only converts grammar to string, which can be put into HTML
// TODO actual grammar visualisation
export interface IGrammarVisual {
  kind: Kind.GRAMMAR
  setGrammar: (grammar: Grammar) => void;
  display: () => string;
  refresh: () => void;
}

export class GrammarVisual implements IGrammarVisual {
  kind = Kind.GRAMMAR as const;
  grammar?: Grammar;
  representation: string = "";

  setGrammar(grammar: Grammar) {
    this.grammar = grammar;
  }

  display(): string {
    return this.representation;
  }

  // refresh representation according to grammar
  refresh() {
    if (!this.grammar) {
      this.representation = "No grammar set.";
      return;
    }

    const nts = this.grammar.nonTerminalSymbols.join(", ");
    const ts = this.grammar.terminalSymbols.join(", ");
    const start = this.grammar.initialNonTerminalSymbol;
    const rules = this.grammar.productionRules
      .map(rule => `${rule.inputNonTerminal} → ${rule.outputSymbols.join(", ")}`)
      .join("\n");

    this.representation =
      `Non-terminals: ${nts}\n` +
      `Terminals: ${ts}\n` +
      `Initial symbol: ${start}\n` +
      `Production Rules:\n${rules}`;
  }

}

import { Kind } from "../core/core";
import { Grammar } from "../engine/grammar/grammar";

// for now this only converts grammar to string, which can be put into HTML
// TODO actual grammar visualisation
export interface IGrammarVisual {
  kind: Kind.GRAMMAR
  setGrammar: (grammar: Grammar) => void;
  display: () => string;
}

export class GrammarVisual implements IGrammarVisual {
  kind = Kind.GRAMMAR as const;
  grammar?: Grammar;

  setGrammar(grammar: Grammar) {
    this.grammar = grammar;
  }

  display(): string {
    return this.grammar?.productionRules.join("\n") ?? "";
  }
}

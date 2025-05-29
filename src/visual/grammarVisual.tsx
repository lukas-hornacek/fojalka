import { Kind } from "../core/core";
import { Grammar } from "../engine/grammar/grammar";
import { JSX } from "react";

// for now this only converts grammar to string, which can be put into HTML
// TODO actual grammar visualisation
export interface IGrammarVisual {
  kind: Kind.GRAMMAR
  setGrammar: (grammar: Grammar) => void;
  display: () => React.ReactNode;
  storeRuleId: (id: string) => void;
  removeRuleId: (id: string) => void;
  getRuleIdByIndex: (index: number) => string | undefined;
  refresh: () => void;
  highlightRule: (ids: string[]) => void;
  clearHighlights: () => void;
}

export class GrammarVisual implements IGrammarVisual {
  kind = Kind.GRAMMAR as const;
  grammar?: Grammar;
  representation: JSX.Element = <></>;
  existingRuleIds: string[] = [];
  highlightedRuleIds: Set<string> = new Set();

  setGrammar(grammar: Grammar) {
    this.grammar = grammar;
  }

  display(): React.ReactNode {
    return this.representation;
  }

  storeRuleId(id: string) {
    this.clearHighlights();
    this.existingRuleIds.push(id);
    this.highlightRule([id]);
  }

  removeRuleId(id: string) {
    this.existingRuleIds = this.existingRuleIds.filter(existingId => existingId !== id);
  }

  getRuleIdByIndex(index: number) {
    return this.existingRuleIds?.[index];
  }

  highlightRule(ids: string[]) {
    for (const id of ids) {
      this.highlightedRuleIds.add(id);
    }
  }

  clearHighlights() {
    this.highlightedRuleIds.clear();
  }

  // refresh representation according to grammar
  refresh() {
    if (!this.grammar) {
      this.representation = <>No grammar set.</>;
      return;
    }

    const nts = this.grammar.nonTerminalSymbols.join(", ");
    const ts = this.grammar.terminalSymbols.join(", ");
    const start = this.grammar.initialNonTerminalSymbol;

    const ruleElements = this.grammar.productionRules.map((rule) => {
      const ruleStr = `${rule.inputNonTerminal} → ${rule.outputSymbols.join(" ")}`;
      const isHighlighted = this.highlightedRuleIds.has(rule.id); // or based on index

      return (
        <div key={`g-rule-visual-${rule.id}`} className={isHighlighted ? "highlight" : ""}>
          {ruleStr}
        </div>
      );
    });

    this.representation =
        <div>
          <div><strong>Non-terminals:</strong> {nts}</div>
          <div><strong>Terminals:</strong> {ts}</div>
          <div><strong>Initial symbol:</strong> {start}</div>
          <div><strong>Production Rules:</strong></div>
          {ruleElements}
        </div>
    ;
  }
}

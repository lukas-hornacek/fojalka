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
  highlight: (ids: string[]) => void;
  clearHighlights: () => void;

  refresher?: React.Dispatch<React.SetStateAction<React.ReactNode>>
}

export class GrammarVisual implements IGrammarVisual {
  kind = Kind.GRAMMAR as const;
  grammar?: Grammar;
  representation: JSX.Element = <></>;
  existingRuleIds: string[] = [];
  highlightedRuleIds: Set<string> = new Set();
  highlightedSymbols: Set<string> = new Set();

  refresher?: React.Dispatch<React.SetStateAction<React.ReactNode>>;

  setGrammar(grammar: Grammar) {
    this.grammar = grammar;
  }

  display(): React.ReactNode {
    return this.representation;
  }

  storeRuleId(id: string) {
    this.existingRuleIds.push(id);
  }

  removeRuleId(id: string) {
    this.existingRuleIds = this.existingRuleIds.filter(existingId => existingId !== id);
  }

  getRuleIdByIndex(index: number) {
    return this.existingRuleIds?.[index];
  }

  highlight(ids: string[]) {
    for (const id of ids) {
      if (id.charAt(0) === "_") {
        // grammar rule
        this.highlightedRuleIds.add(id);
      } else {
        // terminal or non-terminal
        this.highlightedSymbols.add(id);
      }
    }

    this.refresh();
    this.refresher?.(this.display());
  }

  clearHighlights() {
    this.highlightedRuleIds.clear();
    this.highlightedSymbols.clear();

    this.refresh();
    this.refresher?.(this.display());
  }

  // refresh representation according to grammar
  refresh() {
    if (!this.grammar) {
      this.representation = <>No grammar set.</>;
      return;
    }
    const nts =
        <span>
          {this.grammar.nonTerminalSymbols.map((symbol, idx, arr) =>
            <span key={`nt-${symbol}`} className={this.highlightedSymbols.has(symbol) ? "highlight" : ""}>
              {symbol}
              {idx < arr.length - 1 ? ", " : ""}
            </span>
          )}
        </span>
    ;
    const ts =
        <span>
          {this.grammar.terminalSymbols.map((symbol, idx, arr) =>
            <span key={`t-${symbol}`} className={this.highlightedSymbols.has(symbol) ? "highlight" : ""}>
              {symbol}
              {idx < arr.length - 1 ? ", " : ""}
            </span>
          )}
        </span>
    ;
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

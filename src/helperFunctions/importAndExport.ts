import FileSaver from "file-saver";
import { AutomatonCore, IAutomatonCore } from "../core/automatonCore";
import { IAutomaton } from "../engine/automaton/automaton";
import { ICore, Kind } from "../core/core";
import { GrammarCore, IGrammarCore } from "../core/grammarCore";
import { GrammarType, ProductionRule } from "../engine/grammar/grammar";

export interface SavedAutomaton {
  kind: Kind.AUTOMATON;
  automaton: IAutomaton;
  visuals: { id: string; position: { x: number; y: number } }[];
}

export interface SavedGrammar {
  kind: Kind.GRAMMAR;
  type: GrammarType;
  grammar: {
    grammarType: GrammarType;
    nonTerminalSymbols: string[];
    terminalSymbols: string[];
    initialNonTerminalSymbol: string;
    productionRules: ProductionRule[];
  };
}

export function exportAutomaton(automatonCore: IAutomatonCore) {
  // prepare objects by removing possible circular references
  // and just useless stuff in general
  const exportableAutomaton: IAutomaton = { ...automatonCore.automaton };
  exportableAutomaton.commandHistory = [];

  const exportObject: SavedAutomaton = {
    kind: automatonCore.kind,
    automaton: exportableAutomaton,
    visuals: automatonCore
      .getCytoscape()!
      .nodes()
      .map((x) => ({ id: x.id(), position: x.position() })),
  };

  const blob = new Blob([JSON.stringify(exportObject)], {
    type: "application/json",
  });

  FileSaver.saveAs(blob, "exportedAutomaton.json");
  return exportObject;
}

export function exportGrammar(grammarCore: IGrammarCore) {
  const exportObject: SavedGrammar = {
    kind: grammarCore.kind,
    type: grammarCore.type,
    grammar: {
      grammarType: grammarCore.grammar.grammarType,
      nonTerminalSymbols: grammarCore.grammar.nonTerminalSymbols,
      terminalSymbols: grammarCore.grammar.terminalSymbols,
      initialNonTerminalSymbol: grammarCore.grammar.initialNonTerminalSymbol,
      productionRules: grammarCore.grammar.productionRules,
    },
  };

  const blob = new Blob([JSON.stringify(exportObject)], {
    type: "application/json",
  });

  FileSaver.saveAs(blob, "exportedGrammar.json");
  return exportObject;
}

export function importAutomatonOrGrammar(data: string, core: ICore) {
  const imported: SavedAutomaton | SavedGrammar = JSON.parse(data);

  console.log("Parsed import:");
  console.log(imported);

  switch (imported.kind) {
    case Kind.AUTOMATON:
      return AutomatonCore.fromSavedJSON(imported, core.mode);
    case Kind.GRAMMAR:
      return GrammarCore.fromSavedJSON(imported);
    default:
      alert("Uknown input; only grammars and automatons are supported.");
      return;
  }
}

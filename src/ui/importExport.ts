import FileSaver from "file-saver";
import { IAutomatonCore } from "../core/automatonCore";
import { IAutomaton } from "../engine/automaton/automaton";
import { Kind } from "../core/core";

export interface SavedAutomaton {
  kind: Kind;
  automaton: IAutomaton;
  visuals: { id: string, position: { x: number, y: number } }[];
}

export function exportAutomaton(automatonCore: IAutomatonCore) {
  // prepare objects by removing possible circular references
  // and just useless stuff in general
  const exportableAutomaton: IAutomaton = { ...automatonCore.automaton };
  exportableAutomaton.commandHistory = [];

  const exportObject: SavedAutomaton = {
    kind: automatonCore.kind,
    automaton: exportableAutomaton,
    visuals: automatonCore.getCytoscape()!.nodes().map(x => ({ id: x.id(), position: x.position() }))
  };

  const blob = new Blob([JSON.stringify(exportObject)], {
    type: "application/json",
  });

  FileSaver.saveAs(blob, "exportedAutomaton.json");
  return exportObject;
}

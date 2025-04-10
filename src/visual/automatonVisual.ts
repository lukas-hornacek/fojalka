import cytoscape from "cytoscape";
import { Kind } from "../core/core";

export type NodeProps = {
  id: string,
  isFinal: boolean,
  isStarting: boolean,
};

export type EdgeProps = {
  id: string,
  from: string,
  to: string,
  label: string,
};

export interface IAutomatonVisual {
  kind: Kind.AUTOMATON;

  init: () => void;
  fit: () => void;

  addNode: (id: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  renameNode: (id: string, newId: string) => void;
  // also removes initial status from current initial state
  setInitialNode: (id: string) => void;
  setIsFinalNode: (id: string, isFinal: boolean) => void;

  addEdge: (id: string, from: string, to: string, label: string,) => void;
  editEdge: (id: string, label: string) => void;
  removeEdge: (id: string) => void;
  highlightElements: (ids: string[]) => void;
  // removes all current highlights
  clearHighlights: () => void;
}

export class AutomatonVisual implements IAutomatonVisual {
  kind = Kind.AUTOMATON as const;
  id: string;
  cy?: cytoscape.Core;

  constructor(id: string) {
    this.id = id;
  }

  init() {
    this.cy = cytoscape({
      container: document.getElementById(this.id),
      elements: [],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#666",
            label: "data(id)",
          },
        },
        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
          },
        },
      ],
      layout: { name: "preset" },
    });

    // for debugging only
    this.cy.on("tap", "node, edge", (e) => {
      console.log(e.target.id());
    });
  }

  fit() {
    this.cy?.fit();
  }

  addNode(id: string, position: { x: number; y: number }) {
    this.cy?.add({ group: "nodes", data: { id }, position });
  }

  removeNode(id: string) {
    this.cy?.remove(`node#${id}`);
  }

  // TODO
  renameNode(id: string, newId: string) {
    console.log(id, newId);
  }

  // TODO
  setInitialNode(id: string) {
    console.log(id);
  }

  // TODO
  setIsFinalNode(id: string, isFinal: boolean) {
    console.log(id, isFinal);
  }

  addEdge(id: string, from: string, to: string, label: string) {
    this.cy?.add({ group: "edges", data: { id, source: from, target: to, label } });
  }

  // TODO
  editEdge(id: string, label: string) {
    console.log(id, label);
  }

  removeEdge(id: string) {
    this.cy?.remove(`edge#${id}`);
  }

  // TODO
  highlightElements(ids: string[]) {
    console.log(ids);
  };

  // TODO
  clearHighlights() {
    return;
  }
}

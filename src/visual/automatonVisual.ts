import cytoscape, { ElementDefinition } from "cytoscape";
import { Kind } from "../core/core";
import { INITIAL_STATE, PRIMARY_CYTOSCAPE_ID } from "../constants";

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
  getElements: () => ElementDefinition[]
  reinitialize: (elements: ElementDefinition[]) => void;

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
  elems?: ElementDefinition[];

  constructor(id: string) {
    this.id = id;
  }

  reinitialize(elems: ElementDefinition[]) {
    this.id = PRIMARY_CYTOSCAPE_ID;
    this.elems = elems;
  }

  getElements() {
    const nodes = this.cy?.nodes().map(node => ({
      data: node.data(),
      group: node.group(),
      classes: node.classes(),
      position: node.position(),
    }));
    const edges: ElementDefinition[] = this.cy!.edges().map(edge => ({
      data: edge.data(),
      group: edge.group(),
      classes: edge.classes(),
    }));
    // cytoscape does not play well with TypeScript...
    return [...nodes as ElementDefinition[], ...edges];
  }

  init() {
    this.cy?.destroy();
    this.cy = cytoscape({
      container: document.getElementById(this.id),
      elements: this.elems ?? [{ group: "nodes", data: { id: INITIAL_STATE }, position: { x: 0, y: 0 } }],
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

  highlightElements(ids: string[]) {
    for (const id of ids) {
      const element = this.cy?.getElementById(id);
      if (element && element.nonempty()) {
        if (id.startsWith("_")) {
          // It's an edge
          element.style({
            "line-color": "salmon",
            "target-arrow-color": "salmon",
          });
        } else {
          // It's a node
          element.style({
            "background-color": "salmon",
          });
        }
      } else {
        console.warn(`Element with id "${id}" not found.`);
      }
    }
  }

  clearHighlights() {
    this.cy?.nodes().forEach(node => {
      node.style({ "background-color": "#666" }); // your default node color
    });
    this.cy?.edges().forEach(edge => {
      edge.style({
        "line-color": "#ccc",
        "target-arrow-color": "#ccc",
      });
    });
  }
}

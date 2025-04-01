import cytoscape from "cytoscape";

export interface IVisual {
  id: string;

  init: () => void;
  fit: () => void;
  addNode: (id: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  addEdge: (from: string, to: string, id: string, label: string) => void;
  removeEdge: (id: string) => void;
}

export class Visual implements IVisual {
  id: string;
  cy?: cytoscape.Core;

  constructor(id: string) {
    this.id = id;
  }

  init() {
    this.cy = cytoscape({
      container: document.getElementById(this.id),
      // example elements, that should be removed once user can add them themselves
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

  addEdge(from: string, to: string, id: string, label: string) {
    this.cy?.add({ group: "edges", data: { id: id, source: from, target: to, label: label } });
  }

  removeEdge(id: string) {
    this.cy?.remove(`edge#${id}`);
  }
}

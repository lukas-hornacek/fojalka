import cytoscape, { ElementDefinition } from "cytoscape";
import { Kind } from "../core/core";
import { IAutomaton } from "../engine/automaton/automaton";
import { PRIMARY_CYTOSCAPE_ID } from "../constants";

export type NodeProps = {
  id: string;
  isFinal: boolean;
  isStarting: boolean;
};

export type EdgeProps = {
  id: string;
  from: string;
  to: string;
  label: string;
};

export interface IAutomatonVisual {
  kind: Kind.AUTOMATON;
  initialJSON?: object;

  init: () => void;
  fit: () => void;
  getElements: () => ElementDefinition[];
  reinitialize: (elements: ElementDefinition[]) => void;

  addNode: (id: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  renameNode: (id: string, newId: string) => void;
  // also removes initial status from current initial state
  setInitialNode: (id: string) => void;
  setIsFinalNode: (id: string, isFinal: boolean) => void;

  addEdge: (id: string, from: string, to: string, label: string) => void;
  editEdge: (id: string, label: string) => void;
  removeEdge: (id: string) => void;
  highlightElements: (ids: string[]) => void;
  // removes all current highlights
  clearHighlights: () => void;

  getCytoscape: () => cytoscape.Core | undefined;
  redrawAutomaton: (automaton: IAutomaton) => void;

  callbackAfterInit: (fn: (cy: cytoscape.Core) => void) => void;
}

export class AutomatonVisual implements IAutomatonVisual {
  kind = Kind.AUTOMATON as const;
  id: string;
  cy?: cytoscape.Core;

  initialState: string = "";
  initialStatePosition: { x: number; y: number } = { x: 0, y: 0 };
  elems?: ElementDefinition[];

  // some functions need to be called only after init
  initialized: boolean = false;
  toCallBack: ((cy: cytoscape.Core) => void)[] = [];

  constructor(
    id: string,
    initialState: string,
    initialStatePosition: { x: number; y: number }
  ) {
    this.id = id;
    this.initialState = initialState;
    this.initialStatePosition = initialStatePosition;
  }

  reinitialize(elems: ElementDefinition[]) {
    this.id = PRIMARY_CYTOSCAPE_ID;
    this.elems = elems;
  }

  getElements() {
    const nodes = this.cy?.nodes().map((node) => ({
      data: node.data(),
      group: node.group(),
      classes: node.classes(),
      position: node.position(),
    }));
    const edges: ElementDefinition[] = this.cy!.edges().map((edge) => ({
      data: edge.data(),
      group: edge.group(),
      classes: edge.classes(),
    }));
    // cytoscape does not play well with TypeScript...
    return [...(nodes as ElementDefinition[]), ...edges];
  }

  init() {
    console.log("init");
    this.cy?.destroy();

    this.cy = cytoscape({
      container: document.getElementById(this.id),
      elements: this.elems ?? [
        {
          group: "nodes",
          data: {
            id: this.initialState,
            initial: "true",
            final: "false",
          },
          position: this.initialStatePosition,
        },
      ],
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
            "line-color": "#999",
            "target-arrow-color": "#999",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "arrow-scale": 2,
          },
        },
        {
          selector: ":selected",
          css: {
            "background-color": "SteelBlue",
            "line-color": "SteelBlue",
            "target-arrow-color": "SteelBlue",
            "source-arrow-color": "SteelBlue",
          },
        }, {
          selector: 'node[initial = "true"]',
          css: {
            "background-color": "Green",
          },
        },
        {
          selector: 'node[final = "true"]',
          css: {
            "border-style": "double",
            "border-color": "Black",
            "border-width": 6,
          },
        },
      ],
      layout: { name: "grid", rows: 1 },
      maxZoom: 10,
      selectionType: "single",
    });

    // init done
    this.initialized = true;
    this.toCallBack.forEach((fn) => fn(this.cy!));
  }

  callbackAfterInit(fn: (cy: cytoscape.Core) => void) {
    if (!this.initialized) {
      this.toCallBack.push(fn);
    } else {
      fn(this.cy!);
    }
  }

  getCytoscape() {
    return this.cy;
  }

  redrawAutomaton(automaton: IAutomaton) {
    // todo doesn't do what I want

    // remove everything
    this.cy!.elements().remove();

    // add all nodes
    automaton.states.forEach((x, index) => {
      this.addNode(x, { x: 50 * index, y: 0 });
    });

    // add all edges
    for (const fromEdge in automaton.deltaFunctionMatrix) {
      for (const toEdge in automaton.deltaFunctionMatrix[fromEdge]) {
        automaton.deltaFunctionMatrix[fromEdge][toEdge].forEach((edge) => {
          this.addEdge(edge.id, fromEdge, toEdge, edge.label);
        });
      }
    }

    console.log("redrawn");
  }

  fit() {
    this.cy?.fit();
  }

  addNode(id: string, position: { x: number; y: number }) {
    this.cy?.add({
      group: "nodes",
      data: { id: id, initial: "false", final: "false" },
      position,
    });
  }

  removeNode(id: string) {
    this.cy?.remove(`node#${id}`);
  }

  renameNode(id: string, newId: string) {
    /* eslint-disable  @typescript-eslint/no-explicit-any */

    // cytoscape sent me to go frick myself when I attempted to change ID
    // so I'll just yoink the json of the elements, manually change the ID everywhere and put it back in
    // just fuckin' brute-force the shit out of it
    const newJSON: any = this.cy?.json();

    newJSON!.elements.nodes = newJSON!.elements.nodes?.map((n: any) =>
      n.data.id === id ? { ...n, data: { ...n.data, id: newId } } : n
    );
    newJSON!.elements.edges =
      newJSON!.elements.edges?.map((e: any) =>
        e.data.source === id ? { ...e, data: { ...e.data, source: newId } } : e
      ) ?? undefined;
    newJSON!.elements.edges =
      newJSON!.elements.edges?.map((e: any) =>
        e.data.target === id ? { ...e, data: { ...e.data, target: newId } } : e
      ) ?? undefined;

    this.cy?.remove("*");
    this.cy?.json(newJSON);
  }

  setInitialNode(id: string) {
    //console.log("hľa", this.cy?.nodes('[initial = "true"]'));

    // remove from the previous
    this.cy?.nodes('[initial = "true"]').data("initial", "false");

    // add to new one
    this.cy?.getElementById(id).data("initial", "true");

    //console.log(id);
  }

  setIsFinalNode(id: string, isFinal: boolean) {
    this.cy?.getElementById(id).data("final", isFinal ? "true" : "false");
    console.log(id, isFinal);
  }

  addEdge(id: string, from: string, to: string, label: string) {
    this.cy?.add({
      group: "edges",
      data: { id, source: from, target: to, label },
    });
  }

  // delete and re-add the edge
  editEdge(id: string, label: string) {
    const data: any = this.cy?.getElementById(id).data();
    this.cy?.getElementById(id).remove();

    data.label = label;

    this.cy?.add({
      group: "edges",
      data: data,
    });
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
    this.cy?.nodes().forEach((node) => {
      node.style({ "background-color": "#666" }); // your default node color
    });
    this.cy?.edges().forEach((edge) => {
      edge.style({
        "line-color": "#ccc",
        "target-arrow-color": "#ccc",
      });
    });
  }
}

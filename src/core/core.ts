import { IAutomatonEngine, Engine } from "../engine/automaton_engine";
import { ErrorMessage, IErrorMessage } from "../engine/common";
import { IUniversalEdgeProps } from "../engine/automaton/factories";
import { AutomatonType } from "../engine/automaton/automaton";
import { IVisual, Visual } from "../visual/visual";

enum Mode {
  EDIT,
  VISUAL,
}

// holds most of global state, coordinates Visual and Core components
// exposes interface that is used by UI
export interface ICore {
  // called from AutomatonWindow, which own the Cytoscape HTML element
  init: (id: string) => IErrorMessage | undefined;

  // centers the Cytoscape window to show the entire automaton
  fit: () => void;

  // basic edit functions
  addState: (id: string, position: { x: number, y: number }) => IErrorMessage | undefined;
  removeState: (id: string) => IErrorMessage | undefined;
  addEdge: (from: string, to: string, props: IUniversalEdgeProps) => IErrorMessage | undefined;
  removeEdge: (from: string, to: string, id: string) => IErrorMessage | undefined;
  undo: () => IErrorMessage | undefined;
}

// component that holds global state and coordinates Visual and Core components
export class Core implements ICore {
  // current UI mode
  mode: Mode = Mode.EDIT;
  automatonType: AutomatonType = AutomatonType.FINITE;
  // used to create unique edge IDs
  edgeCounter: number = 0;

  engine: IAutomatonEngine = new Engine(this.automatonType);
  visualPrimary: IVisual = new Visual("cy-primary");
  visualSecondary: IVisual = new Visual("cy-secondary");

  init(id: string) {
    if (id === "cy-primary") {
      this.visualPrimary.init();
    } else if (id === "cy-secondary") {
      this.visualSecondary.init();
    } else {
      return new ErrorMessage(`Invalid cytoscape element id '${id}'`);
    }
  }

  // TODO engine.undo() must be refactored to return information that can be used to reflect changes in visual
  undo() {
    return new ErrorMessage("Not implemented.");
  }

  fit() {
    this.visualPrimary.fit();
  }

  addState(id: string, position: { x: number, y: number }) {
    if (this.mode !== Mode.EDIT) {
      return new ErrorMessage("Editing automaton is only permitted in edit mode.");
    }
    if (id.trim().length === 0) {
      return new ErrorMessage("State ID must contain at least one non-whitespace character.");
    }
    if (id.charAt(0) == "_") {
      return new ErrorMessage("State ID cannot start with an underscore");
    }

    const error = this.engine.addState(id);
    if (error !== undefined) {
      return error;
    }

    this.visualPrimary.addNode(id, position);
  }

  removeState(id: string) {
    if (this.mode !== Mode.EDIT) {
      return new ErrorMessage("Editing automaton is only permitted in edit mode.");
    }

    const error = this.engine.removeState(id);
    if (error !== undefined) {
      return error;
    }

    this.visualPrimary.removeNode(id);
  }

  addEdge(from: string, to: string, props: IUniversalEdgeProps) {
    if (this.mode !== Mode.EDIT) {
      return new ErrorMessage("Editing automaton is only permitted in edit mode.");
    }
    if (props.inputChar.trim().length === 0) {
      return new ErrorMessage("Input char must contain at least one non-whitespace character.");
    }
    if (this.automatonType === AutomatonType.PDA) {
      if (props.readStackChar === undefined || props.writeStackWord === undefined) {
        return new ErrorMessage("PDA edge must specify character(s) read from and written to the stack");
      }
      if (props.readStackChar.trim().length === 0 || props.writeStackWord.length === 0) {
        return new ErrorMessage("Read and written stack character(s) must not contain whitespace-only symbols");
      }
      for (const c in props.writeStackWord) {
        if (c.trim().length === 0) {
          return new ErrorMessage("Read and written stack character(s) must not contain whitespace-only symbols");
        }
      }
    }

    props.id = `_${this.edgeCounter}`;

    const error = this.engine.addEdge(from, to, props);
    if (error !== undefined) {
      return error;
    }

    // TODO the label should use all relevant props for each AutomatonType
    this.visualPrimary.addEdge(from, to, props.id, props.inputChar);

    this.edgeCounter++;
  }

  removeEdge(from: string, to: string, id: string) {
    if (this.mode !== Mode.EDIT) {
      return new ErrorMessage("Editing automaton is only permitted in edit mode.");
    }

    const error = this.engine.removeEdge(from, to, id);
    if (error !== undefined) {
      return error;
    }

    this.visualPrimary.removeEdge(id);
  }
}

import { IEngine, Engine } from "../engine/engine";
import { ErrorMessage, IErrorMessage } from "../engine/types/common";
import { IUniversalEdgeProps } from "../engine/types/factories";
import { AutomatonType } from "../engine/types/types";
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
    addState: (id: string, position: { x: number, y: number}) => IErrorMessage | undefined;
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

    engine: IEngine = new Engine(this.automatonType);
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

    addState(id: string, position: { x: number, y: number}) {
        if (this.mode !== Mode.EDIT) {
            return new ErrorMessage("Editing automaton is only permitted in edit mode.");
        }
        if (id.length === 0) {
            return new ErrorMessage("State ID cannot be an empty string.");
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

        props.id = `_${this.edgeCounter}`;

        const error = this.engine.addEdge(from, to, props);
        if (error !== undefined) {
            return error;
        }

        this.visualPrimary.addEdge(from, to, props.id);

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
import { IEngine, Engine } from "../engine/engine";
import { ErrorMessage, IErrorMessage } from "../engine/types/common";
import { AutomatonType } from "../engine/types/types";
import { IVisual, Visual } from "../visual/visual";

enum Mode {
    EDIT,
    VISUAL,
}

export interface ICore {
    addState: (id: string, position: { x: number, y: number}) => IErrorMessage | undefined;
    init: (id: string) => IErrorMessage | undefined;
}

// component that holds global state and coordinates Visual and Core components
export class Core implements ICore {
    // current UI mode
    mode: Mode = Mode.EDIT;
    automatonType = AutomatonType.FINITE;

    engine: IEngine = new Engine(this.automatonType);
    visualPrimary: IVisual = new Visual("cy-primary");
    visualSecondary: IVisual = new Visual("cy-secondary");

    addState(id: string, position: { x: number, y: number}): IErrorMessage | undefined {
        const error = this.engine.addState(id);
        if (error !== undefined) {
            return error;
        }

        this.visualPrimary.addNode(id, position);
    }

    init(id: string) {
        if (id === "cy-primary") {
            this.visualPrimary.init();
        } else if (id === "cy-secondary") {
            this.visualSecondary.init();
        } else {
            return new ErrorMessage(`Invalid cytoscape element id '${id}'`);
        }
    }
}
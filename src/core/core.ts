import { IEngine, Engine } from "../engine/engine";
import { IErrorMessage } from "../engine/types/common";
import { AutomatonType } from "../engine/types/types";
import { IVisual, Visual } from "../visual/visual";

enum Mode {
    EDIT,
    VISUAL,
}

export interface ICore {
    addState: (id: string, position: { x: number, y: number}) => IErrorMessage | undefined;
    init: () => void;
}

// component that holds global state and coordinates Visual and Core components
export class Core implements ICore {
    // current UI mode
    mode: Mode = Mode.EDIT;
    automatonType = AutomatonType.FINITE;

    engine: IEngine = new Engine(this.automatonType);
    visual: IVisual = new Visual();

    addState(id: string, position: { x: number, y: number}): IErrorMessage | undefined {
        const error = this.engine.addState(id);
        if (error !== undefined) {
            return error;
        }

        this.visual.addNode(id, position);
    }

    init() {
        this.visual.init();
    }
}
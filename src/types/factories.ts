import {
    AutomatonType,
    EditCommand,
    FiniteAutomatonEdge,
    IAutomaton,
    IAutomatonMemento,
    IEdge,
    IState,
    PDAEdge,
} from "./types.ts";

interface IUniversalEdgeProps {
    inputChar: string;
    stackChar?: string;
}

export interface IAutomatonFactory {
    createAutomaton(): IAutomaton;
    createEdge(edgeProps: IUniversalEdgeProps): IEdge;
}

export class AbstractAutomatonFactory implements IAutomatonFactory {
    internalFactory: IAutomatonFactory;

    constructor(automatonType: AutomatonType) {
        if (automatonType === AutomatonType.FINITE) {
            this.internalFactory = new FiniteAutomatonFactory();
        } else if (automatonType === AutomatonType.PDA) {
            this.internalFactory = new PDAFactory();
        } else {
            const supportedTypes = [AutomatonType.FINITE, AutomatonType.PDA];
            throw new Error(
                `Unsupported automaton type: ${automatonType}. Supported types are ${JSON.stringify(supportedTypes)}.`
            );
        }
    }

    createAutomaton(): IAutomaton {
       return this.internalFactory.createAutomaton();
    }

    createEdge(edgeProps: IUniversalEdgeProps): IEdge {
        return this.internalFactory.createEdge(edgeProps);
    }
}

export class FiniteAutomatonFactory implements IAutomatonFactory {
    createAutomaton(): IAutomaton {
        return new Automaton({
            states: [],
            deltaFunctionMatrix: {},
            automatonType: AutomatonType.FINITE,
        });
    }

    createEdge(edgeProps: IUniversalEdgeProps): IEdge {
        return new FiniteAutomatonEdge(
            edgeProps.inputChar,
        );
    }
}

export class PDAFactory implements IAutomatonFactory {
    createAutomaton(): IAutomaton {
        return new Automaton({
            states: [],
            deltaFunctionMatrix: {},
            automatonType: AutomatonType.PDA,
        });
    }

    createEdge(edgeProps: IUniversalEdgeProps): IEdge {
        if (!edgeProps.stackChar) {
            throw new Error("Cannot create PDAEdge without stack char argument");
        }
        return new PDAEdge(
            edgeProps.inputChar,
            edgeProps.stackChar,
        );
    }
}

export type AutomatonParams = {
    states: IState[];
    deltaFunctionMatrix: Record<number, Record<number, IEdge[]>>;
    automatonType: AutomatonType;
};

export class Automaton implements IAutomaton {
    states: IState[];
    deltaFunctionMatrix: Record<number, Record<number, IEdge[]>>;
    automatonType: AutomatonType;
    commandHistory: EditCommand[];

    constructor({
        states = [],
        deltaFunctionMatrix = {},
        automatonType,
    }: AutomatonParams) {
        this.states = states;
        this.commandHistory = [];
        this.automatonType = automatonType;
        this.deltaFunctionMatrix = deltaFunctionMatrix;
    }

    executeCommand(command: EditCommand): void {
        const maybeErrorMessage = command.execute();
        if (maybeErrorMessage === undefined) {
            this.commandHistory.push(command);
        } else {
            throw new Error(maybeErrorMessage.details);
        }
    }

    undo(): void {
        const command = this.commandHistory.pop();
        if (command) {
            command.undo();
        }
    }

    getInitialState(): IState {
        const initialState = this.states.find(state => state.isInitial);
        if (!initialState) {
            throw new Error("No initial state found.");
        }
        return initialState;
    }

    save(): IAutomatonMemento {
        return new AutomatonMemento(
            this.states, this.deltaFunctionMatrix, this.automatonType
        );
    }
    restore(memento: IAutomatonMemento): void {
        this.states = memento.states;
        this.deltaFunctionMatrix = memento.deltaFunctionMatrix;
        this.automatonType = memento.automatonType;
    }
}

class AutomatonMemento implements IAutomatonMemento {
    states: IState[];
    automatonType: AutomatonType;
    deltaFunctionMatrix: Record<number, Record<number, Array<IEdge>>>;

    constructor(
        _states: IState[],
        _deltaFunctionMatrix: Record<number, Record<number, Array<IEdge>>>,
        _automatonType: AutomatonType
    ) {
        this.states = _states;
        this.deltaFunctionMatrix = _deltaFunctionMatrix;
        this.automatonType = _automatonType;
    }
}
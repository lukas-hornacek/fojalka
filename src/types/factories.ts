import {
    AutomatonType,
    EditModeCommand,
    FiniteAutomatonEdge,
    FiniteConfiguration,
    IAutomaton,
    IAutomatonMemento,
    IEdge,
    IState,
    PDAConfiguration,
    PDAEdge,
} from "./types.ts";

interface IUniversalEdgeProps {
    id: number;
    fromStateId: number;
    toStateId: number;
    inputChar: string;
    stackChar?: string;
}

export interface IAutomatonFactory {
    createAutomaton(startingStateId: number, finalStateIds: number[]): IAutomaton;
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

    createAutomaton(startingStateId: number, finalStateIds: number[]): IAutomaton {
       return this.internalFactory.createAutomaton(startingStateId, finalStateIds);
    }

    createEdge(edgeProps: IUniversalEdgeProps): IEdge {
        return this.internalFactory.createEdge(edgeProps);
    }
}

export class FiniteAutomatonFactory implements IAutomatonFactory {
    createAutomaton(startingStateId: number, finalStateIds: number[]): IAutomaton {
        return new Automaton({
            states: [],
            deltaFunctionMatrix: {},
            finalStateIds,
            startingStateId,
            automatonType: AutomatonType.FINITE,
        });
    }

    createEdge(edgeProps: IUniversalEdgeProps): IEdge {
        return new FiniteAutomatonEdge(
            edgeProps.id,
            edgeProps.inputChar,
        );
    }
}

export class PDAFactory implements IAutomatonFactory {
    createAutomaton(startingStateId: number, finalStateIds: number[]): IAutomaton {
        return new Automaton({
            states: [],
            deltaFunctionMatrix: {},
            finalStateIds,
            startingStateId,
            automatonType: AutomatonType.PDA,
        });
    }

    createEdge(edgeProps: IUniversalEdgeProps): IEdge {
        if (!edgeProps.stackChar) {
            throw new Error("Cannot create PDAEdge without stack char argument");
        }
        return new PDAEdge(
            edgeProps.id,
            edgeProps.inputChar,
            edgeProps.stackChar,
        );
    }
}

type AutomatonParams = {
    states: IState[];
    deltaFunctionMatrix: Record<number, Record<number, IEdge[]>>;
    finalStateIds: number[];
    startingStateId: number;
    automatonType: AutomatonType;
};

export class Automaton implements IAutomaton {
    states: IState[];
    deltaFunctionMatrix: Record<number, Record<number, IEdge[]>>;
    finalStateIds: number[];
    startingStateId: number;
    automatonType: AutomatonType;
    commandHistory: EditModeCommand[];

    constructor({
        states = [],
        deltaFunctionMatrix = {},
        finalStateIds,
        startingStateId,
        automatonType,
    }: AutomatonParams) {
        this.states = states;
        this.commandHistory = [];
        this.finalStateIds = finalStateIds;
        this.startingStateId = startingStateId;
        this.automatonType = automatonType;
        this.deltaFunctionMatrix = deltaFunctionMatrix;
    }

    executeCommand(command: EditModeCommand): void {
        if (command.execute()) {
            this.commandHistory.push(command);
        }
    }
    undo(): void {
        const command = this.commandHistory.pop();
        if (command) {
            command.undo();
        }
    }

    visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration {
        // TODO implement
        return configuration;
    };

    visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration {
        // TODO implement
        return configuration;
    }

    save(): IAutomatonMemento {
        return new AutomatonMemento(this.states, this.finalStateIds, this.startingStateId, this.automatonType);
    }
    restore(memento: IAutomatonMemento): void {
        this.states = memento.states;
        this.finalStateIds = memento.finalStateIds;
        this.startingStateId = memento.startingStateId;
        this.automatonType = memento.automatonType;
    }
}

class AutomatonMemento implements IAutomatonMemento {
    states: IState[];
    finalStateIds: number[];
    startingStateId: number;
    automatonType: AutomatonType;

    constructor(_states: IState[], _finalStateIds: number[], _startingStateId: number, _automatonType: AutomatonType) {
        this.states = _states;
        this.finalStateIds = _finalStateIds;
        this.startingStateId = _startingStateId;
        this.automatonType = _automatonType;
    }
}
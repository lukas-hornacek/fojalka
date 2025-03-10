import {
    AutomatonType,
    EditModeCommand,
    IAutomaton,
    IEdge,
    IState,
    FiniteConfiguration,
    PDAConfiguration,
    IAutomatonMemento,
} from "./types.ts";

export interface IAutomatonFactory {
    createAutomaton(): IAutomaton;
    createEdge(): IEdge;
}

// class FiniteAutomatonFactory implements IAutomatonFactory {
//     createAutomaton(): IAutomaton {
//         // TODO implement
//         // return new Automaton({...});
//     }
//     createEdge(): IEdge {
//         // TODO implement
//         // return new FiniteAutomatonEdge(...);
//     }
// }

// TODO PDAFactory, similar to FiniteAutomatonFactory

type AutomatonParams = {
    states: IState[];
    finalStateIds: number[];
    startingStateId: number;
    automatonType: AutomatonType;
};

export class Automaton implements IAutomaton {
    states: IState[];
    finalStateIds: number[];
    startingStateId: number;
    automatonType: AutomatonType;
    commandHistory: EditModeCommand[];

    constructor({
        states = [],
        finalStateIds,
        startingStateId,
        automatonType,
    }: AutomatonParams) {
        this.states = states;
        this.commandHistory = [];
        this.finalStateIds = finalStateIds;
        this.startingStateId = startingStateId;
        this.automatonType = automatonType;
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
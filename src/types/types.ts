export enum AutomatonType {
    FINITE = "FINITE",
    PDA = "PDA",
    TURING = "TURING",
}

interface Edge {
    id: number;
    fromStateId: number;
    toStateId: number;
}

export class FiniteAutomatonEdge implements Edge {
    id: number;
    fromStateId: number;
    toStateId: number;
    inputChar: string;

    constructor(_id: number, _fromStateId: number, _toStateId: number, _inputChar: string) {
        this.id = _id;
        this.fromStateId = _fromStateId;
        this.toStateId = _toStateId;
        this.inputChar = _inputChar;
    }
}

export interface State {
    id: number;
    outgoing: Edge[];
    incoming: Edge[];
}

export interface Automaton {
    states: State[];
    finalStateIds: number[];
    startingStateId: number;

    automatonType: AutomatonType;

    addState(state: State): void;
    addEdge(id1: number, id2: number): void;

    visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration;
    visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration;
}

interface AutomatonConfiguration {
    accept(automaton: Automaton): void;
}

class FiniteConfiguration implements AutomatonConfiguration {
    stateId: number;
    remainingInput: string[];

    constructor(_stateId: number, _remainingInput: string[]) {
        this.stateId = _stateId;
        this.remainingInput = _remainingInput;
    }

    accept(automaton: Automaton): void {
        automaton.visitFiniteConfiguration(this);
    }
}

class PDAConfiguration implements AutomatonConfiguration {
    stateId: number;
    remainingInput: string[];
    stack: string[];

    constructor(_stateId: number, _remainingInput: string[], _stack: string[]) {
        this.stateId = _stateId;
        this.remainingInput = _remainingInput;
        this.stack = _stack;
    }

    accept(automaton: Automaton): void {
        automaton.visitPDAConfiguration(this);
    }
}

export interface Simulation {
    automaton: Automaton;
    configuration: AutomatonConfiguration;

    nextStep(): void;
    run(): void;
}
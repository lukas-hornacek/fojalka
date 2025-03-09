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
    save(): ConfigurationMemento;
    restore(memento: ConfigurationMemento): void;
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

    save(): FiniteConfigurationMemento {
        return new FiniteConfigurationMemento(this.stateId, this.remainingInput);
    }

    restore(memento: FiniteConfigurationMemento): void {
        this.stateId = memento.stateId;
        this.remainingInput = memento.remainingInput;
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

    save(): PDAConfigurationMemento {
        return new PDAConfigurationMemento(this.stateId, this.remainingInput, this.stack);
    }

    restore(memento: PDAConfigurationMemento): void {
        this.stateId = memento.stateId;
        this.remainingInput = memento.remainingInput;
        this.stack = memento.stack;
    }
}

interface ConfigurationMemento {
    stateId: number;
}

class FiniteConfigurationMemento implements ConfigurationMemento {
    stateId: number;
    remainingInput: string[];

    constructor(_stateId: number, _remainingInput: string[]) {
        this.stateId = _stateId;
        this.remainingInput = _remainingInput;
    }
}

class PDAConfigurationMemento implements ConfigurationMemento {
    stateId: number;
    remainingInput: string[];
    stack: string[];

    constructor(_stateId: number, _remainingInput: string[], _stack: string[]) {
        this.stateId = _stateId;
        this.remainingInput = _remainingInput;
        this.stack = _stack;
    }
}

export interface Simulation {
    automaton: Automaton;
    configuration: AutomatonConfiguration;

    nextStep(): void; // Create and execute a NextStepCommand
    run(): void;
}

abstract class Command {
    simulation: Simulation;
    backup?: ConfigurationMemento;

    protected constructor(_simulation: Simulation) {
        this.simulation = _simulation;
    }

    saveBackup() {
        this.backup = this.simulation.configuration.save();
    }

    undo() {
        if (this.backup) {
            this.simulation.configuration.restore(this.backup);
        }
    }

    abstract execute(): void; // backup = simulation.save(); ...perform command...
}

 
export class NextStepCommand extends Command {
    execute() {
        this.saveBackup();
        // TODO use this.simulation to perform the next step now
    }
}
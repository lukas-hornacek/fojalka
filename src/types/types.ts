export enum AutomatonType {
    FINITE = "FINITE",
    PDA = "PDA",
    TURING = "TURING",
}

export interface IEdge {
    id: number;
    fromStateId: number;
    toStateId: number;
}

export class FiniteAutomatonEdge implements IEdge {
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

export class PDAEdge implements IEdge {
    id: number;
    fromStateId: number;
    toStateId: number;
    inputChar: string;
    stackChar: string;

    constructor(_id: number, _fromStateId: number, _toStateId: number, _inputChar: string, _stackChar: string) {
        this.id = _id;
        this.fromStateId = _fromStateId;
        this.toStateId = _toStateId;
        this.inputChar = _inputChar;
        this.stackChar = _stackChar;
    }
}

export interface IState {
    id: number;
    outgoing: IEdge[];
    incoming: IEdge[];
}

export interface IAutomaton {
    states: IState[];
    finalStateIds: number[];
    startingStateId: number;

    automatonType: AutomatonType;

    commandHistory: EditModeCommand[];
    executeCommand(command: EditModeCommand): void; // if (command.execute()) { commandHistory.push(command); }
    undo(): void; // command = commandHistory.pop(); command.undo();

    visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration;
    visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration;

    save(): IAutomatonMemento;
    restore(memento: IAutomatonMemento): void;
}

export interface IAutomatonMemento {
    states: IState[];
    finalStateIds: number[];
    startingStateId: number;
    automatonType: AutomatonType;
}

interface IAutomatonConfiguration {
    accept(automaton: IAutomaton): IAutomatonConfiguration;
    save(): IConfigurationMemento;
    restore(memento: IConfigurationMemento): void;
}

export class FiniteConfiguration implements IAutomatonConfiguration {
    stateId: number;
    remainingInput: string[];

    constructor(_stateId: number, _remainingInput: string[]) {
        this.stateId = _stateId;
        this.remainingInput = _remainingInput;
    }

    accept(automaton: IAutomaton): FiniteConfiguration {
        return automaton.visitFiniteConfiguration(this);
    }

    save(): FiniteConfigurationMemento {
        return new FiniteConfigurationMemento(this.stateId, this.remainingInput);
    }

    restore(memento: FiniteConfigurationMemento): void {
        this.stateId = memento.stateId;
        this.remainingInput = memento.remainingInput;
    }
}

export class PDAConfiguration implements IAutomatonConfiguration {
    stateId: number;
    remainingInput: string[];
    stack: string[];

    constructor(_stateId: number, _remainingInput: string[], _stack: string[]) {
        this.stateId = _stateId;
        this.remainingInput = _remainingInput;
        this.stack = _stack;
    }

    accept(automaton: IAutomaton): PDAConfiguration {
        return automaton.visitPDAConfiguration(this);
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

interface IConfigurationMemento {
    stateId: number;
}

class FiniteConfigurationMemento implements IConfigurationMemento {
    stateId: number;
    remainingInput: string[];

    constructor(_stateId: number, _remainingInput: string[]) {
        this.stateId = _stateId;
        this.remainingInput = _remainingInput;
    }
}

class PDAConfigurationMemento implements IConfigurationMemento {
    stateId: number;
    remainingInput: string[];
    stack: string[];

    constructor(_stateId: number, _remainingInput: string[], _stack: string[]) {
        this.stateId = _stateId;
        this.remainingInput = _remainingInput;
        this.stack = _stack;
    }
}

export interface ISimulation {
    automaton: IAutomaton;
    configuration: IAutomatonConfiguration;

    commandHistory: InteractiveModeCommand[];
    executeCommand(command: InteractiveModeCommand): void; // if (command.execute()) { commandHistory.push(command); }
    undo(): void; // command = commandHistory.pop(); command.undo();

    run(): void;
}

export abstract class InteractiveModeCommand {
    simulation: ISimulation;
    backup?: IConfigurationMemento;

    protected constructor(_simulation: ISimulation) {
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

    abstract execute(): boolean; // this.saveBackup(); ...perform command...
}

export abstract class EditModeCommand {
    automaton: IAutomaton;
    backup?: IAutomatonMemento;

    protected constructor(_automaton: IAutomaton) {
        this.automaton = _automaton;
    }

    saveBackup() {
        this.backup = this.automaton.save();
    }

    undo() {
        if (this.backup) {
            this.automaton.restore(this.backup);
        }
    }

    abstract execute(): boolean; // this.saveBackup(); ...perform command...
}

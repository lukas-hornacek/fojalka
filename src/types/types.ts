import { IErrorMessage } from "./common.ts";
import { arraysEqual } from "../utils.ts";
import { NextStepCommand } from "./commands/run";

export enum AutomatonType {
  FINITE = "FINITE",
  PDA = "PDA",
  TURING = "TURING",
}

export interface IEdge {
  id: string;
  inputChar: string;

  equals(otherEdge: IEdge): boolean;
}

export class FiniteAutomatonEdge implements IEdge {
  id: string;
  inputChar: string;

  constructor(_id: string, _inputChar: string) {
    this.id = _id;
    this.inputChar = _inputChar;
  }

  equals(otherEdge: IEdge): boolean {
    if (!(otherEdge instanceof FiniteAutomatonEdge)) {
      return false;
    }
    return this.inputChar === otherEdge.inputChar;
  }
}

export class PDAEdge implements IEdge {
  id: string;
  inputChar: string;
  readStackChar: string;
  writeStackWord: string[];

  constructor(_id: string, _inputChar: string, _readStackChar: string, _writeStackWord: string[]) {
    this.id = _id;
    this.inputChar = _inputChar;
    this.readStackChar = _readStackChar;
    this.writeStackWord = _writeStackWord;
  }

  equals(otherEdge: IEdge): boolean {
    if (!(otherEdge instanceof PDAEdge)) {
      return false;
    }
    return (
      this.inputChar === otherEdge.inputChar &&
            this.readStackChar === otherEdge.readStackChar &&
            arraysEqual(this.writeStackWord, otherEdge.writeStackWord)
    );
  }
}

export interface IAutomaton {
  states: string[];
  initialStateId: string;
  finalStateIds: string[];

  // Encodes matrix[stateFromIdd][stateToId] = Edge[]
  deltaFunctionMatrix: Record<string, Record<string, IEdge[]>>;

  automatonType: AutomatonType;

  commandHistory: EditCommand<unknown>[];
  executeCommand<T>(command: EditCommand<T>): void; // if (command.execute()) { commandHistory.push(command); }
  undo(): void; // command = commandHistory.pop(); command.undo();

  save(): IAutomatonMemento;
  restore(memento: IAutomatonMemento): void;
}

export interface IAutomatonMemento {
  states: string[];
  deltaFunctionMatrix: Record<string, Record<string, IEdge[]>>;
  automatonType: AutomatonType;
}

export interface IConfigurationVisitor {
  visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration;
  visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration;
}

interface IAutomatonConfiguration {
  stateId: string;
  remainingInput: string[];

  accept(visitor: IConfigurationVisitor): IAutomatonConfiguration;
  save(): IConfigurationMemento;
  restore(memento: IConfigurationMemento): void;
}

export class FiniteConfiguration implements IAutomatonConfiguration {
  stateId: string;
  remainingInput: string[];

  constructor(_stateId: string, _remainingInput: string[]) {
    this.stateId = _stateId;
    this.remainingInput = _remainingInput;
  }

  accept(visitor: IConfigurationVisitor): FiniteConfiguration {
    return visitor.visitFiniteConfiguration(this);
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
  stateId: string;
  remainingInput: string[];
  stack: string[];

  constructor(_stateId: string, _remainingInput: string[], _stack: string[]) {
    this.stateId = _stateId;
    this.remainingInput = _remainingInput;
    this.stack = _stack;
  }

  accept(visitor: IConfigurationVisitor): PDAConfiguration {
    return visitor.visitPDAConfiguration(this);
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
  stateId: string;
}

class FiniteConfigurationMemento implements IConfigurationMemento {
  stateId: string;
  remainingInput: string[];

  constructor(_stateId: string, _remainingInput: string[]) {
    this.stateId = _stateId;
    this.remainingInput = _remainingInput;
  }
}

class PDAConfigurationMemento implements IConfigurationMemento {
  stateId: string;
  remainingInput: string[];
  stack: string[];

  constructor(_stateId: string, _remainingInput: string[], _stack: string[]) {
    this.stateId = _stateId;
    this.remainingInput = _remainingInput;
    this.stack = _stack;
  }
}

export interface ISimulation {
  automaton: IAutomaton;
  configuration: IAutomatonConfiguration;

  commandHistory: RunCommand<unknown>[];
  executeCommand(command: RunCommand<unknown>): void; // if (command.execute()) { commandHistory.push(command); }
  undo(): void; // command = commandHistory.pop(); command.undo();

  run(): void;
}

export class Simulation implements ISimulation {
  automaton: IAutomaton;
  configuration: IAutomatonConfiguration;
  commandHistory: RunCommand<unknown>[];

  constructor(_automaton: IAutomaton, _configuration: IAutomatonConfiguration) {
    this.automaton = _automaton;
    this.configuration = _configuration;
    this.commandHistory = [];
  }

  executeCommand(command: RunCommand<unknown>): void {
    if (command.execute() === undefined) {
      this.commandHistory.push(command);
    }
    //TODO else if error respond to it
  }
  undo(): void {
    const command = this.commandHistory.pop();
    if (command === undefined) {
      return;
    } else {
      command.undo();
    }
  }

  // simulates the entire run on the word in configuration (or the remaining word) and returns true if the
  // last state is accepting and false if it isn't
  run(): boolean {
    while (this.configuration.remainingInput.length > 0) {
      const nextCommand = new NextStepCommand(this);
      if (nextCommand.execute() === undefined) {
        this.commandHistory.push(nextCommand);
      }
      //TODO else if error respond to it
    }
    return this.automaton.finalStateIds.some(finalStateId => this.configuration.stateId === finalStateId);
  }
}

export abstract class RunCommand<T = void> {
  simulation: ISimulation;
  backup?: IConfigurationMemento;
  result?: T;

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

  getResult(): T | undefined {
    return this.result;
  }

  abstract execute(): IErrorMessage | undefined; // this.saveBackup(); ...perform command...
}

export abstract class EditCommand<T = void> {
  automaton: IAutomaton;
  backup?: IAutomatonMemento;
  result?: T;

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

  getResult(): T | undefined {
    return this.result;
  }

  abstract execute(): IErrorMessage | undefined; // this.saveBackup(); ...perform command...
}

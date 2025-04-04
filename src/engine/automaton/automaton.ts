import { ErrorMessage, IErrorMessage } from "../common.ts";
import { EditCommand } from "./commands/edit.ts";
import { FiniteConfiguration, PDAConfiguration } from "./configuration.ts";
import { IEdge } from "./edge.ts";
import { ISimulation, Simulation } from "./simulation.ts";

export enum AutomatonType {
  FINITE = "FINITE",
  PDA = "PDA",
  TURING = "TURING",
}

export interface IAutomaton {
  states: string[];
  initialStateId: string;
  finalStateIds: string[];

  // Encodes matrix[stateFromIdd][stateToId] = Edge[]
  deltaFunctionMatrix: Record<string, Record<string, IEdge[]>>;

  automatonType: AutomatonType;

  commandHistory: EditCommand[];
  executeCommand(command: EditCommand): IErrorMessage | undefined; // if (command.execute()) { commandHistory.push(command); }
  undo(): IErrorMessage | undefined; // command = commandHistory.pop(); command.undo();

  save(): IAutomatonMemento;
  restore(memento: IAutomatonMemento): void;

  createRunSimulation(word: string[]): ISimulation;
}

export type AutomatonParams = {
  states: string[];
  deltaFunctionMatrix: Record<string, Record<string, IEdge[]>>;
  automatonType: AutomatonType;
  initialStateId: string;
  finalStateIds: string[];
};

export class Automaton implements IAutomaton {
  states: string[];
  deltaFunctionMatrix: Record<string, Record<string, IEdge[]>>;
  automatonType: AutomatonType;
  commandHistory: EditCommand[];
  initialStateId: string;
  finalStateIds: string[];

  constructor({
    states = [],
    deltaFunctionMatrix = {},
    automatonType,
    initialStateId,
    finalStateIds = [],
  }: AutomatonParams) {
    this.states = states;
    this.commandHistory = [];
    this.automatonType = automatonType;
    this.deltaFunctionMatrix = deltaFunctionMatrix;
    this.initialStateId = initialStateId;
    this.finalStateIds = finalStateIds;
  }

  executeCommand(command: EditCommand): IErrorMessage | undefined {
    const maybeErrorMessage = command.execute();
    if (maybeErrorMessage === undefined) {
      this.commandHistory.push(command);
    }
    return maybeErrorMessage;
  }

  undo(): IErrorMessage | undefined {
    const command = this.commandHistory.pop();
    if (command) {
      command.undo();
    } else {
      return new ErrorMessage("Cannot undo because command history is empty.");
    }
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

  createRunSimulation(word: string[]): ISimulation {
    switch (this.automatonType) {
      case AutomatonType.FINITE:
        return new Simulation(this, new FiniteConfiguration(this.initialStateId, word));
      case AutomatonType.PDA:
        // TODO what is initial stack symbol?
        return new Simulation(this, new PDAConfiguration(this.initialStateId, word, ["Z"]));
      case AutomatonType.TURING:
        // TODO
        throw new Error("Not implemented.");
    }
  }
}

export interface IAutomatonMemento {
  states: string[];
  deltaFunctionMatrix: Record<string, Record<string, IEdge[]>>;
  automatonType: AutomatonType;
}

export class AutomatonMemento implements IAutomatonMemento {
  states: string[];
  automatonType: AutomatonType;
  deltaFunctionMatrix: Record<string, Record<string, Array<IEdge>>>;

  constructor(
    _states: string[],
    _deltaFunctionMatrix: Record<string, Record<string, Array<IEdge>>>,
    _automatonType: AutomatonType
  ) {
    this.states = _states;
    this.deltaFunctionMatrix = _deltaFunctionMatrix;
    this.automatonType = _automatonType;
  }
}

import { INITIAL_STACK_SYMBOL } from "../../constants.ts";
import { ErrorMessage, IErrorMessage } from "../common.ts";
import { AutomatonEditCommand } from "./commands/edit.ts";
import { FiniteConfiguration, PDAConfiguration } from "./configuration.ts";
import { FiniteAutomatonEdge, IEdge, PDAEdge } from "./edge.ts";
import { IAutomatonSimulation, AutomatonSimulation } from "./simulation.ts";

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

  commandHistory: AutomatonEditCommand[];
  executeCommand(command: AutomatonEditCommand): IErrorMessage | undefined; // if (command.execute()) { commandHistory.push(command); }
  undo(): IErrorMessage | undefined; // command = commandHistory.pop(); command.undo();

  save(): IAutomatonMemento;
  restore(memento: IAutomatonMemento): void;

  createRunSimulation(word: string[]): IAutomatonSimulation;
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
  commandHistory: AutomatonEditCommand[];
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

  executeCommand(command: AutomatonEditCommand): IErrorMessage | undefined {
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
      this.states, this.deltaFunctionMatrix, this.automatonType, this.initialStateId, this.finalStateIds
    );
  }
  restore(memento: IAutomatonMemento): void {
    this.states = memento.states;
    this.deltaFunctionMatrix = memento.deltaFunctionMatrix;
    this.automatonType = memento.automatonType;
    this.initialStateId = memento.initialStateId;
    this.finalStateIds = memento.finalStateIds;
  }

  createRunSimulation(word: string[]): IAutomatonSimulation {
    switch (this.automatonType) {
      case AutomatonType.FINITE:
        return new AutomatonSimulation(this, new FiniteConfiguration(this.initialStateId, word));
      case AutomatonType.PDA:
        return new AutomatonSimulation(this, new PDAConfiguration(this.initialStateId, word, [INITIAL_STACK_SYMBOL]));
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
  initialStateId: string;
  finalStateIds: string[];
}

export class AutomatonMemento implements IAutomatonMemento {
  states: string[];
  automatonType: AutomatonType;
  deltaFunctionMatrix: Record<string, Record<string, Array<IEdge>>>;
  initialStateId: string;
  finalStateIds: string[];

  constructor(
    _states: string[],
    _deltaFunctionMatrix: Record<string, Record<string, Array<IEdge>>>,
    _automatonType: AutomatonType,
    _initialStateId: string,
    _finalStateIds: string[]
  ) {
    this.states = [..._states];
    this.automatonType = _automatonType;
    this.initialStateId = _initialStateId;
    this.finalStateIds = [..._finalStateIds];

    const deltaCopy: Record<string, Record<string, Array<IEdge>>> = {};
    for (const fromState in _deltaFunctionMatrix) {
      deltaCopy[fromState] = {};

      for (const toState in _deltaFunctionMatrix[fromState]) {
        deltaCopy[fromState][toState] = [];

        for (const i in _deltaFunctionMatrix[fromState][toState]) {
          const edge = _deltaFunctionMatrix[fromState][toState][i];

          if (edge instanceof FiniteAutomatonEdge) {
            deltaCopy[fromState][toState].push(new FiniteAutomatonEdge(edge.id, edge.inputChar));
          }
          if (edge instanceof PDAEdge) {
            deltaCopy[fromState][toState].push(new PDAEdge(edge.id, edge.inputChar, edge.readStackChar, edge.writeStackWord));
          }
        }
      }
    }

    this.deltaFunctionMatrix = deltaCopy;
  }
}

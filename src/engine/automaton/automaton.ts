import { EPSILON, INITIAL_STACK_SYMBOL } from "../../constants.ts";
import { ErrorMessage, IErrorMessage } from "../common.ts";
import { AutomatonEditCommand } from "./commands/edit.ts";
import { FiniteConfiguration, NFAConfiguration, NPDAConfiguration, PDAConfiguration } from "./configuration.ts";
import { FiniteAutomatonEdge, IEdge, PDAEdge } from "./edge.ts";
import { IAutomatonSimulation, AutomatonSimulation } from "./simulation.ts";
import { cloneDeep } from "lodash";

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

  isDeterministic(): boolean {
    const alphabet = new Set<string> ([]);
    const stackAlphabet = new Set<string> ([]);

    if (this.automatonType == AutomatonType.PDA) {
      stackAlphabet.add(INITIAL_STACK_SYMBOL);
    }

    // goes through the entire deltaFunctionMatrix and add all the alphabet symbol to the alphabet (same for stack symbols)
    for (const leftSymbol in this.deltaFunctionMatrix) {
      for (const rightSymbol in this.deltaFunctionMatrix[leftSymbol]) {
        const edges = this.deltaFunctionMatrix[leftSymbol][rightSymbol];
        for (const edge of edges) {
          alphabet.add(edge.inputChar);
          if (this.automatonType == AutomatonType.PDA && edge instanceof PDAEdge) {
            stackAlphabet.add(edge.readStackChar);
            for (const symbol of edge.writeStackWord) {
              stackAlphabet.add(symbol);
            }
          }
        }
      }
    }
    // if there is Epsilon it is non-deterministic
    if (alphabet.has(EPSILON)) {
      return false;
    }
    // if any state has no edges in deltafunction, automaton is non-deterministic
    if (this.states.length != Object.keys(this.deltaFunctionMatrix).length) {
      return false;
    }
    switch (this.automatonType) {
      case AutomatonType.FINITE:
        // now, for each node we go through the deltaMatrix a second time and for each edge we check
        // if all the symbols are present and if the number of edges
        // equals this number, therefore we check if each edge is used only once
        for (const leftSymbol in this.deltaFunctionMatrix) {
          const found = new Set<string> ([]);
          let edgeNum = 0;

          for (const rightSymbol in this.deltaFunctionMatrix[leftSymbol]) {
            const edges = this.deltaFunctionMatrix[leftSymbol][rightSymbol];
            edgeNum += edges.length;
            for (const edge of edges) {
              if (edge instanceof FiniteAutomatonEdge) {
                found.add(edge.inputChar);
              }
              else {
                throw new Error("Finite automaton has non-finite edge");
              }
            }
          }
          if (edgeNum != found.size || edgeNum != alphabet.size) {
            return false;
          }
        }
        return true;

      case AutomatonType.PDA:
        // Same as before only now we compare the number of unique alpha-stack combinations and actual edges
        // and number of actual edges to all combinations (alphabet.size x stackAlphabet.size)
        for (const leftSymbol in this.deltaFunctionMatrix) {
          const found: Record<string, Set<string>> = {};
          let edgeNum = 0;

          for (const rightSymbol in this.deltaFunctionMatrix[leftSymbol]) {
            const edges = this.deltaFunctionMatrix[leftSymbol][rightSymbol];
            edgeNum += edges.length;
            for (const edge of edges) {
              if (edge instanceof PDAEdge) {
                if (found[edge.inputChar] === undefined) {
                  found[edge.inputChar] = new Set<string> ([]);
                }
                found[edge.inputChar].add(edge.readStackChar);
              }
              else {
                throw new Error("PDA has non-PDA edge");
              }
            }
          }
          let uniqueEdges = 0;
          for (const s in found) {
            uniqueEdges = uniqueEdges + found[s].size;
          }

          if (edgeNum != uniqueEdges || edgeNum != alphabet.size * stackAlphabet.size) {
            return false;
          }
        }

        return true;
    }
    return false;
  }

  createRunSimulation(word: string[]): IAutomatonSimulation {
    const det = this.isDeterministic();
    if (det) {
      switch (this.automatonType) {
        case AutomatonType.FINITE:
          return new AutomatonSimulation(this, new FiniteConfiguration(this.initialStateId, word));
        case AutomatonType.PDA:
          return new AutomatonSimulation(this, new PDAConfiguration(this.initialStateId, word, [INITIAL_STACK_SYMBOL]));
        case AutomatonType.TURING:
          throw new Error("Not implemented.");
      }
    }
    else {
      switch (this.automatonType) {
        case AutomatonType.FINITE:
          return new AutomatonSimulation(this, new NFAConfiguration(this.initialStateId, word));
        case AutomatonType.PDA:
          return new AutomatonSimulation(this, new NPDAConfiguration(this.initialStateId, word, [INITIAL_STACK_SYMBOL]));
        case AutomatonType.TURING:
          throw new Error("Not implemented.");
      }
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
    this.deltaFunctionMatrix = cloneDeep(_deltaFunctionMatrix);
  }
}

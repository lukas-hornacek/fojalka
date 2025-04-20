import { SECONDARY_CYTOSCAPE_ID, EPSILON, INITIAL_STATE } from "../constants";
import { AutomatonCore } from "../core/automatonCore";
import { ICoreType, Kind, ModeHolder } from "../core/core";
import { AutomatonType } from "./automaton/automaton";
import { AddEdgeCommand, AddStateCommand, AutomatonEditCommand, RemoveEdgeCommand, RenameStateCommand, SetStateFinalFlagCommand } from "./automaton/commands/edit";
import { IErrorMessage, ErrorMessage } from "./common";
import { GrammarEditCommand } from "./grammar/commands/edit";
import { GrammarType } from "./grammar/grammar";

export type AlgorithmParams = {
  Kind: Kind,
  AutomatonType?: AutomatonType,
  GrammarType?: GrammarType,
};

export type AlgorithmResult = {
  highlight: string[],
  command: AutomatonEditCommand | GrammarEditCommand,
};

// each algorithm has constructor that takes object of input type (taken from core.primary)
// if outputType is not undefined, init() creates new Core, stores it (to keep access to createEdge()) and also returns it for core.secondary
//
// next() returns IDs of objects to be highlighted in the primary window and EditCommand for the secondary window
// if outputType is undefined, highlights are always empty
export interface IAlgorithm {
  inputType: AlgorithmParams,
  // if undefined, modifications are done in place and there is no highlighting
  outputType?: AlgorithmParams,

  init(mode: ModeHolder): ICoreType | undefined,
  // returns undefined when algorithm is completed
  next(): AlgorithmResult | undefined,
  undo(): IErrorMessage | undefined,
}

// TODO remove this
export class TestingAlgorithm implements IAlgorithm {
  inputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };
  outputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };

  init(mode: ModeHolder): ICoreType | undefined {
    return new AutomatonCore(this.outputType.AutomatonType!, SECONDARY_CYTOSCAPE_ID, mode);
  }

  next(): AlgorithmResult | undefined {
    return;
  }

  undo(): IErrorMessage | undefined {
    return;
  }
}

export class NondeterministicToDeterministicAlgorithm implements IAlgorithm {
  inputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };
  outputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };

  inputCore: AutomatonCore;
  outputCore?: AutomatonCore;

  results: AlgorithmResult[] = [];
  index: number = 0;

  constructor(_inputCore: AutomatonCore) {
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder) {
    if (this.inputCore.automaton.automatonType !== this.inputType.AutomatonType) {
      throw new Error("Cannot use algorithm, as it only works with finite automata.");
    }
    if (this.hasEpsilonTransitions()) {
      throw new Error("Cannot use algorithm, as the input automaton has epsilon transitions.");
    }

    this.outputCore = new AutomatonCore(AutomatonType.FINITE, SECONDARY_CYTOSCAPE_ID, mode);
    this.precomputeResults();

    return this.outputCore;
  }

  next() {
    if (this.outputCore === undefined) {
      throw new Error("Cannot simulate algorithm step before start.");
    }
    //algorithm has already ended
    if (this.index === this.results.length) {
      return undefined;
    }

    return this.results[this.index++];
  }

  undo() {
    if (this.outputCore === undefined) {
      return new ErrorMessage("Cannot undo algorithm step before start.");
    }
    if (this.index === 0) {
      return new ErrorMessage("There is nothing to undo.");
    }

    this.outputCore.automaton.undo();
    this.index--;
  }

  //function computes all commands and highlits in advance and stores it in results
  precomputeResults() {
    const visited: string[][] = [];
    const notProcessed: string[][] = [];
    const initialState: string[] = [];
    initialState.push(this.inputCore.automaton.initialStateId);
    notProcessed.push(initialState);
    visited.push(initialState);

    //getting an alphabet for the input automaton
    const alphabet: string[] = [];
    const delta = this.inputCore.automaton.deltaFunctionMatrix;
    for (const fromState in delta) {
      for (const toState in delta[fromState]) {
        for (const edge of delta[fromState][toState]) {
          if (!alphabet.includes(edge.inputChar)) {
            alphabet.push(edge.inputChar);
          }
        }
      }
    }

    //renaming initial state to a set containing the state
    this.results = [];
    let currentCommand: AutomatonEditCommand = new RenameStateCommand(this.outputCore!.automaton, INITIAL_STATE, this.stateToString(initialState));
    let stateHiglight: string[] = [this.inputCore.automaton.initialStateId];
    this.results.push({ highlight: stateHiglight, command: currentCommand });

    //setting initial state as final if it was final originally
    if (this.inputCore.automaton.finalStateIds.includes(this.inputCore.automaton.initialStateId)) {
      currentCommand = new SetStateFinalFlagCommand(this.outputCore!.automaton, this.stateToString(initialState), true);
      this.results.push({ highlight: stateHiglight, command: currentCommand });
    }

    while (notProcessed.length !== 0) {
      const currentState: string[] = notProcessed.pop()!;

      for (const symbol of alphabet) {
        const newState: string[] = [];
        const edgeHiglight = [];

        //construct new state as set of states that we can get to from current state with the symbol
        for (const fromState of currentState) {
          for (const toState in delta[fromState]) {
            for (const edge of delta[fromState][toState]) {
              if (edge.inputChar === symbol) {
                if (!newState.includes(toState)) { newState.push(toState); }
                edgeHiglight.push(edge.id);
              }
            }
          }
        }
        stateHiglight = newState;

        //add new state if it hasnt been added before
        if (!visited.some(state => this.equalState(state, newState))) {
          visited.push(newState);
          notProcessed.push(newState);

          currentCommand = new AddStateCommand(this.outputCore!.automaton, this.stateToString(newState));
          this.results.push({ highlight: stateHiglight, command: currentCommand });

          if (this.inputCore.automaton.finalStateIds.some(id => newState.includes(id))) {
            currentCommand = new SetStateFinalFlagCommand(this.outputCore!.automaton, this.stateToString(newState), true);
            this.results.push({ highlight: stateHiglight, command: currentCommand });
          }
        }

        //add edge to new state
        const newEdge = this.outputCore!.createEdge({ id:"", inputChar: symbol });
        currentCommand = new AddEdgeCommand(this.outputCore!.automaton, this.stateToString(currentState), this.stateToString(newState), newEdge);
        this.results.push({ highlight: edgeHiglight, command: currentCommand });
      }
    }

  }

  stateToString(state: string[]): string {
    return "{" + state.join() + "}";
  }

  equalState(state1: string[], state2: string[]): boolean {
    if (state1.length !== state2.length) {
      return false;
    }

    return state1.every(id => state2.includes(id));
  }

  hasEpsilonTransitions(): boolean {
    const delta = this.inputCore.automaton.deltaFunctionMatrix;
    for (const fromState in delta) {
      for (const toState in delta[fromState]) {
        if (delta[fromState][toState].some(edge => edge.inputChar === EPSILON)) {
          return true;
        }
      }
    }

    return false;
  }

}

export class RemoveEpsilonAlgorithm implements IAlgorithm {
  inputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };
  outputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };

  inputCore: AutomatonCore;
  outputCore?: AutomatonCore;

  results?: AlgorithmResult[];
  index: number = 0;

  constructor(_inputCore: AutomatonCore) {
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder) {
    if (this.inputCore.automaton.automatonType !== this.inputType.AutomatonType) {
      throw new Error("Cannot use algorithm, as it only works with finite automata.");
    }
    if (this.hasEpsilonTransitions()) {
      this.precomputeResults();
    } else {
      this.results = [];
    }
    this.outputCore = new AutomatonCore(AutomatonType.FINITE, SECONDARY_CYTOSCAPE_ID, mode);

    return undefined;
  }

  next() {
    if (this.results === undefined) {
      throw new Error("Cannot simulate algorithm step before start.");
    }
    //algorithm has already ended
    if (this.index === this.results.length) {
      return undefined;
    }

    return this.results[this.index++];
  }

  undo() {
    if (this.results === undefined) {
      return new ErrorMessage("Cannot undo algorithm step before start.");
    }
    if (this.index === 0) {
      return new ErrorMessage("There is nothing to undo.");
    }

    this.inputCore.automaton.undo();
    this.index--;
  }

  //function computes all commands and highlits in advance and stores it in results
  precomputeResults() {
    this.results = [];
    const epsilonTails: Record<string, string[]> = {};
    const delta = this.inputCore.automaton.deltaFunctionMatrix;
    const addedEdges: string[][] = [];

    //computing epsilon tails for all states
    const stack: string[] = [];
    for (const state of this.inputCore.automaton.states) {
      epsilonTails[state] = [state];
      stack.push(state);

      while (stack.length !== 0) {
        const currentState: string = stack.pop()!;

        for (const newState in delta[currentState]) {
          if (!epsilonTails[state].includes(newState) && delta[currentState][newState].some(edge => edge.inputChar === EPSILON)) {
            stack.push(newState);
            epsilonTails[state].push(newState);
          }
        }
      }
    }

    //getting an alphabet for the input automaton
    const alphabet: string[] = [];
    for (const fromState in delta) {
      for (const toState in delta[fromState]) {
        for (const edge of delta[fromState][toState]) {
          if (!alphabet.includes(edge.inputChar) && edge.inputChar !== EPSILON) {
            alphabet.push(edge.inputChar);
          }
        }
      }
    }

    //removing edges with epsilon
    for (const fromState in delta) {
      for (const toState in delta[fromState]) {
        for (const edge of delta[fromState][toState]) {
          if (edge.inputChar === EPSILON) {
            const command = new RemoveEdgeCommand(this.inputCore.automaton, fromState, toState, edge.id);
            this.results.push({ highlight: [], command: command });
          }
        }
      }
    }

    //addind transitions to states expept initial state
    for (const state of this.inputCore.automaton.states) {
      if (state !== this.inputCore.automaton.initialStateId) {
        for (const symbol of alphabet) {
          const endStates = this.getEndStates(state, symbol, epsilonTails);

          for (const newState of endStates) {
            if (delta[state][newState] === undefined || !delta[state][newState].some(edge => edge.inputChar === symbol)) {
              if (!addedEdges.some(edge => edge[0] === state && edge[1] === newState && edge[2] === symbol)) {
                const edge = this.inputCore.createEdge({ id: "", inputChar: symbol });
                const command = new AddEdgeCommand(this.inputCore.automaton, state, newState, edge);
                this.results.push({ highlight: [], command: command });
                addedEdges.push([state, newState, symbol]);
              }
            }
          }
        }
      }
    }

    //adding transitions to initial state
    for (const symbol of alphabet) {
      for (const state of epsilonTails[this.inputCore.automaton.initialStateId]) {
        const endStates = this.getEndStates(state, symbol, epsilonTails);

        for (const newState of endStates) {
          if (delta[this.inputCore.automaton.initialStateId][newState] === undefined || !delta[this.inputCore.automaton.initialStateId][newState].some(edge => edge.inputChar === symbol)) {
            if (!addedEdges.some(edge => edge[0] === this.inputCore.automaton.initialStateId && edge[1] === newState && edge[2] === symbol)) {
              const edge = this.inputCore.createEdge({ id: "", inputChar: symbol });
              const command = new AddEdgeCommand(this.inputCore.automaton, this.inputCore.automaton.initialStateId, newState, edge);
              this.results.push({ highlight: [], command: command });
              addedEdges.push([this.inputCore.automaton.initialStateId, newState, symbol]);
            }
          }
        }
      }
    }

    //setting initial state as final if it has final state in epsilon tail
    if (epsilonTails[this.inputCore.automaton.initialStateId].some(state => this.inputCore.automaton.finalStateIds.includes(state))) {
      const command = new SetStateFinalFlagCommand(this.inputCore.automaton, this.inputCore.automaton.initialStateId, true);
      this.results.push({ highlight: [], command: command });
    }
  }

  hasEpsilonTransitions(): boolean {
    const delta = this.inputCore.automaton.deltaFunctionMatrix;
    for (const fromState in delta) {
      for (const toState in delta[fromState]) {
        if (delta[fromState][toState].some(edge => edge.inputChar === EPSILON)) {
          return true;
        }
      }
    }

    return false;
  }

  //returns set of states that are in epsilon tail of some state 'q', that is accesible from state 'state' on symbol 'symbol'
  getEndStates(state: string, symbol: string, epsilonTails: Record<string, string[]>): string[] {
    const endStates: string[] = [];
    for (const nextState in this.inputCore.automaton.deltaFunctionMatrix[state]) {
      for (const edge of this.inputCore.automaton.deltaFunctionMatrix[state][nextState]) {
        if (edge.inputChar === symbol) {
          for (const newState of epsilonTails[nextState]) {
            if (!endStates.includes(newState)) {
              endStates.push(newState);
            }
          }
        }
      }
    }

    return endStates;
  }

}

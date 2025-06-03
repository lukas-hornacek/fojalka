import { SECONDARY_CYTOSCAPE_ID, EPSILON, INITIAL_STATE } from "../../constants";
import { AutomatonCore, IAutomatonCore } from "../../core/automatonCore";
import { Kind, ModeHolder } from "../../core/core";
import { GrammarCore, IGrammarCore } from "../../core/grammarCore";
import { AutomatonType } from "./../automaton/automaton";
import { AddEdgeCommand, AddStateCommand, AutomatonEditCommand, RemoveEdgeCommand, RenameStateCommand, SetStateFinalFlagCommand } from "../automaton/commands/edit";
import { ErrorMessage } from "../common";
import { AddProductionRuleCommand } from "../grammar/commands/edit";
import { GrammarType } from "../grammar/grammar";
import { Algorithm, AlgorithmParams } from "./algorithm";

export class NondeterministicToDeterministicAlgorithm extends Algorithm {
  inputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };
  outputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };

  inputCore: IAutomatonCore;
  outputCore?: IAutomatonCore;

  constructor(_inputCore: IAutomatonCore) {
    super();
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder) {
    if (this.inputCore.automaton.automatonType !== this.inputType.AutomatonType) {
      throw new Error("Cannot use algorithm, as it only works with finite automata.");
    }
    if (this.hasEpsilonTransitions()) {
      throw new Error("Cannot use algorithm, as the input automaton has epsilon transitions.");
    }
    if (!this.isContinuous()) {
      throw new Error("Cannot use algorithm, as some of the states are not reachable from the ititial state.");
    }

    this.outputCore = new AutomatonCore(AutomatonType.FINITE, SECONDARY_CYTOSCAPE_ID, mode);
    this.precomputeResults();

    return this.outputCore;
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
    state.sort();
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

  isContinuous(): boolean {
    const visited: string[] = [this.inputCore.automaton.initialStateId];
    const notProcessed: string[] = [this.inputCore.automaton.initialStateId];

    while (notProcessed.length !== 0) {
      const current: string = notProcessed.pop()!;

      for (const state in this.inputCore.automaton.deltaFunctionMatrix[current]) {
        if (!visited.includes(state)) {
          visited.push(state);
          notProcessed.push(state);
        }
      }
    }

    return visited.length === this.inputCore.automaton.states.length;
  }
}

export class RemoveEpsilonAlgorithm extends Algorithm {
  inputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };
  outputType?: AlgorithmParams = undefined;

  inputCore: IAutomatonCore;

  //only for the mode in init, so it wont be unused variable
  outputCore?: IAutomatonCore;

  constructor(_inputCore: IAutomatonCore) {
    super();
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

    //TODO - we need to decide if we want this or we always want second window
    this.outputCore = new AutomatonCore(AutomatonType.FINITE, SECONDARY_CYTOSCAPE_ID, mode);

    return undefined;
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

  precomputeResults() {
    this.results = [];
    const epsilonTails: Record<string, string[]> = {};
    const addedEdges: string[][] = [];

    const delta = this.inputCore.automaton.deltaFunctionMatrix;
    const initial = this.inputCore.automaton.initialStateId;

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

    //addind transitions from states except the initial state
    for (const state of this.inputCore.automaton.states) {
      if (state !== initial) {
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

    //adding transitions from the initial state
    for (const symbol of alphabet) {
      for (const state of epsilonTails[initial]) {
        const endStates = this.getEndStates(state, symbol, epsilonTails);

        for (const newState of endStates) {
          if (delta[initial][newState] === undefined || !delta[initial][newState].some(edge => edge.inputChar === symbol)) {
            if (!addedEdges.some(edge => edge[0] === initial && edge[1] === newState && edge[2] === symbol)) {
              const edge = this.inputCore.createEdge({ id: "", inputChar: symbol });
              const command = new AddEdgeCommand(this.inputCore.automaton, initial, newState, edge);
              this.results.push({ highlight: [], command: command });
              addedEdges.push([initial, newState, symbol]);
            }
          }
        }
      }
    }

    //setting initial state as final if it has final state in its epsilon tail
    if (epsilonTails[initial].some(state => this.inputCore.automaton.finalStateIds.includes(state))) {
      const command = new SetStateFinalFlagCommand(this.inputCore.automaton, initial, true);
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

export class AutomatonToGrammarAlgorithm extends Algorithm {
  inputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };
  outputType: AlgorithmParams = { Kind: Kind.GRAMMAR, GrammarType: GrammarType.REGULAR };

  inputCore: IAutomatonCore;
  outputCore?: IGrammarCore;

  constructor(_inputCore: IAutomatonCore) {
    super();
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder) {
    if (this.inputCore.automaton.automatonType !== this.inputType.AutomatonType) {
      throw new Error("Cannot use algorithm, as it only works with finite automata.");
    }

    this.outputCore = new GrammarCore(GrammarType.REGULAR, mode);

    this.precomputeResults();

    return this.outputCore;
  }

  undo() {
    if (this.outputCore === undefined) {
      return new ErrorMessage("Cannot undo algorithm step before start.");
    }
    if (this.index === 0) {
      return new ErrorMessage("There is nothing to undo.");
    }

    this.outputCore.grammar.undo();
    this.index--;
  }

  precomputeResults() {
    this.results = [];
    const delta = this.inputCore.automaton.deltaFunctionMatrix;

    //assign correct nonterminal and terminal symbols to grammar
    this.outputCore!.grammar.nonTerminalSymbols = [...this.inputCore.automaton.states];
    this.outputCore!.grammar.terminalSymbols = this.getAlphabet();
    this.outputCore!.grammar.initialNonTerminalSymbol = this.inputCore.automaton.initialStateId;

    //for every edge add rule from one state to a word consisting of the symbol and the other state
    for (const from in delta) {
      for (const to in delta[from]) {
        for (const edge of delta [from][to]) {
          let output = [];
          if (edge.inputChar === EPSILON) {
            output = [to];
          } else {
            output = [edge.inputChar, to];
          }
          const rule = this.outputCore!.factory.createProductionRule(from, output, this.outputCore!.grammar);
          const command = new AddProductionRuleCommand(this.outputCore!.grammar, rule);
          this.results.push({ highlight: [edge.id, from, to], command: command });
        }
      }
    }

    //for every final state add rule from that state to epsilon
    for (const state of this.inputCore.automaton.finalStateIds) {
      const rule = this.outputCore!.factory.createProductionRule(state, [EPSILON], this.outputCore!.grammar);
      const command = new AddProductionRuleCommand(this.outputCore!.grammar, rule);
      this.results.push({ highlight: [state], command: command });
    }
  }

  getAlphabet() {
    const delta = this.inputCore.automaton.deltaFunctionMatrix;

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

    return alphabet;
  }
}

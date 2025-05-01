import { SECONDARY_CYTOSCAPE_ID, EPSILON, INITIAL_STATE } from "../constants";
import { AutomatonCore } from "../core/automatonCore";
import { ICoreType, Kind, ModeHolder } from "../core/core";
import { GrammarCore } from "../core/grammarCore";
import { AutomatonType } from "./automaton/automaton";
import { AddEdgeCommand, AddStateCommand, AutomatonEditCommand, RemoveEdgeCommand, RenameStateCommand, SetStateFinalFlagCommand } from "./automaton/commands/edit";
import { IErrorMessage, ErrorMessage } from "./common";
import { AddProductionRuleCommand, GrammarEditCommand } from "./grammar/commands/edit";
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

  //only for the mode in init, so it wont be unused variable
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

    //TODO - we need to decide if we want this or we always want second window
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

export class AutomatonToGrammarAlgorithm implements IAlgorithm {
  inputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };
  outputType: AlgorithmParams = { Kind: Kind.GRAMMAR, GrammarType: GrammarType.REGULAR };

  inputCore: AutomatonCore;
  outputCore?: GrammarCore;

  results: AlgorithmResult[] = [];
  index: number = 0;

  constructor(_inputCore: AutomatonCore) {
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder) {
    if (this.inputCore.automaton.automatonType !== this.inputType.AutomatonType) {
      throw new Error("Cannot use algorithm, as it only works with finite automata.");
    }

    this.outputCore = new GrammarCore(GrammarType.REGULAR, mode);
    //assign correct nonterminal and terminal symbols to grammar
    this.outputCore.grammar.nonTerminalSymbols = this.inputCore.automaton.states;
    this.outputCore.grammar.terminalSymbols = this.getAlphabet();
    this.outputCore.grammar.initialNonTerminalSymbol = this.inputCore.automaton.initialStateId;

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

    this.outputCore.grammar.undo();
    this.index--;
  }

  //function computes all commands and highlights in advance and stores it in results
  precomputeResults() {
    const delta = this.inputCore.automaton.deltaFunctionMatrix;

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
          this.results.push({ highlight: [edge.id], command: command });
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

export class GrammarToAutomatonAlgorithm implements IAlgorithm {
  inputType: AlgorithmParams = { Kind: Kind.GRAMMAR, GrammarType: GrammarType.REGULAR };
  outputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };

  inputCore: GrammarCore;
  outputCore?: AutomatonCore;

  results: AlgorithmResult[] = [];
  index: number = 0;

  constructor(_inputCore: GrammarCore) {
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder) {
    if (this.inputCore.grammar.grammarType !== this.inputType.GrammarType) {
      throw new Error("Cannot use algorithm, as it only works with regular grammars.");
    }
    if (!this.isGrammarInNormalForm()) {
      throw new Error("Cannot use algorithm, as the grammar is not in required normal form.");
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

  //function computes all commands and highlights in advance and stores it in results
  precomputeResults() {
    let currentCommand: AutomatonEditCommand = new RenameStateCommand(this.outputCore!.automaton, INITIAL_STATE, this.inputCore.grammar.initialNonTerminalSymbol);
    this.results.push({ highlight: [this.inputCore.grammar.initialNonTerminalSymbol], command: currentCommand });

    for (const nonterminal of this.inputCore.grammar.nonTerminalSymbols) {
      if (nonterminal !== this.inputCore.grammar.initialNonTerminalSymbol) {
        currentCommand = new AddStateCommand(this.outputCore!.automaton, nonterminal);
        this.results.push({ highlight: [nonterminal], command: currentCommand });
      }
    }

    currentCommand = new AddStateCommand(this.outputCore!.automaton, "fin");
    this.results.push({ highlight: [], command: currentCommand });

    currentCommand = new SetStateFinalFlagCommand(this.outputCore!.automaton, "fin", true);
    this.results.push({ highlight: [], command: currentCommand });

    for (const rule of this.inputCore.grammar.productionRules) {
      if (rule.outputSymbols.length === 2) {
        const edge = this.outputCore!.createEdge({ id: "", inputChar: rule.outputSymbols[0] });
        currentCommand = new AddEdgeCommand(this.outputCore!.automaton, rule.inputNonTerminal, rule.outputSymbols[1], edge);
      }
      else if (this.inputCore.grammar.hasNonTerminalSymbol(rule.outputSymbols[0])) {
        const edge = this.outputCore!.createEdge({ id: "", inputChar: EPSILON });
        currentCommand = new AddEdgeCommand(this.outputCore!.automaton, rule.inputNonTerminal, rule.outputSymbols[0], edge);
      }
      else {
        const edge = this.outputCore!.createEdge({ id: "", inputChar: rule.outputSymbols[0] });
        currentCommand = new AddEdgeCommand(this.outputCore!.automaton, rule.inputNonTerminal, "fin", edge);
      }
      this.results.push({ highlight: [rule.id], command: currentCommand });
    }
  }

  //function checks if all rules in grammar have at most one terminal on the right side and length of the right side at most 2
  isGrammarInNormalForm() {
    for (const rule of this.inputCore.grammar.productionRules) {
      if (rule.outputSymbols.length > 2) {
        return false;
      }
      if (rule.outputSymbols.length == 2 && !this.inputCore.grammar.hasNonTerminalSymbol(rule.outputSymbols[1])) {
        return false;
      }
    }

    return true;
  }
}

export class GrammarNormalFormAlgorithm implements IAlgorithm {
  inputType: AlgorithmParams = { Kind: Kind.GRAMMAR, GrammarType: GrammarType.REGULAR };
  outputType: AlgorithmParams = { Kind: Kind.GRAMMAR, GrammarType: GrammarType.REGULAR };

  inputCore: GrammarCore;
  outputCore?: GrammarCore;

  results: AlgorithmResult[] = [];
  index: number = 0;

  constructor(_inputCore: GrammarCore) {
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder) {
    if (this.inputCore.grammar.grammarType !== this.inputType.GrammarType) {
      throw new Error("Cannot use algorithm, as it only works with regular grammars.");
    }

    this.outputCore = new GrammarCore(GrammarType.REGULAR, mode);

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

    this.outputCore.grammar.undo();
    this.index--;
  }

  //function computes all commands and highlights in advance and stores it in results
  precomputeResults() {
    this.outputCore!.grammar.nonTerminalSymbols = this.inputCore.grammar.nonTerminalSymbols;
    this.outputCore!.grammar.terminalSymbols = this.inputCore.grammar.terminalSymbols;
    this.outputCore!.grammar.initialNonTerminalSymbol = this.inputCore.grammar.initialNonTerminalSymbol;

    let id = 1;
    for (const rule of this.inputCore.grammar.productionRules) {
      const lastOutputSymbol = rule.outputSymbols.slice(-1)[0];

      if (rule.outputSymbols.length > 2 || rule.outputSymbols.length === 2 && this.inputCore.grammar.hasTerminalSymbol(lastOutputSymbol)) {
        const prefixOutputSymbols = rule.outputSymbols.slice(0, -2);
        let input = rule.inputNonTerminal;
        let i = 1;

        for (const symbol of prefixOutputSymbols) {
          const newSymbol = "ψ" + id + "," + i;
          this.outputCore!.grammar.nonTerminalSymbols.push(newSymbol);

          const newRule = this.outputCore!.factory.createProductionRule(input, [symbol, newSymbol], this.outputCore!.grammar);
          const command = new AddProductionRuleCommand(this.outputCore!.grammar, newRule);
          this.results.push({ highlight: [rule.id], command: command });

          input = newSymbol;
          i++;
        }

        if (this.inputCore.grammar.hasTerminalSymbol(lastOutputSymbol)) {
          const newSymbol = "ψ" + id + "," + i;
          this.outputCore!.grammar.nonTerminalSymbols.push(newSymbol);

          let newRule = this.outputCore!.factory.createProductionRule(input, [rule.outputSymbols[-2], newSymbol], this.outputCore!.grammar);
          let command = new AddProductionRuleCommand(this.outputCore!.grammar, newRule);
          this.results.push({ highlight: [rule.id], command: command });

          newRule = this.outputCore!.factory.createProductionRule(newSymbol, [rule.outputSymbols[-1]], this.outputCore!.grammar);
          command = new AddProductionRuleCommand(this.outputCore!.grammar, newRule);
          this.results.push({ highlight: [rule.id], command: command });
        }
        else {
          const newRule = this.outputCore!.factory.createProductionRule(input, [rule.outputSymbols[-2], rule.outputSymbols[-1]], this.outputCore!.grammar);
          const command = new AddProductionRuleCommand(this.outputCore!.grammar, newRule);
          this.results.push({ highlight: [rule.id], command: command });
        }

        id++;
      }
      else {
        const command = new AddProductionRuleCommand(this.outputCore!.grammar, rule);
        this.results.push({ highlight: [rule.id], command: command });
      }
    }
  }
}


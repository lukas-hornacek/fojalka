import { SECONDARY_CYTOSCAPE_ID, EPSILON } from "../constants";
import { AutomatonCore } from "../core/automatonCore";
import { ICoreType, Kind, ModeHolder } from "../core/core";
import { AutomatonType } from "./automaton/automaton";
import { AddEdgeCommand, AddStateCommand, AutomatonEditCommand, RenameStateCommand, SetStateFinalFlagCommand } from "./automaton/commands/edit";
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

export class NondeterministicToDeterministicAlgorithm implements IAlgorithm{
  inputType: AlgorithmParams = {Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE};
  outputType: AlgorithmParams = {Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE};

  inputCore: AutomatonCore;
  outputCore?: AutomatonCore;

  results?: AlgorithmResult[];
  index: number = 0;

  constructor(_inputCore: AutomatonCore){
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder){
    if(this.inputCore.automaton.automatonType !== this.inputType.AutomatonType){
      throw new Error(`Cannot use algorithm, as it only works with finite automata.`);
    }
    if(this.hasEpsilonTransitions()){
      throw new Error(`Cannot use algorithm, as the input automaton has epsilon transitions.`);
    }

    this.outputCore = new AutomatonCore(AutomatonType.FINITE, SECONDARY_CYTOSCAPE_ID, mode);
    this.precomputeResults();

    return this.outputCore;
  }

  next(){
    if(this.results === undefined){
      return undefined;
    }

    //algorithm has already ended
    if(this.index === this.results.length-1){
      return undefined;
    }
    
    return this.results[this.index++];
  }

  undo(){
    if(this.results === undefined){
      return new ErrorMessage("There is nothing to undo!")
    }
    if(this.index === 0){
      return new ErrorMessage("There is nothing to undo!")
    }
    
    this.inputCore.automaton.undo();
    this.index--;
  }

  precomputeResults(){
    let visited: string[][] = [];
    let notProcessed: string[][] = [];
    let initialState: string[] = [];
    initialState.push(this.inputCore.automaton.initialStateId);
    notProcessed.push(initialState);
    visited.push(initialState);

    //getting an alphabet for the input automaton
    let alphabet: string[] = [];
    for(const fromState in this.inputCore.automaton.deltaFunctionMatrix){
      for(const toState in this.inputCore.automaton.deltaFunctionMatrix[fromState]){
        const edges = this.inputCore.automaton.deltaFunctionMatrix[fromState][toState];
        for(const i in edges){
          if(!alphabet.includes(edges[i].inputChar)){
              alphabet.push(edges[i].inputChar);
          }
        }
      }                
    }

    //renaming initial state to a set containing the state
    this.results = [];
    let currentCommand: AutomatonEditCommand = new RenameStateCommand(this.outputCore!.automaton, this.inputCore.automaton.initialStateId, this.stateToString(initialState));
    let currentHiglight: string[] = [this.inputCore.automaton.initialStateId];
    this.results.push({highlight: currentHiglight, command: currentCommand});

    //setting initial state as final if it was final originally
    if(this.inputCore.automaton.finalStateIds.includes(this.inputCore.automaton.initialStateId)){
      currentCommand = new SetStateFinalFlagCommand(this.outputCore!.automaton, this.stateToString(initialState), true);
      this.results.push({highlight: currentHiglight, command: currentCommand});   
    }

    while(notProcessed.length !== 0){
      let currentState: string[] = notProcessed.pop()!;
      
      for(const symbol in alphabet){
        let newState: string[] = [];
        let edgeHiglight = [];

        for(const fromState in currentState){
          for(const toState in this.inputCore.automaton.deltaFunctionMatrix[fromState]){
            for(const id in this.inputCore.automaton.deltaFunctionMatrix[fromState][toState]){
              if(this.inputCore.automaton.deltaFunctionMatrix[fromState][toState][id].inputChar === symbol){
                newState.push(toState);
                edgeHiglight.push(this.inputCore.automaton.deltaFunctionMatrix[fromState][toState][id].id);
              }
            }
            
          }
        }    
        
        if(!visited.some(state => this.equalState(state, newState))){
          visited.push(newState);
          notProcessed.push(newState);

          currentCommand = new AddStateCommand(this.outputCore!.automaton, this.stateToString(newState));
          this.results.push({highlight: newState, command: currentCommand});

          if(this.inputCore.automaton.finalStateIds.some(id => newState.includes(id))){
            currentCommand = new SetStateFinalFlagCommand(this.outputCore!.automaton, this.stateToString(newState), true);
            this.results.push({highlight: newState, command: currentCommand});
          }
        }

        currentCommand = new AddEdgeCommand(this.outputCore!.automaton, this.stateToString(currentState), this.stateToString(newState), this.outputCore!.createEdge({id:"", inputChar: symbol}));
        this.results.push({highlight: edgeHiglight, command: currentCommand});
      }
    }

  }

  stateToString(state: string[]): string{
    return "{" + state.join() + "}";
  }

  equalState(state1: string[], state2: string[]): boolean{
    if(state1.length !== state2.length){
      return false;
    }

    return state1.every(id => state2.includes(id));
  }

  hasEpsilonTransitions(): boolean{
    for(const fromState in this.inputCore.automaton.deltaFunctionMatrix){
      for(const toState in this.inputCore.automaton.deltaFunctionMatrix[fromState]){
        if(this.inputCore.automaton.deltaFunctionMatrix[fromState][toState].some(edge => (edge.inputChar === EPSILON))){
          return true;
        }
      }                
    }

    return false;
  }

}


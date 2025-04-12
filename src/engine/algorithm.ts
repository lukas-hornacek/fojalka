import { SECONDARY_CYTOSCAPE_ID } from "../constants";
import { AutomatonCore } from "../core/automatonCore";
import { ICoreType, Kind, ModeHolder } from "../core/core";
import { AutomatonType } from "./automaton/automaton";
import { AutomatonEditCommand } from "./automaton/commands/edit";
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
    this.outputCore = new AutomatonCore(AutomatonType.FINITE, SECONDARY_CYTOSCAPE_ID, mode);
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
}


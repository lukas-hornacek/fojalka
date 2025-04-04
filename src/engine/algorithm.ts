import { AutomatonCore } from "../core/automatonCore";
import { ICoreType, Kind } from "../core/core";
import { AutomatonType } from "./automaton/automaton";
import { EditCommand } from "./automaton/commands/edit";
import { IErrorMessage } from "./common";
import { GrammarEditCommand } from "./grammar/commands/edit";
import { GrammarType } from "./grammar/grammar";

export type AlgorithmParams = {
  Kind: Kind,
  AutomatonType?: AutomatonType
  GrammarType?: GrammarType,
};

export type AlgorithmResult = {
  highlight: string[],
  command: EditCommand | GrammarEditCommand,
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

  init(): ICoreType | undefined,
  // returns undefined when algorithm is completed
  next(): AlgorithmResult | undefined,
  undo(): IErrorMessage | undefined,
}

// TODO remove this
export class TestingAlgorithm implements IAlgorithm {
  inputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };
  outputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };

  init(): ICoreType | undefined {
    return new AutomatonCore(this.outputType.AutomatonType!, "cy-secondary");
  }

  next(): AlgorithmResult | undefined {
    return;
  }

  undo(): IErrorMessage | undefined {
    return;
  }
}

import { ErrorMessage, IErrorMessage } from "./common";

export interface IGrammarEngine {
  addProductionRule: (inputNonTerminal: string, outputSymbols: string[]) => IErrorMessage | undefined
}

export class GrammarEngine implements IGrammarEngine {
  addProductionRule(inputNonTerminal: string, outputSymbols: string[]) {
    return new ErrorMessage(`Not implemented. ${inputNonTerminal}, ${outputSymbols.join("")}`);
  }
}

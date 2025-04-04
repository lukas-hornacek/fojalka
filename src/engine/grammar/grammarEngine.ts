import { ICoreType } from "../../core/core";
import { ErrorMessage, IErrorMessage } from "../common";
import { AbstractGrammarFactory, IGrammarFactory } from "./factories";
import { Grammar, GrammarType } from "./grammar";
import { IGrammarSimulation } from "./simulation";

// owns objects related to Grammar part of the Engine and exposes interface to GrammarCore
export interface IGrammarEngine {
  grammar: Grammar

  addProductionRule: (inputNonTerminal: string, outputSymbols: string[]) => IErrorMessage | undefined
  editProductionRule: (id: string, inputNonTerminal: string, outputSymbols: string[]) => IErrorMessage | undefined;
  removeProductionRule: (id: string) => IErrorMessage | undefined;

  undo: () => IErrorMessage | undefined;

  // ??
  simulateParsing: (word: string[]) => unknown
  // takes algorithm enum (or object directly if its not difficult to construct)
  // if applicable, returns new engine that can be put into secondary window
  simulateAlgorithm: () => ICoreType | undefined
}

export class GrammarEngine implements IGrammarEngine {
  factory: IGrammarFactory;
  grammar: Grammar;
  simulation?: IGrammarSimulation;

  constructor(type: GrammarType) {
    this.factory = new AbstractGrammarFactory(type);
    this.grammar = this.factory.createGrammar(["S"], [], "S");
  }

  addProductionRule(inputNonTerminal: string, outputSymbols: string[]) {
    return new ErrorMessage(`Not implemented. ${inputNonTerminal}, ${outputSymbols.join("")}`);
  }

  editProductionRule(id: string, inputNonTerminal: string, outputSymbols: string[]) {
    return new ErrorMessage(`Not implemented. ${id} ${inputNonTerminal}, ${outputSymbols.join("")}`);
  }

  removeProductionRule(id: string) {
    return new ErrorMessage(`Not implemented. ${id}`);
  }

  undo() {
    return this.grammar.undo();
  }

  simulateParsing(word: string[]) {
    return new ErrorMessage(`Not implemented. ${word.join("")}`);
  };

  simulateAlgorithm() {
    return undefined;
  }
}

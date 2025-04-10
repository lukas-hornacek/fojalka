import { INITIAL_NONTERMINAL } from "../constants";
import { IEditCommandVisitor, VisualVisitor } from "../engine/automaton/visitors/editCommand";
import { ErrorMessage, IErrorMessage } from "../engine/common";
import { AbstractGrammarFactory, IGrammarFactory } from "../engine/grammar/factories";
import { Grammar, GrammarType } from "../engine/grammar/grammar";
import { IGrammarSimulation } from "../engine/grammar/simulation";
import { GrammarVisual, IGrammarVisual } from "../visual/grammarVisual";
import { Kind } from "./core";

export interface IGrammarCore {
  kind: Kind.GRAMMAR;
  grammar: Grammar;

  display: () => string;

  addProductionRule: (inputNonTerminal: string, outputSymbols: string[]) => IErrorMessage | undefined
  editProductionRule: (id: string, inputNonTerminal: string, outputSymbols: string[]) => IErrorMessage | undefined;
  removeProductionRule: (id: string) => IErrorMessage | undefined;
  undo: () => IErrorMessage | undefined;

  highlight: (ids: string[]) => IErrorMessage | undefined;

  // ??
  simulateParsing: (word: string[]) => unknown

  visitor: IEditCommandVisitor;
}

export class GrammarCore implements IGrammarCore {
  kind = Kind.GRAMMAR as const;

  factory: IGrammarFactory;
  grammar: Grammar;
  simulation?: IGrammarSimulation;

  visual: IGrammarVisual;
  visitor: IEditCommandVisitor;

  constructor(type: GrammarType) {
    this.factory = new AbstractGrammarFactory(type);
    this.grammar = this.factory.createGrammar([INITIAL_NONTERMINAL], [], INITIAL_NONTERMINAL);

    this.visual = new GrammarVisual();
    this.visitor = new VisualVisitor(this.visual);
  }

  display() {
    return this.visual.display();
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

  highlight(ids: string[]) {
    return new ErrorMessage(`Not implemented ${ids}`);
  }

  simulateParsing(word: string[]) {
    return new ErrorMessage(`Not implemented. ${word}`);
  }
}

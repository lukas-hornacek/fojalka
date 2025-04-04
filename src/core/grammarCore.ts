import { IEditCommandVisitor, VisualVisitor } from "../engine/automaton/visitors/editCommand";
import { ErrorMessage, IErrorMessage } from "../engine/common";
import { Grammar, GrammarType } from "../engine/grammar/grammar";
import { GrammarEngine, IGrammarEngine } from "../engine/grammar/grammarEngine";
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

  engine: IGrammarEngine;
  visual: IGrammarVisual;
  visitor: IEditCommandVisitor;

  constructor(type: GrammarType) {
    this.engine = new GrammarEngine(type);
    this.visual = new GrammarVisual();
    this.visitor = new VisualVisitor(this.visual);
  }

  get grammar(): Grammar {
    return this.grammar;
  }

  display() {
    return this.visual.display();
  }

  addProductionRule(inputNonTerminal: string, outputSymbols: string[]) {
    const e = this.engine.addProductionRule(inputNonTerminal, outputSymbols);
    if (e !== undefined) {
      return e;
    }

    this.visual.setGrammar(this.engine.grammar);
  }

  editProductionRule(id: string, inputNonTerminal: string, outputSymbols: string[]) {
    const e = this.engine.editProductionRule(id, inputNonTerminal, outputSymbols);
    if (e !== undefined) {
      return e;
    }

    this.visual.setGrammar(this.engine.grammar);
  }

  removeProductionRule(id: string) {
    const e = this.engine.removeProductionRule(id);
    if (e !== undefined) {
      return e;
    }

    this.visual.setGrammar(this.engine.grammar);
  }

  undo() {
    const e = this.engine.undo();
    if (e !== undefined) {
      return e;
    }

    this.visual.setGrammar(this.engine.grammar);
  }

  highlight(ids: string[]) {
    return new ErrorMessage(`Not implemented ${ids}`);
  }

  simulateParsing(word: string[]) {
    return new ErrorMessage(`Not implemented. ${word}`);
  }
}

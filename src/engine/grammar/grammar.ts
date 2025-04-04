import { arraysEqual } from "../../utils.ts";
import { ErrorMessage, IErrorMessage } from "../common.ts";
import { GrammarEditCommand } from "./commands/edit.ts";

export enum GrammarType {
  REGULAR = "REGULAR",
  CONTEXT_FREE = "CONTEXT_FREE",
}

export class ProductionRule {
  id: string;
  inputNonTerminal: string;
  outputSymbols: string[];

  private constructor(_id: string, inputNonTerminal: string, outputSymbols: string[]) {
    this.id = _id;
    this.inputNonTerminal = inputNonTerminal;
    this.outputSymbols = outputSymbols;
  }

  static createByFactory(_id: string, inputNonTerminal: string, outputSymbols: string[]): ProductionRule {
    return new ProductionRule(_id, inputNonTerminal, outputSymbols);
  }

  equals(other: ProductionRule): boolean {
    if (!(other instanceof ProductionRule)) {
      return false;
    }
    return this.inputNonTerminal === other.inputNonTerminal && arraysEqual(this.outputSymbols, other.outputSymbols);
  }

  toString(): string {
    return `${this.inputNonTerminal} -> ${this.outputSymbols.join("")}`;
  }
}

export class Grammar {
  grammarType: GrammarType;
  nonTerminalSymbols: string[];
  terminalSymbols: string[];
  initialNonTerminalSymbol: string;
  productionRules: ProductionRule[];
  commandHistory: GrammarEditCommand[];

  constructor(grammarType: GrammarType,
    nonTerminalSymbols: string[],
    terminalSymbols: string[],
    initialNonTerminalSymbol: string) {
    this.grammarType = grammarType;
    this.nonTerminalSymbols = nonTerminalSymbols;
    this.terminalSymbols = terminalSymbols;
    this.initialNonTerminalSymbol = initialNonTerminalSymbol;
    this.productionRules = [];
    this.commandHistory = [];
  }

  hasNonTerminalSymbol(findNonTerminal: string): boolean {
    return this.nonTerminalSymbols.some(nonTerminal => nonTerminal === findNonTerminal);
  }
  hasTerminalSymbol(findTerminal: string): boolean {
    return this.terminalSymbols.some(terminal => terminal === findTerminal);
  }

  executeCommand(command: GrammarEditCommand): void {
    const res = command.execute();
    if (res === undefined) {
      this.commandHistory.push(command);
    } else {
      throw res;
    }

  }
  undo(): IErrorMessage | undefined {
    const command = this.commandHistory.pop();
    if (command) {
      command.undo();
    } else {
      return new ErrorMessage("Cannot undo because command history is empty.");
    }
  }

  save(): GrammarMemento {
    return new GrammarMemento(this.grammarType, this.nonTerminalSymbols, this.terminalSymbols, this.initialNonTerminalSymbol, this.productionRules);
  }
  restore(memento: GrammarMemento): void {
    this.grammarType = memento.grammarType;
    this.nonTerminalSymbols = memento.nonTerminalSymbols;
    this.terminalSymbols = memento.terminalSymbols;
    this.initialNonTerminalSymbol = memento.initialNonTerminalSymbol;
    this.productionRules = memento.productionRules;
  }
}

export class GrammarMemento {
  grammarType: GrammarType;
  nonTerminalSymbols: string[];
  terminalSymbols: string[];
  initialNonTerminalSymbol: string;
  productionRules: ProductionRule[];

  constructor(grammarType: GrammarType,
    nonTerminalSymbols: string[],
    terminalSymbols: string[],
    initialNonTerminalSymbol: string,
    productionRules: ProductionRule[]) {
    this.grammarType = grammarType;
    this.nonTerminalSymbols = nonTerminalSymbols;
    this.terminalSymbols = terminalSymbols;
    this.initialNonTerminalSymbol = initialNonTerminalSymbol;
    this.productionRules = productionRules;
  }
}

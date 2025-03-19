import { ErrorMessage, IErrorMessage } from "./common.ts";
import { arraysEqual } from "../../utils.ts";

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
  commandHistory: GrammarEditCommand<unknown>[];

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

  executeCommand<T>(command: GrammarEditCommand<T>): void {
    const res = command.execute();
    if (res === undefined) {
      this.commandHistory.push(command);
    } else {
      throw res;
    }

  }
  undo(): void {
    const command = this.commandHistory.pop();
    if (command) {
      command.undo();
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

export class SententialForm {
  sententialForm: string[];
  constructor(sententialForm: string[]) {
    this.sententialForm = sententialForm;
  }

  accept(visitor: SententialForm): SententialForm {
    return visitor;
  }

  save(): SententialFormMemento {
    return new SententialFormMemento(this.sententialForm);

  }
  restore(memento: SententialFormMemento): void {
    this.sententialForm = memento.sententialForm;
  }
}

class SententialFormMemento {
  sententialForm: string[];
  constructor(sententialForm: string[]) {
    this.sententialForm = sententialForm;
  }
}

export abstract class IGrammarSimulation {
  grammar: Grammar;
  sententialForm: SententialForm;
  commandHistory: GrammarRunCommand<unknown>[];

  constructor(grammar: Grammar, sententialForm: SententialForm) {
    this.grammar = grammar;
    this.sententialForm = sententialForm;
    this.commandHistory = [];
  }

  executeCommand<T>(command: GrammarRunCommand<T>): void {
    if (command.execute()) {
      this.commandHistory.push(command);
    }
  }
  undo(): void {
    this.commandHistory.pop()?.undo();
  }

  abstract run(): void;
}

// prob LR or RR parsing commands
export abstract class GrammarRunCommand<T = void> {
  simulation: IGrammarSimulation;
  backup?: SententialFormMemento;
  result?: T;

  protected constructor(_simulation: IGrammarSimulation) {
    this.simulation = _simulation;
  }

  saveBackup() {
    this.backup = this.simulation.sententialForm.save();
  }

  undo() {
    if (this.backup) {
      this.simulation.sententialForm.restore(this.backup);
    }
  }

  getResult(): T | undefined {
    return this.result;
  }

  abstract execute(): IErrorMessage | undefined;
}

export abstract class GrammarEditCommand<T = void> {
  grammar: Grammar;
  backup?: GrammarMemento;
  result?: T;

  protected constructor(grammar: Grammar) {
    this.grammar = grammar;
  }

  saveBackup() {
    this.backup = this.grammar.save();
  }

  undo() {
    if (this.backup) {
      this.grammar.restore(this.backup);
    }
  }

  getResult(): T | undefined {
    return this.result;
  }

  abstract execute(): IErrorMessage | undefined; // this.saveBackup(); ...perform command...
}

export class AddProductionRuleCommand extends GrammarEditCommand {
  productionRule: ProductionRule;

  constructor(grammar: Grammar, productionRule: ProductionRule) {
    super(grammar);
    this.productionRule = productionRule;
  }

  execute(): IErrorMessage | undefined {
    if (this.grammar.productionRules.includes(this.productionRule)) {
      return new ErrorMessage(`Cannot add production rule: ${this.productionRule.toString()}: is already present.`);
    }

    this.saveBackup();
    this.grammar.productionRules.push(this.productionRule);

    return undefined;
  }
}

export class RemoveProductionRuleCommand extends GrammarEditCommand {
  productionRuleId: string;

  constructor(grammar: Grammar, productionRuleId: string) {
    super(grammar);
    this.productionRuleId = productionRuleId;
  }

  execute(): IErrorMessage | undefined {
    const newProductionRules = this.grammar.productionRules.filter(productionRule => productionRule.id === this.productionRuleId);
    if (newProductionRules.length === this.grammar.productionRules.length) {
      return new ErrorMessage(`Cannot remove production rule ${this.productionRuleId}: production rule is not present.`);
    }
    this.saveBackup();
    this.grammar.productionRules = newProductionRules;
  }
}

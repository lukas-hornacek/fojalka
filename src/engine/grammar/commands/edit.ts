import { Kind } from "../../../core/core";
import { IEditCommandVisitor } from "../../automaton/visitors/editCommand";
import { IErrorMessage, ErrorMessage } from "../../common";
import { Grammar, GrammarMemento, ProductionRule } from "../grammar";

export abstract class GrammarEditCommand {
  kind = Kind.GRAMMAR as const;
  grammar: Grammar;
  backup?: GrammarMemento;

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

  abstract accept(visitor: IEditCommandVisitor): void;
  abstract execute(): IErrorMessage | undefined; // this.saveBackup(); ...perform command...
}

export class AddProductionRuleCommand extends GrammarEditCommand {
  productionRule: ProductionRule;

  constructor(grammar: Grammar, productionRule: ProductionRule) {
    super(grammar);
    this.productionRule = productionRule;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitAddProductionRuleCommand(this);
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

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitRemoveProductionRuleCommand(this);
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

export class AddNonterminalsCommand extends GrammarEditCommand {
  nonterminals: string[];

  constructor(grammar: Grammar, nonterminals: string[]) {
    super(grammar);
    this.nonterminals = nonterminals;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitAddNonterminalsCommand(this);
  }

  execute(): IErrorMessage | undefined {
    if (this.nonterminals.some(symbol => this.grammar.nonTerminalSymbols.includes(symbol))) {
      return new ErrorMessage(`Cannot add nonterminal symbols ${this.nonterminals}: some of the symbols are already present.`);
    }

    this.saveBackup();
    for (const symbol of this.nonterminals) {
      this.grammar.nonTerminalSymbols.push(symbol);
    }
  }
}

export class AddTerminalsCommand extends GrammarEditCommand {
  terminals: string[];

  constructor(grammar: Grammar, terminals: string[]) {
    super(grammar);
    this.terminals = terminals;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitAddTerminalsCommand(this);
  }

  execute(): IErrorMessage | undefined {
    if (this.terminals.some(symbol => this.grammar.terminalSymbols.includes(symbol))) {
      return new ErrorMessage(`Cannot add terminal symbols ${this.terminals}: some of the symbols are already present.`);
    }

    this.saveBackup();
    for (const symbol of this.terminals) {
      this.grammar.terminalSymbols.push(symbol);
    }
  }
}

export class SetInitialNonterminalCommand extends GrammarEditCommand {
  nonterminal: string;

  constructor(grammar: Grammar, nonterminal: string) {
    super(grammar);
    this.nonterminal = nonterminal;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitSetInitialNonterminalCommand(this);
  }

  execute(): IErrorMessage | undefined {
    if (!this.grammar.nonTerminalSymbols.includes(this.nonterminal)) {
      return new ErrorMessage(`Cannot set nonterminal symbol ${this.nonterminal} as initial: nonterminal is not present.`);
    }

    this.saveBackup();
    this.grammar.initialNonTerminalSymbol = this.nonterminal;
  }
}

export class RemoveNonterminalCommand extends GrammarEditCommand {
  nonterminal: string;

  constructor(grammar: Grammar, nonterminal: string) {
    super(grammar);
    this.nonterminal = nonterminal;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitRemoveNonterminalCommand(this);
  }

  execute(): IErrorMessage | undefined {
    const index = this.grammar.nonTerminalSymbols.findIndex(id => id === this.nonterminal);
    if (index === -1) {
      return new ErrorMessage(`Cannot remove nonterminal symbol ${this.nonterminal}: nonterminal is not present.`);
    }
    if (this.nonterminal === this.grammar.initialNonTerminalSymbol) {
      return new ErrorMessage(`Cannot remove nonterminal symbol ${this.nonterminal}: it is the initial nonterminal.`);
    }

    this.saveBackup();
    if (this.grammar.nonTerminalSymbols.length > 1 && index !== this.grammar.nonTerminalSymbols.length - 1) {
      this.grammar.nonTerminalSymbols[index] = this.grammar.nonTerminalSymbols.pop()!;
    } else {
      this.grammar.nonTerminalSymbols.pop();
    }
  }
}

export class RemoveTerminalCommand extends GrammarEditCommand {
  terminal: string;

  constructor(grammar: Grammar, terminal: string) {
    super(grammar);
    this.terminal = terminal;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitRemoveTerminalCommand(this);
  }

  execute(): IErrorMessage | undefined {
    const index = this.grammar.terminalSymbols.findIndex(id => id === this.terminal);
    if (index === -1) {
      return new ErrorMessage(`Cannot remove terminal symbol ${this.terminal}: terminal is not present.`);
    }

    this.saveBackup();
    if (this.grammar.terminalSymbols.length > 1 && index !== this.grammar.terminalSymbols.length - 1) {
      this.grammar.terminalSymbols[index] = this.grammar.terminalSymbols.pop()!;
    } else {
      this.grammar.terminalSymbols.pop();
    }
  }
}

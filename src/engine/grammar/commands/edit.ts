import { IErrorMessage, ErrorMessage } from "../../common";
import { Grammar, GrammarMemento, ProductionRule } from "../grammar";

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

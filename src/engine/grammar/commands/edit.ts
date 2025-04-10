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

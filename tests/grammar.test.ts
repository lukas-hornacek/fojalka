import { expect, test } from "vitest";
import { AbstractGrammarFactory  } from "../src/types/grammar_factories.ts";
import { AddProductionRuleCommand, GrammarType, ProductionRule } from "../src/types/grammar_types.ts";
import { inspect } from "util";

test("Regular grammar test", () => {
  const agf = new AbstractGrammarFactory(GrammarType.REGULAR);
  const grammar = agf.createGrammar(["S"], ["a", "b"], "S");

  const addProductionRuleOne = new ProductionRule("rule_0", "S", ["a", "S"]);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleOne));
  expect(grammar.productionRules).toContain(addProductionRuleOne);

  const addProductionRuleTwo = new ProductionRule("rule_0", "S", ["a", "b", "a", "S"]);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleTwo));
  expect(grammar.productionRules).toContain(addProductionRuleTwo);

  console.log(inspect(grammar));

  // series of wrong operations
  expect(() => grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleTwo))).toThrow();
  const addNonCFProductionRule = () => {
    grammar.executeCommand(new AddProductionRuleCommand(grammar, new ProductionRule("rule_1", "S", ["a", "S", "a"])));
  };
  expect(addNonCFProductionRule).toThrow();

  expect(() => grammar.executeCommand(new AddProductionRuleCommand(grammar, new ProductionRule("rule_1", "S", ["a", "Q"])))).toThrow();
  expect(() => grammar.executeCommand(new AddProductionRuleCommand(grammar, new ProductionRule("rule_1", "S", ["S", "S"])))).toThrow();
  expect(() => grammar.executeCommand(new AddProductionRuleCommand(grammar, new ProductionRule("rule_1", "S", ["S", "S"])))).toThrow();
  expect(() => grammar.executeCommand(new AddProductionRuleCommand(grammar, new ProductionRule("rule_1", "S", ["S", "b", "S", "a", "S"])))).toThrow();
});

test("CF grammar test", () => {
  const agf = new AbstractGrammarFactory(GrammarType.CONTEXT_FREE);
  const grammar = agf.createGrammar(["S"], ["a", "b"], "S");

  const addProductionRuleOne = new ProductionRule("rule_0", "S", ["a", "S"]);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleOne));
  expect(grammar.productionRules).toContain(addProductionRuleOne);

  const addProductionRuleTwo = new ProductionRule("rule_1", "S", ["a", "b", "a", "S"]);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleTwo));
  expect(grammar.productionRules).toContain(addProductionRuleOne);

  const addProductionRuleThree = new ProductionRule("rule_2", "S", ["a", "S", "b"]);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleThree));
  expect(grammar.productionRules).toContain(addProductionRuleOne);

  console.log(inspect(grammar));
});

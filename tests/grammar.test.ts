import { expect, test } from "vitest";
import { AbstractGrammarFactory } from "../src/engine/grammar/factories.ts";
import { AddProductionRuleCommand } from "../src/engine/grammar/commands/edit.ts";
import { GrammarType } from "../src/engine/grammar/grammar.ts";
import { ErrorMessage } from "../src/engine/common.ts";

test("Regular grammar test", () => {
  const agf = new AbstractGrammarFactory(GrammarType.REGULAR);
  const grammar = agf.createGrammar(["S"], ["a", "b"], "S");

  const addProductionRuleOne = agf.createProductionRule("S", ["a", "S"], grammar);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleOne));
  expect(grammar.productionRules).toContain(addProductionRuleOne);

  const addProductionRuleTwo = agf.createProductionRule("S", ["a", "b", "a", "S"], grammar);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleTwo));
  expect(grammar.productionRules).toContain(addProductionRuleTwo);

  console.log(grammar);

  // series of wrong operations
  const result = grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleTwo));
  expect(result).toBeInstanceOf(ErrorMessage);
  expect(result.details).toBe("Cannot add production rule: S -> abaS: it is already present.");
  const addNonCFProductionRule = () => {
    grammar.executeCommand(new AddProductionRuleCommand(grammar, agf.createProductionRule("S", ["a", "S", "a"], grammar)));
  };
  expect(addNonCFProductionRule).toThrow();

  expect(() => grammar.executeCommand(new AddProductionRuleCommand(grammar, agf.createProductionRule("S", ["a", "Q"], grammar)))).toThrow();
  expect(() => grammar.executeCommand(new AddProductionRuleCommand(grammar, agf.createProductionRule("S", ["S", "S"], grammar)))).toThrow();
  expect(() => grammar.executeCommand(new AddProductionRuleCommand(grammar, agf.createProductionRule("S", ["S", "S"], grammar)))).toThrow();
  expect(() => grammar.executeCommand(new AddProductionRuleCommand(grammar, agf.createProductionRule("S", ["S", "b", "S", "a", "S"], grammar)))).toThrow();
});

test("CF grammar test", () => {
  const agf = new AbstractGrammarFactory(GrammarType.CONTEXT_FREE);
  const grammar = agf.createGrammar(["S"], ["a", "b"], "S");

  const addProductionRuleOne = agf.createProductionRule("S", ["a", "S"], grammar);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleOne));
  expect(grammar.productionRules).toContain(addProductionRuleOne);

  const addProductionRuleTwo = agf.createProductionRule("S", ["a", "b", "a", "S"], grammar);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleTwo));
  expect(grammar.productionRules).toContain(addProductionRuleOne);

  const addProductionRuleThree = agf.createProductionRule("S", ["a", "S", "b"], grammar);
  grammar.executeCommand(new AddProductionRuleCommand(grammar, addProductionRuleThree));
  expect(grammar.productionRules).toContain(addProductionRuleOne);

  console.log(grammar);
});

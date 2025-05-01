import { expect, test } from "vitest";
import { GrammarNormalFormAlgorithm, GrammarToAutomatonAlgorithm } from "../src/engine/algorithm";
import { ModeHolder } from "../src/core/core";
import { EPSILON, INITIAL_NONTERMINAL } from "../src/constants";
import { GrammarEditCommand } from "../src/engine/grammar/commands/edit";
import { Grammar, GrammarType } from "../src/engine/grammar/grammar";
import { GrammarCore } from "../src/core/grammarCore";
import { AutomatonEditCommand } from "../src/engine/automaton/commands/edit";
import { AutomatonType } from "../src/engine/automaton/automaton";

test("testing grammar normal form", () => {
  const core = new GrammarCore(GrammarType.REGULAR, new ModeHolder());
  const algorithm = new GrammarNormalFormAlgorithm(core);

  core.grammar = new Grammar(GrammarType.REGULAR, [INITIAL_NONTERMINAL, "A", "B"], ["a", "b"], INITIAL_NONTERMINAL);
  let rule = core.factory.createProductionRule(INITIAL_NONTERMINAL, ["a", "b", "a", INITIAL_NONTERMINAL], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule(INITIAL_NONTERMINAL, ["b", "A"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule(INITIAL_NONTERMINAL, ["B"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule(INITIAL_NONTERMINAL, ["b"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule("A", ["a", "A"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule("A", [EPSILON], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule("B", ["B"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule("B", ["a", "a"], core.grammar);
  core.grammar.productionRules.push(rule);

  const core2 = algorithm.init(new ModeHolder());

  //running the algorithm
  let result = algorithm.next();
  while (result !== undefined) {
    core2.grammar.executeCommand((result.command as GrammarEditCommand));
    result = algorithm.next();
  }

  //testing properities of the new grammar
  expect(core2.grammar.nonTerminalSymbols).toEqual([INITIAL_NONTERMINAL, "A", "B", "ψ1,1", "ψ1,2", "ψ2,1"]);
  expect(core2.grammar.terminalSymbols).toEqual(["a", "b"]);
  expect(core2.grammar.initialNonTerminalSymbol).toBe(INITIAL_NONTERMINAL);
  expect(core2.grammar.grammarType).toBe(GrammarType.REGULAR);

  for (const symbol of core2.grammar.nonTerminalSymbols) {
    expect(core2.grammar.productionRules.some(rule => rule.inputNonTerminal === symbol)).toBeTruthy();
  }

  for (const rule of core2.grammar.productionRules) {
    if (rule.inputNonTerminal === "ψ1,1") { expect(rule.outputSymbols).toEqual(["b", "ψ1,2"]); }
    if (rule.inputNonTerminal === "ψ1,2") { expect(rule.outputSymbols).toEqual(["a", INITIAL_NONTERMINAL]); }
    if (rule.inputNonTerminal === "ψ2,1") { expect(rule.outputSymbols).toEqual(["a"]); }
  }

  let outputWords: string[][] = [];
  for (const rule of core2.grammar.productionRules.filter(rule => rule.inputNonTerminal === INITIAL_NONTERMINAL)) {
    outputWords.push(rule.outputSymbols);
  }
  expect(outputWords).toHaveLength(4);
  expect(outputWords).toContainEqual(["a", "ψ1,1"]);
  expect(outputWords).toContainEqual(["b", "A"]);
  expect(outputWords).toContainEqual(["B"]);
  expect(outputWords).toContainEqual(["b"]);

  outputWords = [];
  for (const rule of core2.grammar.productionRules.filter(rule => rule.inputNonTerminal === "A")) {
    outputWords.push(rule.outputSymbols);
  }
  expect(outputWords).toHaveLength(2);
  expect(outputWords).toContainEqual([EPSILON]);
  expect(outputWords).toContainEqual(["a", "A"]);

  outputWords = [];
  for (const rule of core2.grammar.productionRules.filter(rule => rule.inputNonTerminal === "B")) {
    outputWords.push(rule.outputSymbols);
  }
  expect(outputWords).toHaveLength(2);
  expect(outputWords).toContainEqual(["B"]);
  expect(outputWords).toContainEqual(["a", "ψ2,1"]);
});

test("testing grammar to automaton", () => {
  const core = new GrammarCore(GrammarType.REGULAR, new ModeHolder());
  let algorithm = new GrammarToAutomatonAlgorithm(core);

  core.grammar = new Grammar(GrammarType.REGULAR, [INITIAL_NONTERMINAL, "A", "B"], ["a", "b"], INITIAL_NONTERMINAL);
  let rule = core.factory.createProductionRule(INITIAL_NONTERMINAL, ["a", "b", "a", INITIAL_NONTERMINAL], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule(INITIAL_NONTERMINAL, ["b", "A"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule(INITIAL_NONTERMINAL, ["B"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule(INITIAL_NONTERMINAL, ["b"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule("A", ["a", "A"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule("A", [EPSILON], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule("B", ["B"], core.grammar);
  core.grammar.productionRules.push(rule);
  rule = core.factory.createProductionRule("B", ["a", "a"], core.grammar);
  core.grammar.productionRules.push(rule);

  expect(() => algorithm.init(new ModeHolder())).toThrowError("Cannot use algorithm, as the grammar is not in required normal form.");

  const algorithm2 = new GrammarNormalFormAlgorithm(core);
  const core2 = algorithm2.init(new ModeHolder());

  //trnsform grammar into normal form
  let result = algorithm2.next();
  while (result !== undefined) {
    core2.grammar.executeCommand((result.command as GrammarEditCommand));
    result = algorithm2.next();
  }

  algorithm = new GrammarToAutomatonAlgorithm(core2);
  const core3 = algorithm.init(new ModeHolder());

  //running the algorithm
  result = algorithm.next();
  while (result !== undefined) {
    core3.automaton.executeCommand((result.command as AutomatonEditCommand));
    result = algorithm.next();
  }

  //testing properitie of the new automaton
  expect(core3.automaton.states).toEqual([INITIAL_NONTERMINAL, "A", "B", "ψ1,1", "ψ1,2", "ψ2,1", "fin"]);
  expect(core3.automaton.initialStateId).toBe(INITIAL_NONTERMINAL);
  expect(core3.automaton.finalStateIds).toEqual(["fin"]);
  expect(core3.automaton.automatonType).toBe(AutomatonType.FINITE);

  for (const from in core3.automaton.deltaFunctionMatrix) {
    for (const to in core3.automaton.deltaFunctionMatrix[from]) {
      expect(core3.automaton.deltaFunctionMatrix[from][to]).toHaveLength(1);
    }
  }

  expect(core3.automaton.deltaFunctionMatrix[INITIAL_NONTERMINAL]["A"][0].inputChar).toBe("b");
  expect(core3.automaton.deltaFunctionMatrix[INITIAL_NONTERMINAL]["fin"][0].inputChar).toBe("b");
  expect(core3.automaton.deltaFunctionMatrix[INITIAL_NONTERMINAL]["B"][0].inputChar).toBe(EPSILON);
  expect(core3.automaton.deltaFunctionMatrix[INITIAL_NONTERMINAL]["ψ1,1"][0].inputChar).toBe("a");

  expect(core3.automaton.deltaFunctionMatrix["A"]["A"][0].inputChar).toBe("a");
  expect(core3.automaton.deltaFunctionMatrix["A"]["fin"][0].inputChar).toBe(EPSILON);

  expect(core3.automaton.deltaFunctionMatrix["B"]["ψ2,1"][0].inputChar).toBe("a");
  expect(core3.automaton.deltaFunctionMatrix["B"]["B"][0].inputChar).toBe(EPSILON);

  expect(core3.automaton.deltaFunctionMatrix["ψ1,1"]["ψ1,2"][0].inputChar).toBe("b");

  expect(core3.automaton.deltaFunctionMatrix["ψ1,2"][INITIAL_NONTERMINAL][0].inputChar).toBe("a");

  expect(core3.automaton.deltaFunctionMatrix["ψ2,1"]["fin"][0].inputChar).toBe("a");

});


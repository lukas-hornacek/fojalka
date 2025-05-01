import { expect, test } from "vitest";
import { AutomatonToGrammarAlgorithm } from "../src/engine/algorithm/automatonAlgorithms";
import { AutomatonCore } from "../src/core/automatonCore";
import { Automaton, AutomatonType } from "../src/engine/automaton/automaton";
import { ModeHolder } from "../src/core/core";
import { FiniteAutomatonEdge } from "../src/engine/automaton/edge";
import { EPSILON } from "../src/constants";
import { GrammarEditCommand } from "../src/engine/grammar/commands/edit";
import { GrammarType } from "../src/engine/grammar/grammar";
import { ErrorMessage } from "../src/engine/common";
import { GrammarCore } from "../src/core/grammarCore";

test("testing algorithm corectness", () => {
  const core = new AutomatonCore(AutomatonType.FINITE, "test_core", new ModeHolder());
  const algorithm = new AutomatonToGrammarAlgorithm(core);

  core.automaton = new Automaton({
    states: ["q0", "q1", "q2", "q3"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", EPSILON)], "q3":[new FiniteAutomatonEdge("2", "a"), new FiniteAutomatonEdge("3", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "b")], "q2":[new FiniteAutomatonEdge("4", "a")] },
      "q2":{ "q0":[new FiniteAutomatonEdge("5", EPSILON)] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1", "q3"]
  });

  const core2 = algorithm.init(new ModeHolder());

  //running the algorithm
  let result = algorithm.next();
  while (result !== undefined) {
    core2.grammar.executeCommand((result.command as GrammarEditCommand));
    result = algorithm.next();
  }

  //testing properities of the new grammar
  expect(core2.grammar.nonTerminalSymbols).toEqual(["q0", "q1", "q2", "q3"]);
  expect(core2.grammar.terminalSymbols).toEqual(["a", "b"]);
  expect(core2.grammar.initialNonTerminalSymbol).toBe("q0");
  expect(core2.grammar.grammarType).toBe(GrammarType.REGULAR);

  for (const state of ["q0", "q1", "q2", "q3"]) {
    expect(core2.grammar.productionRules.some(rule => rule.inputNonTerminal === state)).toBeTruthy();
  }

  for (const rule of core2.grammar.productionRules) {
    expect(rule.inputNonTerminal).toBeOneOf(["q0", "q1", "q2", "q3"]);

    if (rule.inputNonTerminal === "q2") { expect(rule.outputSymbols).toEqual(["q0"]); }
    if (rule.inputNonTerminal === "q3") { expect(rule.outputSymbols).toEqual([EPSILON]); }
  }

  let outputWords: string[][] = [];
  for (const rule of core2.grammar.productionRules.filter(rule => rule.inputNonTerminal === "q0")) {
    outputWords.push(rule.outputSymbols);
  }
  expect(outputWords).toHaveLength(3);
  expect(outputWords).toContainEqual(["q1"]);
  expect(outputWords).toContainEqual(["a", "q3"]);
  expect(outputWords).toContainEqual(["b", "q3"]);

  outputWords = [];
  for (const rule of core2.grammar.productionRules.filter(rule => rule.inputNonTerminal === "q1")) {
    outputWords.push(rule.outputSymbols);
  }
  expect(outputWords).toHaveLength(3);
  expect(outputWords).toContainEqual([EPSILON]);
  expect(outputWords).toContainEqual(["a", "q2"]);
  expect(outputWords).toContainEqual(["b", "q1"]);

});

test("testing algorithm functions", () => {
  //testing error throwing on wrong inputs
  let core = new AutomatonCore(AutomatonType.PDA, "test_core", new ModeHolder());
  let algorithm = new AutomatonToGrammarAlgorithm(core);

  expect(() => algorithm.init(new ModeHolder)).toThrowError("Cannot use algorithm, as it only works with finite automata.");

  core = new AutomatonCore(AutomatonType.FINITE, "test_core", new ModeHolder());
  algorithm = new AutomatonToGrammarAlgorithm(core);

  //testing usage of next()/undo() before init()
  core.automaton = new Automaton({
    states: ["q0", "q1", "q2", "q3"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", EPSILON)], "q3":[new FiniteAutomatonEdge("2", "a"), new FiniteAutomatonEdge("3", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "b")], "q2":[new FiniteAutomatonEdge("4", "a")] },
      "q2":{ "q0":[new FiniteAutomatonEdge("5", EPSILON)] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1", "q3"]
  });

  expect(() => algorithm.next()).toThrowError("Cannot simulate algorithm step before start.");

  let message = algorithm.undo();
  expect(message).toEqual(new ErrorMessage("Cannot undo algorithm step before start."));

  //testing usage of undo() before next()
  const core2 = algorithm.init(new ModeHolder);
  expect(core2).toBeInstanceOf(GrammarCore);

  message = algorithm.undo();
  expect(message).toEqual(new ErrorMessage("There is nothing to undo."));

  //second algorithm for testing undo() function
  const algorithm2 = new AutomatonToGrammarAlgorithm(core);
  const core3 = algorithm2.init(new ModeHolder);

  //testing if next + undo equals the original grammar
  const result1 = algorithm.next();
  core2.grammar.executeCommand((result1?.command as GrammarEditCommand));
  algorithm.undo();
  expect(core2.grammar).toEqual(core3.grammar);

  //testing if next + undo + next return the same command as next
  const result2 = algorithm.next();
  core2.grammar.executeCommand((result2?.command as GrammarEditCommand));
  algorithm.undo();
  expect(result1).toEqual(result2);

  //testing if next + next + undo + undo equals the original grammar
  core2.grammar.executeCommand((algorithm.next()?.command as GrammarEditCommand));
  core2.grammar.executeCommand((algorithm.next()?.command as GrammarEditCommand));
  algorithm.undo();
  algorithm.undo();
  expect(core2.grammar).toEqual(core3.grammar);

  //testing if next + undo works in the entire algorthm
  for (let i = 0; i < algorithm.results.length - 1; i++) {
    core2.grammar.executeCommand((algorithm.next()?.command as GrammarEditCommand));
    core3.grammar.executeCommand((algorithm2.next()?.command as GrammarEditCommand));
    expect(core2.grammar).toEqual(core3.grammar);

    core2.grammar.executeCommand((algorithm.next()?.command as GrammarEditCommand));
    algorithm.undo();
    expect(core2.grammar).toEqual(core3.grammar);
  }
});

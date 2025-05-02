import { expect, test } from "vitest";
import { NondeterministicToDeterministicAlgorithm } from "../src/engine/algorithm/automatonAlgorithms";
import { AutomatonCore } from "../src/core/automatonCore";
import { Automaton, AutomatonType } from "../src/engine/automaton/automaton";
import { ModeHolder } from "../src/core/core";
import { FiniteAutomatonEdge } from "../src/engine/automaton/edge";
import { AutomatonEditCommand } from "../src/engine/automaton/commands/edit";
import { EPSILON } from "../src/constants";
import { ErrorMessage } from "../src/engine/common";

test("small automaton test", () => {
  const core = new AutomatonCore(AutomatonType.FINITE, "test_core", new ModeHolder());
  core.automaton = new Automaton({
    states: ["q0", "q1"],
    deltaFunctionMatrix: {
      "q0":{ "q0":[new FiniteAutomatonEdge("1", "a")], "q1":[new FiniteAutomatonEdge("2", "a")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const algorithm = new NondeterministicToDeterministicAlgorithm(core);
  const core2 = algorithm.init(new ModeHolder());

  //running the algorithm
  let result = algorithm.next();
  while (result !== undefined) {
    core2.automaton.executeCommand((result.command as AutomatonEditCommand));
    result = algorithm.next();
  }

  //testing properities of the new automaton
  expect(core2.automaton.states.length).toBe(4);
  const list = ["{q0}", "{q1}", "{q0,q1}", "{}"];
  for (const state of list) {
    expect(core2.automaton.states).toContain(state);
  }
  expect(core2.automaton.finalStateIds).toHaveLength(2);
  expect(core2.automaton.finalStateIds).toContain("{q1}");
  expect(core2.automaton.finalStateIds).toContain("{q0,q1}");
  expect(core2.automaton.initialStateId).toBe("{q0}");
  expect(core2.automaton.automatonType).toBe(AutomatonType.FINITE);

  expect(core2.automaton.deltaFunctionMatrix["{q0}"]["{q0,q1}"]).toHaveLength(1);
  expect(core2.automaton.deltaFunctionMatrix["{q0}"]["{q0,q1}"][0].inputChar).toBe("a");
  expect(core2.automaton.deltaFunctionMatrix["{q0}"]["{}"]).toHaveLength(1);
  expect(core2.automaton.deltaFunctionMatrix["{q0}"]["{}"][0].inputChar).toBe("b");
  expect(core2.automaton.deltaFunctionMatrix["{q0}"]["{q1}"]).toBeUndefined();
  expect(core2.automaton.deltaFunctionMatrix["{q0}"]["{q0}"]).toBeUndefined();

  expect(core2.automaton.deltaFunctionMatrix["{q0,q1}"]["{q0,q1}"]).toHaveLength(1);
  expect(core2.automaton.deltaFunctionMatrix["{q0,q1}"]["{q0,q1}"][0].inputChar).toBe("a");
  expect(core2.automaton.deltaFunctionMatrix["{q0,q1}"]["{q1}"]).toHaveLength(1);
  expect(core2.automaton.deltaFunctionMatrix["{q0,q1}"]["{q1}"][0].inputChar).toBe("b");
  expect(core2.automaton.deltaFunctionMatrix["{q0,q1}"]["{}"]).toBeUndefined();
  expect(core2.automaton.deltaFunctionMatrix["{q0,q1}"]["{q0}"]).toBeUndefined();

  expect(core2.automaton.deltaFunctionMatrix["{q1}"]["{q1}"]).toHaveLength(2);
  expect(core2.automaton.deltaFunctionMatrix["{q1}"]["{q1}"][0].inputChar).toBeOneOf(["a", "b"]);
  expect(core2.automaton.deltaFunctionMatrix["{q1}"]["{q1}"][1].inputChar).toBeOneOf(["a", "b"]);
  expect(core2.automaton.deltaFunctionMatrix["{q1}"]["{q1}"][0].inputChar).not.toEqual(core2.automaton.deltaFunctionMatrix["{q1}"]["{q1}"][1].inputChar);
  expect(core2.automaton.deltaFunctionMatrix["{q1}"]["{}"]).toBeUndefined();
  expect(core2.automaton.deltaFunctionMatrix["{q1}"]["{q0}"]).toBeUndefined();
  expect(core2.automaton.deltaFunctionMatrix["{q1}"]["{q0,q1}"]).toBeUndefined();

  expect(core2.automaton.deltaFunctionMatrix["{}"]["{}"]).toHaveLength(2);
  expect(core2.automaton.deltaFunctionMatrix["{}"]["{}"][0].inputChar).toBeOneOf(["a", "b"]);
  expect(core2.automaton.deltaFunctionMatrix["{}"]["{}"][1].inputChar).toBeOneOf(["a", "b"]);
  expect(core2.automaton.deltaFunctionMatrix["{}"]["{}"][0].inputChar).not.toEqual(core2.automaton.deltaFunctionMatrix["{}"]["{}"][1].inputChar);
  expect(core2.automaton.deltaFunctionMatrix["{}"]["{q1}"]).toBeUndefined();
  expect(core2.automaton.deltaFunctionMatrix["{}"]["{q0}"]).toBeUndefined();
  expect(core2.automaton.deltaFunctionMatrix["{}"]["{q0,q1}"]).toBeUndefined();

});

test("testing algorithm functions", () => {
  //testing error throwing on wrong inputs
  let core = new AutomatonCore(AutomatonType.PDA, "test_core", new ModeHolder());
  let algorithm = new NondeterministicToDeterministicAlgorithm(core);

  expect(algorithm.inputCore).toBe(core);
  expect(algorithm.outputCore).toBeUndefined();
  expect(() => algorithm.init(new ModeHolder)).toThrowError("Cannot use algorithm, as it only works with finite automata.");

  core = new AutomatonCore(AutomatonType.FINITE, "test_core", new ModeHolder());
  core.automaton = new Automaton({
    states: ["q0", "q1"],
    deltaFunctionMatrix: { "q0":{ "q1":[new FiniteAutomatonEdge("1", EPSILON)] } },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"] });
  algorithm = new NondeterministicToDeterministicAlgorithm(core);
  expect(() => algorithm.init(new ModeHolder)).toThrowError("Cannot use algorithm, as the input automaton has epsilon transitions.");

  //testing usage of next()/undo() before init()
  core.automaton = new Automaton({
    states: ["q0", "q1"],
    deltaFunctionMatrix: { "q0":{ "q1":[new FiniteAutomatonEdge("1", "a")] } },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"] });

  expect(() => algorithm.next()).toThrowError("Cannot simulate algorithm step before start.");

  let message = algorithm.undo();
  expect(message).toEqual(new ErrorMessage("Cannot undo algorithm step before start."));

  //testing usage of undo() before next()
  const core2 = algorithm.init(new ModeHolder);
  expect(core2).toBeInstanceOf(AutomatonCore);

  message = algorithm.undo();
  expect(message).toEqual(new ErrorMessage("There is nothing to undo."));

  //second algorithm for testing undo() function
  const algorithm2 = new NondeterministicToDeterministicAlgorithm(core);
  const core3 = algorithm2.init(new ModeHolder);
  expect(core3).toBeInstanceOf(AutomatonCore);

  //testing if next + undo equals the original automaton
  const result1 = algorithm.next();
  core2.automaton.executeCommand((result1?.command as AutomatonEditCommand));
  algorithm.undo();
  expect(core2.automaton).toEqual(core3.automaton);

  //testing if next + undo + next return the same command as next
  const result2 = algorithm.next();
  core2.automaton.executeCommand((result2?.command as AutomatonEditCommand));
  algorithm.undo();
  expect(result1).toEqual(result2);

  //testing if next + next + undo + undo equals the original automaton
  core2.automaton.executeCommand((algorithm.next()?.command as AutomatonEditCommand));
  core2.automaton.executeCommand((algorithm.next()?.command as AutomatonEditCommand));
  algorithm.undo();
  algorithm.undo();
  expect(core2.automaton).toEqual(core3.automaton);

  //testing if next + undo works in the entire algorthm
  for (let i = 0; i < algorithm.results!.length - 1; i++) {
    core2.automaton.executeCommand((algorithm.next()?.command as AutomatonEditCommand));
    core3.automaton.executeCommand((algorithm2.next()?.command as AutomatonEditCommand));
    expect(core2.automaton).toEqual(core3.automaton);

    core2.automaton.executeCommand((algorithm.next()?.command as AutomatonEditCommand));
    algorithm.undo();
    expect(core2.automaton).toEqual(core3.automaton);
  }
});

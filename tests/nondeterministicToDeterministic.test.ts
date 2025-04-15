import { expect, test } from "vitest";
import { NondeterministicToDeterministicAlgorithm } from "../src/engine/algorithm";
import { AutomatonCore } from "../src/core/automatonCore";
import { Automaton, AutomatonType } from "../src/engine/automaton/automaton";
import { ModeHolder } from "../src/core/core";
import { FiniteAutomatonEdge } from "../src/engine/automaton/edge";
import { AutomatonEditCommand } from "../src/engine/automaton/commands/edit";

test("small automaton test", () => {
  const core = new AutomatonCore(AutomatonType.FINITE, "test_core", new ModeHolder());
  core.automaton = new Automaton({
    states: ["q0", "q1"],
    deltaFunctionMatrix: {
      "q0":{ "q0":[new FiniteAutomatonEdge("1", "a")], "q1":[new FiniteAutomatonEdge("2", "a")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")] } },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"] });

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
  for (const state in list) {
    expect(core2.automaton.states).toContain(list[state]);
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
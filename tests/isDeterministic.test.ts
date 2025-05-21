import { expect, test } from "vitest";
import { Automaton, AutomatonType } from "../src/engine/automaton/automaton";
import { FiniteAutomatonEdge } from "../src/engine/automaton/edge";
import { EPSILON } from "../src/constants";

test("Finite isDeterministic Test", () =>{
  const a1 = new Automaton({
    states: ["q0", "q1"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", "a")], "q0":[new FiniteAutomatonEdge("2", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const res1 = a1.isDeterministic();
  expect(res1).toBe(true);

  const a2 = new Automaton({
    states: ["q0", "q1", "q2"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", "a")], "q0":[new FiniteAutomatonEdge("2", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")] },
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const res2 = a2.isDeterministic();
  expect(res2).toBe(false);

  const a3 = new Automaton({
    states: ["q0", "q1", "q3"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", "a")], "q0":[new FiniteAutomatonEdge("2", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")] },
      "q2":{}
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const res3 = a3.isDeterministic();
  expect(res3).toBe(false);

  const a4 = new Automaton({
    states: ["q0", "q1", "q2"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", "a")], "q0":[new FiniteAutomatonEdge("2", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")] },
      "q2":{ "q0":[new FiniteAutomatonEdge("5", "a")], "q2": [new FiniteAutomatonEdge("6", "a")] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const res4 = a4.isDeterministic();
  expect(res4).toBe(false);

  const a5 = new Automaton({
    states: ["q0", "q1", "q2"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", "a")], "q0":[new FiniteAutomatonEdge("2", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")] },
      "q2":{ "q0":[new FiniteAutomatonEdge("5", "a"), new FiniteAutomatonEdge("6", "b")], "q2": [new FiniteAutomatonEdge("7", "a")] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const res5 = a5.isDeterministic();
  expect(res5).toBe(false);

  const a6 = new Automaton({
    states: ["q0", "q1"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", "a"), new FiniteAutomatonEdge("2", EPSILON)], "q0":[new FiniteAutomatonEdge("3", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("4", "a"), new FiniteAutomatonEdge("5", "b")] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const res6 = a6.isDeterministic();
  expect(res6).toBe(false);
});

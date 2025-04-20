import { expect, test } from "vitest";
import { RemoveEpsilonAlgorithm } from "../src/engine/algorithm";
import { AutomatonCore } from "../src/core/automatonCore";
import { Automaton, AutomatonType } from "../src/engine/automaton/automaton";
import { ModeHolder } from "../src/core/core";
import { FiniteAutomatonEdge } from "../src/engine/automaton/edge";
import { ErrorMessage } from "../src/engine/common";
import { EPSILON } from "../src/constants";
import { AutomatonEditCommand } from "../src/engine/automaton/commands/edit";

test("testing algorithm functions", () => {
  //testing error throwing on wrong inputs
  let core = new AutomatonCore(AutomatonType.PDA, "test_core", new ModeHolder());
  let algorithm = new RemoveEpsilonAlgorithm(core);

  expect(algorithm.inputCore).toBe(core);
  expect(algorithm.results).toBeUndefined();
  expect(algorithm.index).toBe(0);
  expect(() => algorithm.init(new ModeHolder)).toThrowError("Cannot use algorithm, as it only works with finite automata.");

  core = new AutomatonCore(AutomatonType.FINITE, "test_core", new ModeHolder());
  algorithm = new RemoveEpsilonAlgorithm(core);

  core.automaton = new Automaton({
    states: ["q0", "q1", "q2"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", "a")], "q2":[new FiniteAutomatonEdge("2", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")] },
      "q2":{ "q0":[new FiniteAutomatonEdge("5", "a")], "q2":[new FiniteAutomatonEdge("6", "b")] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  //testing usage of next()/undo() before init()
  expect(() => algorithm.next()).toThrowError("Cannot simulate algorithm step before start.");
  let message = algorithm.undo();
  expect(message).toEqual(new ErrorMessage("Cannot undo algorithm step before start."));

  algorithm.init(new ModeHolder);
  expect(algorithm.results).toEqual([]);

  //testing usage of undo() before next()
  message = algorithm.undo();
  expect(message).toEqual(new ErrorMessage("There is nothing to undo."));

  expect(algorithm.next()).toBeUndefined();

  //second algorithm for testing undo() function
  const core2 = new AutomatonCore(AutomatonType.FINITE, "test_core2", new ModeHolder());
  const algorithm2 = new RemoveEpsilonAlgorithm(core2);
  core.automaton = new Automaton({
    states: ["q0", "q1", "q2"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", EPSILON)], "q2":[new FiniteAutomatonEdge("2", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")], "q2":[new FiniteAutomatonEdge("5", EPSILON)] },
      "q2":{ "q0":[new FiniteAutomatonEdge("6", "a")], "q2":[new FiniteAutomatonEdge("7", "b")] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });
  core2.automaton = new Automaton({
    states: ["q0", "q1", "q2"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", EPSILON)], "q2":[new FiniteAutomatonEdge("2", "b")] },
      "q1":{ "q1":[new FiniteAutomatonEdge("3", "a"), new FiniteAutomatonEdge("4", "b")], "q2":[new FiniteAutomatonEdge("5", EPSILON)] },
      "q2":{ "q0":[new FiniteAutomatonEdge("6", "a")], "q2":[new FiniteAutomatonEdge("7", "b")] }
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });
  algorithm.init(new ModeHolder());
  algorithm2.init(new ModeHolder());

  //testing if next + undo equals the original automaton
  const result1 = algorithm.next();
  core.automaton.executeCommand((result1?.command as AutomatonEditCommand));
  algorithm.undo();
  expect(core2.automaton).toEqual(core.automaton);

  //testing if next + undo + next return the same command as next
  const result2 = algorithm.next();
  core.automaton.executeCommand((result2?.command as AutomatonEditCommand));
  algorithm.undo();
  expect(result1).toEqual(result2);

  //testing if next + next + undo + undo equals the original automaton
  core2.automaton.executeCommand((algorithm2.next()?.command as AutomatonEditCommand));
  core2.automaton.executeCommand((algorithm2.next()?.command as AutomatonEditCommand));
  algorithm2.undo();
  algorithm2.undo();
  expect(core2.automaton).toEqual(core.automaton);

  //testing if next + undo works in the entire algorthm
  for (let i = 0; i < algorithm.results!.length - 1; i++) {
    core.automaton.executeCommand((algorithm.next()?.command as AutomatonEditCommand));
    core2.automaton.executeCommand((algorithm2.next()?.command as AutomatonEditCommand));
    expect(core2.automaton).toEqual(core.automaton);

    core.automaton.executeCommand((algorithm.next()?.command as AutomatonEditCommand));
    algorithm.undo();
    expect(core2.automaton).toEqual(core.automaton);
  }
});

test("testing algorithm corectness", () => {
    const core = new AutomatonCore(AutomatonType.FINITE, "test_core", new ModeHolder());
    const algorithm = new RemoveEpsilonAlgorithm(core);
  
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

    algorithm.init(new ModeHolder());

    //running the algorithm
    let result = algorithm.next();
    while (result !== undefined) {
      core.automaton.executeCommand((result.command as AutomatonEditCommand));
      result = algorithm.next();
    }

    //testing properities of the new automaton
    expect(core.automaton.states).toEqual(["q0", "q1", "q2", "q3"]);
    expect(core.automaton.finalStateIds).toEqual(["q1", "q3", "q0"]);
    expect(core.automaton.initialStateId).toBe("q0");
    expect(core.automaton.automatonType).toBe(AutomatonType.FINITE);

    expect(algorithm.hasEpsilonTransitions()).toBeFalsy();

    for (const state of ["q0", "q2"]){
      expect(core.automaton.deltaFunctionMatrix["q0"][state]).toHaveLength(1);
      expect(core.automaton.deltaFunctionMatrix["q0"][state][0].inputChar).toBe("a");
    }
    for (const state of ["q1", "q3"]){
      expect(core.automaton.deltaFunctionMatrix["q0"][state]).toHaveLength(2);
      expect(core.automaton.deltaFunctionMatrix["q0"][state][0].inputChar).toBeOneOf(["a", "b"]);
      expect(core.automaton.deltaFunctionMatrix["q0"][state][1].inputChar).toBeOneOf(["a", "b"]);  
    }

    for (const state of ["q0", "q2"]){
        expect(core.automaton.deltaFunctionMatrix["q1"][state]).toHaveLength(1);
        expect(core.automaton.deltaFunctionMatrix["q1"][state][0].inputChar).toBe("a");
    }
    expect(core.automaton.deltaFunctionMatrix["q1"]["q1"]).toHaveLength(2);
    expect(core.automaton.deltaFunctionMatrix["q1"]["q1"][0].inputChar).toBeOneOf(["a", "b"]);
    expect(core.automaton.deltaFunctionMatrix["q1"]["q1"][1].inputChar).toBeOneOf(["a", "b"]);
    expect(core.automaton.deltaFunctionMatrix["q1"]["q3"]).toBeUndefined();

    expect(core.automaton.deltaFunctionMatrix["q2"]).toEqual({"q0":[]});
    expect(core.automaton.deltaFunctionMatrix["q3"]).toBeUndefined();
  });

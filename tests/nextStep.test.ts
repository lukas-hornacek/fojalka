import { expect, test } from "vitest";
import { NextStepCommand } from "../src/engine/automaton/commands/run";
import { AddEdgeCommand, AddStateCommand } from "../src/engine/automaton/commands/edit";
import { Automaton, AutomatonType } from "../src/engine/automaton/automaton.ts";
import { FiniteAutomatonEdge, PDAEdge } from "../src/engine/automaton/edge.ts";
import { FiniteConfiguration, NFAConfiguration, NPDAConfiguration, PDAConfiguration } from "../src/engine/automaton/configuration.ts";
import { AutomatonSimulation } from "../src/engine/automaton/simulation.ts";
import { AbstractAutomatonFactory } from "../src/engine/automaton/factories";
import { EPSILON, INITIAL_STACK_SYMBOL } from "../src/constants.ts";
import { RunStoppedErrorMessage } from "../src/engine/common.ts";

test("nextStepCommand Visitor test", () =>{
  const factory = new AbstractAutomatonFactory(AutomatonType.FINITE);

  const automaton = factory.createAutomaton("0");

  expect(automaton.initialStateId).toBe("0");

  const addState = new AddStateCommand(automaton, "1");
  automaton.executeCommand(addState);
  const addEdge = new AddEdgeCommand(automaton, "0", "1", new FiniteAutomatonEdge("0", "a"));
  automaton.executeCommand(addEdge);

  const configuration = new FiniteConfiguration("0", ["a", "b", "c"]);

  const simulation = new AutomatonSimulation(automaton, configuration);
  const command = new NextStepCommand(simulation);
  expect(simulation.configuration.stateId).toBe("0");

  const error = simulation.executeCommand(command);

  expect (error).toBe(undefined);
  expect (command.result?.id).toBe("0");
  expect (simulation.configuration.stateId).toBe("1");

});

test("next step on PDA test", () =>{
  const factory = new AbstractAutomatonFactory(AutomatonType.PDA);

  const automaton1 = factory.createAutomaton("0");

  automaton1.executeCommand(new AddStateCommand(automaton1, "1"));
  automaton1.executeCommand(new AddStateCommand(automaton1, "2"));

  automaton1.executeCommand(new AddEdgeCommand(automaton1, "0", "1", factory.createEdge({ id: "", inputChar: "a", readStackChar: "Z0", writeStackWord: ["a"] })));
  automaton1.executeCommand(new AddEdgeCommand(automaton1, "0", "1", factory.createEdge({ id: "", inputChar: "b", readStackChar: "Z0", writeStackWord: ["b"] })));

  const configuration1 = new PDAConfiguration("0", ["b", "b", "a"], ["Z0"]);
  const simulation1 = new AutomatonSimulation(automaton1, configuration1);
  const command1 = new NextStepCommand(simulation1);

  const error = simulation1.executeCommand(command1);
  expect (error).toBe(undefined);

  expect (command1.result).toBeInstanceOf(PDAEdge);
  if (command1.result instanceof PDAEdge) {
    expect (command1.result?.id).toBe("_1");
    expect (command1.result?.writeStackWord).toStrictEqual(["b"]);
  }

  expect (simulation1.configuration).toBeInstanceOf(PDAConfiguration);
  if (simulation1.configuration instanceof PDAConfiguration) {
    expect (simulation1.configuration.stateId).toBe("1");
    expect (simulation1.configuration.remainingInput).toStrictEqual(["b", "a"]);
    expect (simulation1.configuration.stack).toStrictEqual(["b"]);
  }

  const automaton2 = factory.createAutomaton("0");

  automaton2.executeCommand(new AddStateCommand(automaton2, "1"));

  automaton2.executeCommand(new AddEdgeCommand(automaton2, "0", "1", new FiniteAutomatonEdge("0", "a")));
  automaton2.executeCommand(new AddEdgeCommand(automaton2, "0", "1", factory.createEdge({ id: "", inputChar: "b", readStackChar: "Z0", writeStackWord: ["b"] })));

  const configuration2 = new PDAConfiguration("0", ["a"], ["Z0"]);
  const simulation2 = new AutomatonSimulation(automaton2, configuration2);
  const command2 = new NextStepCommand(simulation2);

  const error2 = simulation2.executeCommand(command2);
  expect (error2).not.toBeUndefined();

  const automaton3 = factory.createAutomaton("0");

  automaton3.executeCommand(new AddStateCommand(automaton3, "1"));

  automaton3.executeCommand(new AddEdgeCommand(automaton3, "0", "1", factory.createEdge({ id: "", inputChar: "a", readStackChar: "Z0", writeStackWord: ["a"] })));
  automaton3.executeCommand(new AddEdgeCommand(automaton3, "0", "1", factory.createEdge({ id: "", inputChar: "b", readStackChar: "Z0", writeStackWord: ["b"] })));

  const configuration3_1 = new PDAConfiguration("0", ["c"], ["Z0"]);
  const configuration3_2 = new PDAConfiguration("0", ["a"], ["b"]);

  const simulation3_1 = new AutomatonSimulation(automaton3, configuration3_1);
  const simulation3_2 = new AutomatonSimulation(automaton3, configuration3_2);

  const error3_1 = simulation3_1.executeCommand(new NextStepCommand(simulation3_1));
  const error3_2 = simulation3_2.executeCommand(new NextStepCommand(simulation3_2));

  expect (error3_1).not.toBeUndefined();
  expect (error3_2).not.toBeUndefined();
});

test("non-deterministic finite nextStep test", () => {
  const a1 = new Automaton({
    states: ["q0", "q1"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", "a")], "q0":[new FiniteAutomatonEdge("2", "b"), new FiniteAutomatonEdge("3", EPSILON)] },
      "q1":{ "q1":[new FiniteAutomatonEdge("4", "a"), new FiniteAutomatonEdge("5", "b")] },
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const simulation1 = a1.createRunSimulation(["a"]);
  const configuration1 = simulation1.configuration;

  expect (configuration1).toBeInstanceOf(NFAConfiguration);

  const nextStep1 = new NextStepCommand(simulation1);
  const error1 = simulation1.executeCommand(nextStep1);
  expect (error1).toBeUndefined();

  const edgeUsed1 = nextStep1.result;
  expect (edgeUsed1).not.toBeUndefined();
  console.log(edgeUsed1);
  expect (edgeUsed1?.inputChar).toBeOneOf([EPSILON, "a"]);

  const a2 = new Automaton({
    states: ["q0", "q1"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new FiniteAutomatonEdge("1", "a")] },
      "q1":{},
    },
    automatonType: AutomatonType.FINITE,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const simulation2 = a2.createRunSimulation(["a", "b"]);
  const configuration2 = simulation2.configuration;

  expect (configuration2).toBeInstanceOf(NFAConfiguration);
  const nextStep2_1 = new NextStepCommand(simulation2);
  const error2_1 = simulation2.executeCommand(nextStep2_1);
  expect (error2_1).toBeUndefined();

  const edgeUsed2_1 = nextStep2_1.result;
  expect (edgeUsed2_1).not.toBeUndefined();
  console.log(edgeUsed2_1);
  expect (edgeUsed2_1?.inputChar).toBe("a");

  const nextStep2_2 = new NextStepCommand(simulation2);
  const error2_2 = simulation2.executeCommand(nextStep2_2);
  expect (error2_2).not.toBeUndefined();
  expect (error2_2).toBeInstanceOf(RunStoppedErrorMessage);
});

test ("non-deterministic PDA nextStep test", () => {
  const a1 = new Automaton({
    states: ["q0", "q1"],
    deltaFunctionMatrix: {
      "q0":{ "q1":[new PDAEdge("1", "a", INITIAL_STACK_SYMBOL, ["a"]), new PDAEdge("2", EPSILON, INITIAL_STACK_SYMBOL,
        [INITIAL_STACK_SYMBOL, "a"])], "q0":[new PDAEdge("3", "a", "a", ["a"])] },
      "q1":{}
    },
    automatonType: AutomatonType.PDA,
    initialStateId: "q0",
    finalStateIds: ["q1"]
  });

  const simulation1 = a1.createRunSimulation(["a", "a"]);
  const configuration1 = simulation1.configuration;

  expect (configuration1).toBeInstanceOf(NPDAConfiguration);
  const nextStep1 = new NextStepCommand(simulation1);
  const error1 = simulation1.executeCommand(nextStep1);
  expect (error1).toBeUndefined();
  const edgeUsed1 = nextStep1.result;
  expect (edgeUsed1).not.toBeUndefined();
  console.log(edgeUsed1);
  expect (edgeUsed1?.inputChar).toBeOneOf([EPSILON, "a"]);

  const nextStep2 = new NextStepCommand(simulation1);
  const error2 = simulation1.executeCommand(nextStep2);
  expect (error2).not.toBeUndefined();
  expect (error2).toBeInstanceOf(RunStoppedErrorMessage);
});

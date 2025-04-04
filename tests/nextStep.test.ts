import { expect, test } from "vitest";
import { NextStepCommand } from "../src/types/commands/run";
import { AddEdgeCommand, AddStateCommand } from "../src/types/commands/edit";
import { AutomatonType, FiniteAutomatonEdge, FiniteConfiguration, Simulation } from "../src/types/types";
import { AbstractAutomatonFactory } from "../src/types/factories";

test("nextStepCommand Visitor test", () =>{
  const factory = new AbstractAutomatonFactory(AutomatonType.FINITE);

  const automaton = factory.createAutomaton("0");

  expect(automaton.initialStateId).toBe("0");

  const addState = new AddStateCommand(automaton, "1");
  automaton.executeCommand(addState);
  const addEdge = new AddEdgeCommand(automaton, "0", "1", new FiniteAutomatonEdge("0", "a"));
  automaton.executeCommand(addEdge);

  const configuration = new FiniteConfiguration("0", ["a", "b", "c"]);

  const simulation = new Simulation(automaton, configuration);
  const command = new NextStepCommand(simulation);
  expect(simulation.configuration.stateId).toBe("0");
  simulation.executeCommand(command);
  expect (command.result?.id).toBe("0");
  expect (simulation.configuration.stateId).toBe("1");

});

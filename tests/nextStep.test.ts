import { expect, test } from "vitest";
import {AutomatonType, FiniteAutomatonEdge, FiniteConfiguration, Simulation} from "../src/types/types";
import {AbstractAutomatonFactory} from "../src/types/factories";
import { NextStepCommand } from "../src/types/commands/run";


test("nextStepCommand Visitor test", () =>{
    const factory = new AbstractAutomatonFactory ( AutomatonType.FINITE );
    
    const automaton = factory.createAutomaton("0");

    expect(automaton.initialStateId).toBe("0");

    automaton.deltaFunctionMatrix["0"] = {};
    automaton.deltaFunctionMatrix["0"]["1"] = [];
    automaton.deltaFunctionMatrix["0"]["1"].push( new FiniteAutomatonEdge("0", "a"));


    const configuration = new FiniteConfiguration("0",["a","b","c"]);

    const simulation = new Simulation(automaton, configuration);
    const command = new NextStepCommand(simulation);
    expect( simulation.configuration.stateId ).toBe("0");
    simulation.executeCommand(command );
    expect (command.result?.id).toBe("0");
    expect( simulation.configuration.stateId ).toBe("1");

});
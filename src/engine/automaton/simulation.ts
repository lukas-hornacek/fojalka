import { RunCommand, NextStepCommand } from "./commands/run";
import { IAutomaton } from "./automaton";
import { IAutomatonConfiguration } from "./configuration";

export interface ISimulation {
  automaton: IAutomaton;
  configuration: IAutomatonConfiguration;
  commandHistory: RunCommand<unknown>[];

  executeCommand(command: RunCommand<unknown>): void; // if (command.execute()) { commandHistory.push(command); }
  undo(): void; // command = commandHistory.pop(); command.undo();
  run(): void;
}

export class Simulation implements ISimulation {
  automaton: IAutomaton;
  configuration: IAutomatonConfiguration;
  commandHistory: RunCommand<unknown>[];

  constructor(_automaton: IAutomaton, _configuration: IAutomatonConfiguration) {
    this.automaton = _automaton;
    this.configuration = _configuration;
    this.commandHistory = [];
  }

  executeCommand(command: RunCommand<unknown>): void {
    if (command.execute() === undefined) {
      this.commandHistory.push(command);
    }
    //TODO else if error respond to it
  }

  undo(): void {
    const command = this.commandHistory.pop();
    if (command === undefined) {
      return;
    } else {
      command.undo();
    }
  }

  // simulates the entire run on the word in configuration (or the remaining word) and returns true if the
  // last state is accepting and false if it isn't
  run(): boolean {
    while (this.configuration.remainingInput.length > 0) {
      const nextCommand = new NextStepCommand(this);
      if (nextCommand.execute() === undefined) {
        this.commandHistory.push(nextCommand);
      }
    //TODO else if error respond to it
    }
    return this.automaton.finalStateIds.some(finalStateId => this.configuration.stateId === finalStateId);
  }
}

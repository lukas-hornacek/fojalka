import { AutomatonRunCommand, NextStepCommand } from "./commands/run";
import { IAutomaton } from "./automaton";
import { IAutomatonConfiguration } from "./configuration";
import { ErrorMessage, IErrorMessage, RunStoppedErrorMessage } from "../common";

export interface IAutomatonSimulation {
  automaton: IAutomaton;
  configuration: IAutomatonConfiguration;
  commandHistory: AutomatonRunCommand<unknown>[];

  executeCommand(command: AutomatonRunCommand<unknown>): IErrorMessage | undefined; // if (command.execute()) { commandHistory.push(command); }
  undo(): IErrorMessage | undefined;
  run(): IErrorMessage | boolean;
}

export class AutomatonSimulation implements IAutomatonSimulation {
  automaton: IAutomaton;
  configuration: IAutomatonConfiguration;
  commandHistory: AutomatonRunCommand<unknown>[];

  constructor(_automaton: IAutomaton, _configuration: IAutomatonConfiguration) {
    this.automaton = _automaton;
    this.configuration = _configuration;
    this.commandHistory = [];
  }

  executeCommand(command: AutomatonRunCommand<unknown>): IErrorMessage | undefined {
    const error = command.execute();
    if (error !== undefined) {
      return error;
    }
    this.commandHistory.push(command);
  }

  undo(): IErrorMessage | undefined {
    const command = this.commandHistory.pop();
    if (command === undefined) {
      return new ErrorMessage("Cannot undo because command history is empty.");
    }
    command.undo();
  }

  // simulates the entire run on the word in configuration (or the remaining word) and returns true if the
  // last state is accepting and false if it isn't
  run(): IErrorMessage | boolean {
    while (this.configuration.remainingInput.length > 0) {
      const nextCommand = new NextStepCommand(this);
      const error = nextCommand.execute();
      if (error !== undefined) {
        // if run stopped, that means no possible steps from given configuration without reading the full input we reject the word
        if (error instanceof RunStoppedErrorMessage) {
          return false;
        }
        else {
          return error;
        }
      }
      else {
        this.commandHistory.push(nextCommand);
      }
    }
    return this.automaton.finalStateIds.some(finalStateId => this.configuration.stateId === finalStateId);
  }
}

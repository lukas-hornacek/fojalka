import {
  FiniteConfiguration,
  IAutomaton,
  IConfigurationVisitor,
  PDAConfiguration
} from "../types.ts";

export class NextStepVisitor implements IConfigurationVisitor {
  automaton: IAutomaton;

  constructor(_automaton: IAutomaton) {
    this.automaton = _automaton;
  }

  visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration {
    // TODO implement: Based on this.automaton and configuration, calculate the next step configuration for FA
    return configuration; // TODO remove, just a dummy return
  };

  visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration {
    // TODO implement: Based on this.automaton and configuration, calculate the next step configuration for PDA
    return configuration; // TODO remove, just a dummy return
  };
}

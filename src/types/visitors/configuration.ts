import {
  FiniteConfiguration,
  IAutomaton,
  IConfigurationVisitor,
  IEdge,
  PDAConfiguration,
} from "../types.ts";

export class NextStepVisitor implements IConfigurationVisitor {
  automaton: IAutomaton;
  result?: IEdge;

  constructor(_automaton: IAutomaton) {
    this.automaton = _automaton;
  }

  // Finite Automata visit command, preforms the next step command based on the finite configuration
  // (which has currnet StateId and next symbol) and the FiniteAutomaton in this.automaton (using the deltaFunction)
  // stores the edge traversed in this.result
  visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration {
    if (configuration.remainingInput.length == 0) {
      return configuration;
    }
    const nextSymbol = configuration.remainingInput[0];

    let nextState: string | undefined;
    const delta = this.automaton.deltaFunctionMatrix[configuration.stateId];
    for (const fromState in delta) {
      const edges = delta[fromState];
      for (let i = 0; i < edges.length; i++) { 
        if (edges[i].inputChar == nextSymbol) {
          nextState = fromState;
          this.result = edges[i];
        }
      }
    }

    if (nextState === undefined) {
      return configuration;
    } else {
      const newConfiguration = new FiniteConfiguration(nextState, configuration.remainingInput.slice(1));
      return newConfiguration;
    }
  };

  visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration {
    // TODO implement: Based on this.automaton and configuration, calculate the next step configuration for PDA
    return configuration; // TODO remove, just a dummy return
  };
}

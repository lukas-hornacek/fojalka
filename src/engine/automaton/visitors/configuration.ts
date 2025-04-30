import { IEdge, PDAEdge } from "../edge.ts";
import { AutomatonType, IAutomaton } from "../automaton.ts";
import { FiniteConfiguration, PDAConfiguration } from "../configuration.ts";

export interface IConfigurationVisitor {
  visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration;
  visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration;
}

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
    if (configuration.remainingInput.length === 0) {
      throw new Error("Input end reached");
    }
    const nextSymbol = configuration.remainingInput[0];

    let nextState: string | undefined;
    const delta = this.automaton.deltaFunctionMatrix[configuration.stateId];
    for (const fromState in delta) {
      const edges = delta[fromState];
      for (let i = 0; i < edges.length; i++) {
        if (edges[i].inputChar === nextSymbol) {
          nextState = fromState;
          this.result = edges[i];
        }
      }
    }

    if (nextState === undefined) {
      throw new Error("Step for the symbol doesn't exist in the delta function");
    } else {
      const newConfiguration = new FiniteConfiguration(nextState, configuration.remainingInput.slice(1));
      return newConfiguration;
    }
  };

  visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration {
    if (configuration.remainingInput.length === 0) {
      throw new Error("Input end reached");
    }

    if (this.automaton.automatonType != AutomatonType.PDA) {
      throw new Error("Wrong automaton type");
    }

    const nextSymbol = configuration.remainingInput[0];
    const stackSymbol = configuration.stack[configuration.stack.length - 1];

    let nextState: string | undefined;
    let stackWrite: string[] | undefined;
    const delta = this.automaton.deltaFunctionMatrix[configuration.stateId];
    for (const fromState in delta) {
      const edges = delta[fromState];
      for (let i = 0; i < edges.length; i++) {
        const pdaEdge = edges[i];
        if (pdaEdge instanceof PDAEdge) {
          if (pdaEdge.inputChar === nextSymbol && pdaEdge.readStackChar === stackSymbol) {
            nextState = fromState;
            stackWrite = pdaEdge.writeStackWord;
            this.result = edges[i];
          }
        }
        else {
          // Not sure, maybe we can just skip edges in delta function that are not of correct type
          // the way I implemented it now, will throw if there is a single edge of incorrect type, even if it isn't
          // the one we are looking for
          throw new Error("AutomatonType is pushDown but one of its edges isn't");
        }
      }
    }

    if (nextState === undefined || stackWrite === undefined) {
      throw new Error("Step for the (symbol, top of stack) combination in the delta function doesn't exist");
    }
    else {
      const newStack: string [] = configuration.stack.slice(0, -1).concat(stackWrite);
      return new PDAConfiguration(nextState, configuration.remainingInput.slice(1), newStack);
    }
  };
}

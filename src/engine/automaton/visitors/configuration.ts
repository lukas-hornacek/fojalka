import { FiniteAutomatonEdge, IEdge, PDAEdge } from "../edge.ts";
import { AutomatonType, IAutomaton } from "../automaton.ts";
import { FiniteConfiguration, NFAConfiguration, NPDAConfiguration, PDAConfiguration } from "../configuration.ts";
import { EPSILON } from "../../../constants.ts";
import { RunStoppedError } from "../../common.ts";

export interface IConfigurationVisitor {
  visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration;
  visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration;
  visitNFAConfiguration(configuration: NFAConfiguration): NFAConfiguration;
  visitNPDAConfiguration(configuration: NPDAConfiguration): NPDAConfiguration;
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
    if (this.automaton.automatonType != AutomatonType.FINITE) {
      throw new Error("Wrong automaton type");
    }
    const nextSymbol = configuration.remainingInput[0];

    let nextState: string | undefined;
    const delta = this.automaton.deltaFunctionMatrix[configuration.stateId];
    for (const toState in delta) {
      const edges = delta[toState];
      for (let i = 0; i < edges.length; i++) {
        if (edges[i].inputChar === nextSymbol) {
          nextState = toState;
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
    findEdge:
    for (const toState in delta) {
      const edges = delta[toState];
      for (let i = 0; i < edges.length; i++) {
        const pdaEdge = edges[i];
        if (pdaEdge instanceof PDAEdge) {
          if (pdaEdge.inputChar === nextSymbol && pdaEdge.readStackChar === stackSymbol) {
            nextState = toState;
            stackWrite = pdaEdge.writeStackWord;
            this.result = edges[i];
            break findEdge;
          }
        }
        else {
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

  // this to be simmilair to deterministic finite, only go through all of delta function for given symbol,
  // put correct steps in a list, then add some probilistic generator that picks the next Step
  // if the list is empty, we just throw
  visitNFAConfiguration(configuration: NFAConfiguration): NFAConfiguration {
    if (configuration.remainingInput.length === 0) {
      throw new Error("Input end reached");
    }

    if (this.automaton.automatonType != AutomatonType.FINITE) {
      throw new Error("Wrong automaton type");
    }
    const nextSymbol = configuration.remainingInput[0];

    type EdgeStatePair = {
      edge: FiniteAutomatonEdge;
      state: string;
    };
    const nextEdgeList: EdgeStatePair[] = [];

    const delta = this.automaton.deltaFunctionMatrix[configuration.stateId];
    for (const toState in delta) {
      const edges = delta[toState];
      for (let i = 0; i < edges.length; i++) {
        if (edges[i].inputChar === nextSymbol || edges[i].inputChar === EPSILON) {
          const pair: EdgeStatePair = {
            edge: edges[i],
            state: toState,
          };
          nextEdgeList.push(pair);
        }
      }
    }
    if (nextEdgeList.length === 0) {
      throw new RunStoppedError(
        "No posible next step from this state and input symbol. Automaton is at a dead end. This may be caused by non-determinism, if you want  a different run try running the simulation again or undoing the last step"
      );
    }
    else {
      let m: number;
      if (nextEdgeList.length === 1) {
        m = 0;
      }
      else {
        m = Math.floor(Math.random() * nextEdgeList.length);
      }
      const edgeUSed = nextEdgeList[m];
      this.result = edgeUSed.edge;
      if (edgeUSed.edge.inputChar === EPSILON) {
        return new NFAConfiguration(edgeUSed.state, configuration.remainingInput);
      }
      else {
        return new NFAConfiguration(edgeUSed.state, configuration.remainingInput.slice(1));
      }
    }
  }

  visitNPDAConfiguration(configuration: NPDAConfiguration): NPDAConfiguration {
    if (configuration.remainingInput.length === 0) {
      throw new Error("Input end reached");
    }

    if (this.automaton.automatonType != AutomatonType.PDA) {
      throw new Error("Wrong automaton type");
    }

    const nextSymbol = configuration.remainingInput[0];
    const stackSymbol = configuration.stack[configuration.stack.length - 1];

    type EdgeStatePair = {
      edge: PDAEdge;
      state: string;
    };
    const nextEdgeList: EdgeStatePair[] = [];

    const delta = this.automaton.deltaFunctionMatrix[configuration.stateId];
    for (const toState in delta) {
      const edges = delta[toState];
      for (let i = 0; i < edges.length; i++) {
        const pdaEdge = edges[i];
        if (pdaEdge instanceof PDAEdge) {
          if ((pdaEdge.inputChar === nextSymbol || pdaEdge.inputChar === EPSILON) && pdaEdge.readStackChar === stackSymbol) {
            const pair: EdgeStatePair = {
              edge: pdaEdge,
              state: toState,
            };
            nextEdgeList.push(pair);
          }
        }
        else {
          throw new Error("AutomatonType is pushDown but one of its edges isn't");
        }
      }
    }

    if (nextEdgeList.length === 0) {
      throw new RunStoppedError("No posible next step from this state and input symbol.");
    }
    else {
      let m: number;
      if (nextEdgeList.length === 1) {
        m = 0;
      }
      else {
        m = Math.floor(Math.random() * nextEdgeList.length);
      }
      const edgeUSed = nextEdgeList[m];
      this.result = edgeUSed.edge;
      const newStack: string [] = configuration.stack.slice(0, -1).concat(edgeUSed.edge.writeStackWord);
      if (edgeUSed.edge.inputChar === EPSILON) {
        return new NPDAConfiguration (edgeUSed.state, configuration.remainingInput, newStack);
      }
      else {
        return new NPDAConfiguration(edgeUSed.state, configuration.remainingInput.slice(1), newStack);
      }
    }
  };
}

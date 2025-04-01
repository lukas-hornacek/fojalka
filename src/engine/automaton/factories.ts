import { Automaton, AutomatonType, IAutomaton } from "./automaton.ts";
import { IEdge, FiniteAutomatonEdge, PDAEdge } from "./edge.ts";

export interface IUniversalEdgeProps {
  id: string,
  inputChar: string;
  readStackChar?: string;
  writeStackWord?: string[];
}

export interface IAutomatonFactory {
  createAutomaton(initialStateId: string): IAutomaton;
  createEdge(edgeProps: IUniversalEdgeProps): IEdge;
}

export class AbstractAutomatonFactory implements IAutomatonFactory {
  internalFactory: IAutomatonFactory;

  constructor(automatonType: AutomatonType) {
    if (automatonType === AutomatonType.FINITE) {
      this.internalFactory = new FiniteAutomatonFactory();
    } else if (automatonType === AutomatonType.PDA) {
      this.internalFactory = new PDAFactory();
    } else {
      const supportedTypes = [AutomatonType.FINITE, AutomatonType.PDA];
      throw new Error(
        `Unsupported automaton type: ${automatonType}. Supported types are ${JSON.stringify(supportedTypes)}.`
      );
    }
  }

  createAutomaton(initialStateId: string): IAutomaton {
    return this.internalFactory.createAutomaton(initialStateId);
  }

  createEdge(edgeProps: IUniversalEdgeProps): IEdge {
    return this.internalFactory.createEdge(edgeProps);
  }
}

export class FiniteAutomatonFactory implements IAutomatonFactory {
  createAutomaton(initialStateId: string): IAutomaton {
    return new Automaton({
      states: [initialStateId],
      deltaFunctionMatrix: {},
      automatonType: AutomatonType.FINITE,
      initialStateId,
      finalStateIds: [],
    });
  }

  createEdge(edgeProps: IUniversalEdgeProps): IEdge {
    return new FiniteAutomatonEdge(
      edgeProps.id,
      edgeProps.inputChar,
    );
  }
}

export class PDAFactory implements IAutomatonFactory {
  createAutomaton(initialStateId: string): IAutomaton {
    return new Automaton({
      states: [initialStateId],
      deltaFunctionMatrix: {},
      automatonType: AutomatonType.PDA,
      initialStateId,
      finalStateIds: [],
    });
  }

  createEdge(edgeProps: IUniversalEdgeProps): IEdge {
    if (!edgeProps.readStackChar || !edgeProps.writeStackWord) {
      throw new Error("Cannot create PDAEdge without both readStackChar and writeStackWord arguments");
    }
    return new PDAEdge(
      edgeProps.id,
      edgeProps.inputChar,
      edgeProps.readStackChar,
      edgeProps.writeStackWord,
    );
  }
}

import {
  AutomatonType,
  EditCommand,
  FiniteAutomatonEdge,
  IAutomaton,
  IAutomatonMemento,
  IEdge,
  PDAEdge,
} from "./types.ts";

interface IUniversalEdgeProps {
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
      states: [],
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
      states: [],
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

export type AutomatonParams = {
  states: string[];
  deltaFunctionMatrix: Record<string, Record<string, IEdge[]>>;
  automatonType: AutomatonType;
  initialStateId: string;
  finalStateIds: string[];
};

export class Automaton implements IAutomaton {
  states: string[];
  deltaFunctionMatrix: Record<string, Record<string, IEdge[]>>;
  automatonType: AutomatonType;
  commandHistory: EditCommand<unknown>[];
  initialStateId: string;
  finalStateIds: string[];

  constructor({
    states = [],
    deltaFunctionMatrix = {},
    automatonType,
    initialStateId,
    finalStateIds = [],
  }: AutomatonParams) {
    this.states = states;
    this.commandHistory = [];
    this.automatonType = automatonType;
    this.deltaFunctionMatrix = deltaFunctionMatrix;
    this.initialStateId = initialStateId;
    this.finalStateIds = finalStateIds;
  }

  executeCommand(command: EditCommand<unknown>): void {
    const maybeErrorMessage = command.execute();
    if (maybeErrorMessage === undefined) {
      this.commandHistory.push(command);
    } else {
      throw new Error(maybeErrorMessage.details);
    }
  }

  undo(): void {
    const command = this.commandHistory.pop();
    if (command) {
      command.undo();
    }
  }

  save(): IAutomatonMemento {
    return new AutomatonMemento(
      this.states, this.deltaFunctionMatrix, this.automatonType
    );
  }
  restore(memento: IAutomatonMemento): void {
    this.states = memento.states;
    this.deltaFunctionMatrix = memento.deltaFunctionMatrix;
    this.automatonType = memento.automatonType;
  }
}

class AutomatonMemento implements IAutomatonMemento {
  states: string[];
  automatonType: AutomatonType;
  deltaFunctionMatrix: Record<string, Record<string, Array<IEdge>>>;

  constructor(
    _states: string[],
    _deltaFunctionMatrix: Record<string, Record<string, Array<IEdge>>>,
    _automatonType: AutomatonType
  ) {
    this.states = _states;
    this.deltaFunctionMatrix = _deltaFunctionMatrix;
    this.automatonType = _automatonType;
  }
}

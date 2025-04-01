import { AddEdgeCommand, AddStateCommand, RemoveEdgeCommand, RemoveStateCommand } from "./types/commands/edit";
import { IErrorMessage } from "./types/common";
import { IAutomatonFactory, AbstractAutomatonFactory, IUniversalEdgeProps } from "./types/factories";
import { IAutomaton, ISimulation, AutomatonType, EditCommand, IEdge } from "./types/types";

export interface IEngine {
  undo: () => IErrorMessage | undefined;
  addState: (id: string) => IErrorMessage | undefined;
  removeState: (id: string) => IErrorMessage | undefined;
  addEdge: (from: string, to: string, props: IUniversalEdgeProps) => IErrorMessage | undefined;
  removeEdge: (from: string, to: string, id: string) => IErrorMessage | undefined;
}

export class Engine implements IEngine {
  // used to create automata and edges
  factory: IAutomatonFactory;
  // the automaton in first window, which is always present
  automaton: IAutomaton;
  // optional automaton in second window, which can be used to visualise algorithms
  secondaryAutomaton?: IAutomaton;
  // optionally hold current simulation
  // the simulation also contains configuration
  simulation?: ISimulation;

  constructor(type: AutomatonType) {
    this.factory = new AbstractAutomatonFactory(type);
    this.automaton = this.factory.createAutomaton("q_0");
  }

  undo() {
    return this.automaton.undo();
  }

  addState(id: string) {
    const command: EditCommand = new AddStateCommand(this.automaton!, id);

    return this.automaton.executeCommand(command);
  };

  removeState(id: string) {
    const command: EditCommand = new RemoveStateCommand(this.automaton!, id);

    return this.automaton.executeCommand(command);
  }

  addEdge(from: string, to: string, props: IUniversalEdgeProps) {
    const edge: IEdge = this.factory.createEdge(props);
    const command: EditCommand = new AddEdgeCommand(this.automaton!, from, to, edge);

    return this.automaton.executeCommand(command);
  }

  removeEdge(from: string, to: string, id: string) {
    const command: EditCommand = new RemoveEdgeCommand(this.automaton!, from, to, id);

    return this.automaton.executeCommand(command);
  }
}

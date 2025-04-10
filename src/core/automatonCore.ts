import { AutomatonType, IAutomaton } from "../engine/automaton/automaton";
import { AbstractAutomatonFactory, IAutomatonFactory, IUniversalEdgeProps } from "../engine/automaton/factories";
import { IErrorMessage, ErrorMessage } from "../engine/common";
import { IAutomatonVisual, AutomatonVisual } from "../visual/automatonVisual";
import { Kind } from "./core";
import { IEdge } from "../engine/automaton/edge";
import { IEditCommandVisitor, VisualVisitor } from "../engine/automaton/visitors/editCommand";
import { ISimulation } from "../engine/automaton/simulation";
import { EditCommand, AddStateCommand, RemoveStateCommand, AddEdgeCommand, EditEdgeCommand, RemoveEdgeCommand, RenameStateCommand, SetInitialStateCommand, SetStateFinalFlagCommand } from "../engine/automaton/commands/edit";
import { NextStepCommand } from "../engine/automaton/commands/run";
import { INITIAL_STATE } from "../constants";

export interface IAutomatonCore {
  kind: Kind.AUTOMATON;
  automaton: IAutomaton;

  // called from AutomatonWindow, which own the Cytoscape HTML element
  init: () => IErrorMessage | undefined;

  // centers the Cytoscape window to show the entire automaton
  fit: () => void;

  // edit functions
  addState: (id: string, position: { x: number, y: number }) => IErrorMessage | undefined;
  removeState: (id: string) => IErrorMessage | undefined;
  renameState: (id: string, newId: string) => IErrorMessage | undefined;
  setInitialState: (id: string) => IErrorMessage | undefined;
  setIsFinalState: (id: string, isFinalState: boolean) => IErrorMessage | undefined;

  addEdge: (from: string, to: string, props: IUniversalEdgeProps) => IErrorMessage | undefined;
  removeEdge: (from: string, to: string, id: string) => IErrorMessage | undefined;
  editEdge: (from: string, to: string, id: string, props: IUniversalEdgeProps) => IErrorMessage | undefined;

  undo: () => IErrorMessage | undefined;

  // run functions
  containsWord: (word: string[]) => boolean;
  runStart: (word: string[]) => void;
  runNext: () => IErrorMessage | undefined;
  runUndo: () => IErrorMessage | undefined;

  highlight: (ids: string[]) => IErrorMessage | undefined;

  // provides access to factory method that is needed by IAlgorithm
  // should not be used for other purposes, as it does not update either engine or visual components
  createEdge(edgeProps: IUniversalEdgeProps): IEdge;
  // needed by algorithm to visualise individual commands
  visitor: IEditCommandVisitor;
}

export class AutomatonCore implements IAutomatonCore {
  kind = Kind.AUTOMATON as const;

  automatonType: AutomatonType;
  visual: IAutomatonVisual;
  visitor: IEditCommandVisitor;

  // used to create automata and edges
  factory: IAutomatonFactory;
  automaton: IAutomaton;
  // optionally hold current simulation
  // the simulation also contains configuration
  simulation?: ISimulation;

  constructor(automatonType: AutomatonType, id: string) {
    this.automatonType = automatonType;
    this.factory = new AbstractAutomatonFactory(automatonType);
    this.automaton = this.factory.createAutomaton(INITIAL_STATE);
    this.visual = new AutomatonVisual(id);
    this.visitor = new VisualVisitor(this.visual);
  }

  init(): undefined {
    this.visual.init();
  }

  undo() {
    // TODO refactor this to return information that can be used to reflect changes in visual
    this.automaton.undo();
    return new ErrorMessage("Not implemented.");
  }

  fit() {
    this.visual.fit();
  }

  addState(id: string, position: { x: number, y: number }) {
    let error = this.checkStateId(id);
    if (error !== undefined) {
      return error;
    }

    const command: EditCommand = new AddStateCommand(this.automaton, id);
    error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    // this does not use visitor (at least not yet) because the visitor does not accept position
    this.visual.addNode(id, position);
  }

  removeState(id: string) {
    let error = this.checkStateId(id);
    if (error !== undefined) {
      return error;
    }

    const command: EditCommand = new RemoveStateCommand(this.automaton, id);
    error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  renameState(id: string, newId: string) {
    const command: EditCommand = new RenameStateCommand(this.automaton, id, newId);
    const error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  setInitialState(id: string) {
    const command: EditCommand = new SetInitialStateCommand(this.automaton, id);
    const error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  setIsFinalState(id: string, isFinalState: boolean) {
    const command: EditCommand = new SetStateFinalFlagCommand(this.automaton, id, isFinalState);
    const error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  addEdge(from: string, to: string, props: IUniversalEdgeProps) {
    let error = this.checkEdgeProps(props);
    if (error !== undefined) {
      return error;
    }

    const edge: IEdge = this.factory.createEdge(props);
    const command: EditCommand = new AddEdgeCommand(this.automaton, from, to, edge);
    error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  removeEdge(from: string, to: string, id: string) {
    const command: EditCommand = new RemoveEdgeCommand(this.automaton, from, to, id);

    const error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  editEdge(from: string, to: string, id: string, props: IUniversalEdgeProps) {
    let error = this.checkEdgeProps(props);
    if (error !== undefined) {
      return error;
    }

    const edge: IEdge = this.factory.createEdge(props);
    const command: EditCommand = new EditEdgeCommand(this.automaton, id, edge);

    error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  highlight(ids: string[]) {
    return new ErrorMessage(`Not implemented ${ids}`);
  }

  containsWord(word: string[]) {
    return this.automaton.createRunSimulation(word).run();
  }

  runStart(word: string[]) {
    this.simulation = this.automaton.createRunSimulation(word);
  }

  runNext() {
    if (this.simulation === undefined) {
      return new ErrorMessage("Run simulation does not exist. Try starting a simulation first.");
    }

    // TODO update NextStepCommand to return error if simulation ends
    const nextCommand = new NextStepCommand(this.simulation);
    const error = this.simulation.executeCommand(nextCommand);
    if (error !== undefined) {
      return error;
    }

    // TODO change this to RunCommandVisitor
    const result = nextCommand.getResult();
    if (result === undefined) {
      return new ErrorMessage("Command result is empty.");
    }
    this.visual.clearHighlights();
    this.visual.highlightElements([result.id]);
  }

  // TODO update visual
  runUndo() {
    if (this.simulation === undefined) {
      return new ErrorMessage("Run simulation does not exist. Try starting a simulation first.");
    }

    const e = this.simulation.undo();
    if (e !== undefined) {
      return new ErrorMessage(e.details);
    }
    return new ErrorMessage("Not implemented.");
  }

  createEdge(edgeProps: IUniversalEdgeProps) {
    return this.factory.createEdge(edgeProps);
  }

  checkStateId(id: string) {
    if (id.trim().length === 0) {
      return new ErrorMessage("State ID must contain at least one non-whitespace character.");
    }
    // prevents conflicts with edge IDs
    if (id.charAt(0) == "_") {
      return new ErrorMessage("State ID cannot start with an underscore");
    }
  }

  checkEdgeProps(props: IUniversalEdgeProps) {
    if (props.inputChar.trim().length === 0) {
      return new ErrorMessage("Input char must contain at least one non-whitespace character.");
    }
    if (this.automatonType === AutomatonType.PDA) {
      if (props.readStackChar === undefined || props.writeStackWord === undefined) {
        return new ErrorMessage("PDA edge must specify character(s) read from and written to the stack");
      }
      if (props.readStackChar.trim().length === 0 || props.writeStackWord.length === 0) {
        return new ErrorMessage("Read and written stack character(s) must not contain whitespace-only symbols");
      }
      for (const c in props.writeStackWord) {
        if (c.trim().length === 0) {
          return new ErrorMessage("Read and written stack character(s) must not contain whitespace-only symbols");
        }
      }
    }
  }
}

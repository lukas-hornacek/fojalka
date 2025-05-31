import { AutomatonType, IAutomaton } from "../engine/automaton/automaton";
import {
  AbstractAutomatonFactory,
  IAutomatonFactory,
  IUniversalEdgeProps,
} from "../engine/automaton/factories";
import { IErrorMessage, ErrorMessage } from "../engine/common";
import { IAutomatonVisual, AutomatonVisual } from "../visual/automatonVisual";
import { Kind, Mode, ModeHolder } from "./core";
import { IEdge } from "../engine/automaton/edge";
import {
  IEditCommandVisitor,
  VisualVisitor,
} from "../engine/automaton/visitors/editCommand";
import { IAutomatonSimulation } from "../engine/automaton/simulation";
import {
  AutomatonEditCommand,
  AddStateCommand,
  RemoveStateCommand,
  AddEdgeCommand,
  EditEdgeCommand,
  RemoveEdgeCommand,
  RenameStateCommand,
  SetInitialStateCommand,
  SetStateFinalFlagCommand,
} from "../engine/automaton/commands/edit";
import { NextStepCommand } from "../engine/automaton/commands/run";
import { INITIAL_STATE, PRIMARY_CYTOSCAPE_ID } from "../constants";
import { SavedAutomaton } from "../ui/importExport";

export interface IAutomatonCore {
  kind: Kind.AUTOMATON;
  mode: ModeHolder;
  automaton: IAutomaton;

  // called from AutomatonWindow, which own the Cytoscape HTML element
  init: () => IErrorMessage | undefined;

  // centers the Cytoscape window to show the entire automaton
  fit: () => void;

  // edit functions
  addState: (
    id: string,
    position: { x: number; y: number }
  ) => IErrorMessage | undefined;
  removeState: (id: string) => IErrorMessage | undefined;
  renameState: (id: string, newId: string) => IErrorMessage | undefined;
  setInitialState: (id: string) => IErrorMessage | undefined;
  setIsFinalState: (
    id: string,
    isFinalState: boolean
  ) => IErrorMessage | undefined;

  addEdge: (
    from: string,
    to: string,
    props: IUniversalEdgeProps
  ) => IErrorMessage | undefined;
  removeEdge: (
    from: string,
    to: string,
    id: string
  ) => IErrorMessage | undefined;
  editEdge: (
    id: string,
    props: IUniversalEdgeProps
  ) => IErrorMessage | undefined;

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

  getCytoscape: () => cytoscape.Core | undefined;
}

export class AutomatonCore implements IAutomatonCore {
  kind = Kind.AUTOMATON as const;
  mode: ModeHolder;

  automatonType: AutomatonType;
  visual: IAutomatonVisual;
  visitor: IEditCommandVisitor;

  // used to create automata and edges
  factory: IAutomatonFactory;
  automaton: IAutomaton;
  // optionally hold current simulation
  // the simulation also contains configuration
  simulation?: IAutomatonSimulation;

  // function to be run after init
  afterInit: (automatonCore: AutomatonCore) => void = () => {};

  constructor(
    automatonType: AutomatonType,
    id: string,
    mode: ModeHolder,
    initialStateName: string = INITIAL_STATE,
    initialStatePosition: { x: number; y: number } = { x: 0, y: 0 },
    afterInit?: (automatonCore: AutomatonCore) => void
  ) {
    this.automatonType = automatonType;
    this.factory = new AbstractAutomatonFactory(automatonType);
    this.automaton = this.factory.createAutomaton(initialStateName);
    this.visual = new AutomatonVisual(
      id,
      initialStateName,
      initialStatePosition
    );
    this.visitor = new VisualVisitor(this.visual);
    this.mode = mode;
    if (afterInit != undefined) {
      this.afterInit = afterInit;
    }
  }

  static fromSavedJSON(
    savedAutomatonString: string,
    afterInit?: (automatonCore: AutomatonCore) => void
  ): AutomatonCore {
    const imported: SavedAutomaton = JSON.parse(savedAutomatonString);

    console.log("Parsed text: ");
    console.log(imported);

    const newAutomatonCore = new AutomatonCore(
      imported.automaton.automatonType,
      PRIMARY_CYTOSCAPE_ID,
      new ModeHolder(),
      imported.automaton.initialStateId,
      imported.visuals
        .filter((x) => x.id === imported.automaton.initialStateId)
        .map((x) => x.position)[0],
      (automatonCore) => {
        // run this after init
        // copy over values from the JSON
        automatonCore.automaton.automatonType =
          imported.automaton.automatonType;

        imported.automaton.states.forEach((s) => {
          // this is the ugliest frickin' code I've written this year, it's in O(n^2), but it works
          automatonCore.addState(
            s,
            imported.visuals.filter((x) => x.id === s).map((x) => x.position)[0]
          );
        });

        automatonCore.automaton.finalStateIds =
          imported.automaton.finalStateIds;

        for (const from in imported.automaton.deltaFunctionMatrix) {
          for (const to in imported.automaton.deltaFunctionMatrix[from]) {
            for (const edge in imported.automaton.deltaFunctionMatrix[from][
              to
            ]) {
              automatonCore.addEdge(from, to, {
                id: "",
                inputChar:
                  imported.automaton.deltaFunctionMatrix[from][to][edge]
                    .inputChar,
              });

              console.log(`from: ${from}, to: ${to}, edge: ${edge}`);
            }
          }
        }

        if (afterInit != null) {
          afterInit(automatonCore);
        }

        // fit it to the screen
        automatonCore.fit();
      }
    );

    // how the visualisation should start looking
    //newAutomatonCore.visual.initialJSON = imported.visuals;

    return newAutomatonCore;
  }

  getCytoscape() {
    return this.visual.getCytoscape();
  }

  init(): undefined {
    this.visual.init();
    this.afterInit(this);
  }

  undo() {
    // TODO refactor this to return information that can be used to reflect changes in visual
    const result = this.automaton.undo();
    if (result == undefined) {
      this.visual.redrawAutomaton(this.automaton);
    }
    return result;
    //return new ErrorMessage("Not implemented.");
  }

  fit() {
    this.visual.fit();
  }

  addState(id: string, position: { x: number; y: number }) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    let error = this.checkStateId(id);
    if (error !== undefined) {
      return error;
    }

    const command: AutomatonEditCommand = new AddStateCommand(
      this.automaton,
      id
    );
    error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    // this does not use visitor (at least not yet) because the visitor does not accept position
    this.visual.addNode(id, position);
  }

  removeState(id: string) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    const command: AutomatonEditCommand = new RemoveStateCommand(
      this.automaton,
      id
    );
    const error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  renameState(id: string, newId: string) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    let error = this.checkStateId(newId);
    if (error !== undefined) {
      return error;
    }

    const command: AutomatonEditCommand = new RenameStateCommand(
      this.automaton,
      id,
      newId
    );
    error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  setInitialState(id: string) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    const command: AutomatonEditCommand = new SetInitialStateCommand(
      this.automaton,
      id
    );
    const error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  setIsFinalState(id: string, isFinalState: boolean) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    const command: AutomatonEditCommand = new SetStateFinalFlagCommand(
      this.automaton,
      id,
      isFinalState
    );
    const error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  addEdge(from: string, to: string, props: IUniversalEdgeProps) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    let error = this.checkEdgeProps(props);
    if (error !== undefined) {
      return error;
    }

    const edge: IEdge = this.factory.createEdge(props);
    const command: AutomatonEditCommand = new AddEdgeCommand(
      this.automaton,
      from,
      to,
      edge
    );
    error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  removeEdge(from: string, to: string, id: string) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    const command: AutomatonEditCommand = new RemoveEdgeCommand(
      this.automaton,
      from,
      to,
      id
    );

    const error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  editEdge(id: string, props: IUniversalEdgeProps) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    let error = this.checkEdgeProps(props);
    if (error !== undefined) {
      return error;
    }

    const edge: IEdge = this.factory.createEdge(props);
    const command: AutomatonEditCommand = new EditEdgeCommand(
      this.automaton,
      id,
      edge
    );

    error = this.automaton.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  highlight(ids: string[]) {
    if (this.mode.mode !== Mode.VISUAL) {
      return new ErrorMessage("Operation is only permitted in visual mode.");
    }

    return new ErrorMessage(`Not implemented ${ids}`);
  }

  containsWord(word: string[]) {
    return this.automaton.createRunSimulation(word).run();
  }

  runStart(word: string[]) {
    if (this.mode.mode !== Mode.VISUAL) {
      return new ErrorMessage("Operation is only permitted in visual mode.");
    }

    this.simulation = this.automaton.createRunSimulation(word);
  }

  runNext() {
    if (this.mode.mode !== Mode.VISUAL) {
      return new ErrorMessage("Operation is only permitted in visual mode.");
    }

    if (this.simulation === undefined) {
      return new ErrorMessage(
        "Run simulation does not exist. Try starting a simulation first."
      );
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
    if (this.mode.mode !== Mode.VISUAL) {
      return new ErrorMessage("Operation is only permitted in visual mode.");
    }

    if (this.simulation === undefined) {
      return new ErrorMessage(
        "Run simulation does not exist. Try starting a simulation first."
      );
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
      return new ErrorMessage(
        "State ID must contain at least one non-whitespace character."
      );
    }
    // prevents conflicts with edge IDs
    if (id.charAt(0) == "_") {
      return new ErrorMessage("State ID cannot start with an underscore");
    }
  }

  checkEdgeProps(props: IUniversalEdgeProps) {
    if (props.inputChar.trim().length === 0) {
      return new ErrorMessage(
        "Input char must contain at least one non-whitespace character."
      );
    }
    if (this.automatonType === AutomatonType.PDA) {
      if (
        props.readStackChar === undefined ||
        props.writeStackWord === undefined
      ) {
        return new ErrorMessage(
          "PDA edge must specify character(s) read from and written to the stack"
        );
      }
      if (
        props.readStackChar.trim().length === 0 ||
        props.writeStackWord.length === 0
      ) {
        return new ErrorMessage(
          "Read and written stack character(s) must not contain whitespace-only symbols"
        );
      }
      for (const c in props.writeStackWord) {
        if (c.trim().length === 0) {
          return new ErrorMessage(
            "Read and written stack character(s) must not contain whitespace-only symbols"
          );
        }
      }
    }
  }
}

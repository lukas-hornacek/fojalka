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
import { SavedAutomaton } from "../helperFunctions/importAndExport";

export interface IAutomatonCore {
  kind: Kind.AUTOMATON;
  mode: ModeHolder;
  visual: IAutomatonVisual;
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
  containsWord: (word: string[]) => IErrorMessage | boolean;
  runStart: (word: string[]) => IErrorMessage | undefined;
  runNext: () => IErrorMessage | undefined;
  runUndo: () => IErrorMessage | undefined;
  runEnd: () => IErrorMessage | undefined;
  getRemainingInput: () => string[] | undefined;

  simulationInProgress: () => boolean;
  algorithmInProgress: (inProgress: boolean) => void;

  highlight: (ids: string[]) => IErrorMessage | undefined;

  // provides access to factory method that is needed by IAlgorithm
  // should not be used for other purposes, as it does not update either engine or visual components
  createEdge(edgeProps: IUniversalEdgeProps): IEdge;
  // needed by algorithm to visualise individual commands
  visitor: IEditCommandVisitor;

  getCytoscape: () => cytoscape.Core | undefined;
  callbackAfterInit: (fn: (cy: cytoscape.Core) => void) => void;

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

  algorithm: boolean = false;

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
    savedAutomaton: SavedAutomaton,
    previousModeHolder: ModeHolder,
    afterInit?: (automatonCore: AutomatonCore) => void
  ): AutomatonCore {
    const newAutomatonCore = new AutomatonCore(
      savedAutomaton.automaton.automatonType,
      PRIMARY_CYTOSCAPE_ID,
      previousModeHolder,
      savedAutomaton.automaton.initialStateId,
      savedAutomaton.visuals
        .filter((x) => x.id === savedAutomaton.automaton.initialStateId)
        .map((x) => x.position)[0],
      (automatonCore) => {
        console.log(savedAutomaton.visuals);

        // run this after init
        // copy over values from the JSON
        automatonCore.automaton.automatonType =
          savedAutomaton.automaton.automatonType;

        savedAutomaton.automaton.states.filter(s => s !== savedAutomaton.automaton.initialStateId).forEach((s) => {
          // this is the ugliest frickin' code I've written this year, it's in O(n^2), but it works
          automatonCore.addState(
            s,
            savedAutomaton.visuals.filter((x) => x.id === s).map((x) => x.position)[0]
          );
        });

        savedAutomaton.automaton.finalStateIds.forEach(id => automatonCore.setIsFinalState(id, true));

        for (const from in savedAutomaton.automaton.deltaFunctionMatrix) {
          for (const to in savedAutomaton.automaton.deltaFunctionMatrix[from]) {
            for (const edge in savedAutomaton.automaton.deltaFunctionMatrix[from][
              to
            ]) {
              automatonCore.addEdge(from, to, {
                id: "",
                inputChar:
                  savedAutomaton.automaton.deltaFunctionMatrix[from][to][edge]
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

  callbackAfterInit(fn: (cy: cytoscape.Core) => void) {
    this.visual.callbackAfterInit(fn);
  }

  init(): undefined {
    this.visual.init();
    this.visual.fit();
    this.afterInit(this);
  }

  undo() {
    const result = this.automaton.undo();
    
    // literally just redraw the thing
    if (result == undefined) {
      this.visual.redrawAutomaton(this.automaton);
    }
    return result;
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
    // highlighting newly added node
    // this.visual.clearHighlights();
    // this.visual.highlightElements([id]);
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
    // highlighting newly added edge
    // this.visual.clearHighlights();
    // this.visual.highlightElements([edge.id]);
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

    // this is extremely important, otherwise it fucks up the renaming
    edge.id = id;

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
    this.visual.clearHighlights();
    this.visual.highlightElements(ids);
  }

  containsWord(word: string[]) {
    return this.automaton.createRunSimulation(word).run();
  }

  runStart(word: string[]) {
    console.log(this.mode.mode);
    if (this.mode.mode !== Mode.VISUAL) {
      return new ErrorMessage("Operation is only permitted in visual mode.");
    }
    if (this.algorithm) {
      return new ErrorMessage("Cannot start new simulation when an algorithm is in progress.");
    }
    if (this.simulation !== undefined) {
      return new ErrorMessage("Cannot start new simulation when a simulation is already in progress.");
    }

    this.simulation = this.automaton.createRunSimulation(word);
    this.visual.highlightElements([this.simulation.configuration.stateId]);
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
    this.visual.highlightElements([result.id, this.simulation.configuration.stateId]);
  }

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
    this.visual.clearHighlights();
    this.visual.highlightElements([this.simulation.configuration.stateId]);
  }

  runEnd() {
    if (this.mode.mode !== Mode.VISUAL) {
      return new ErrorMessage("Operation is only permitted in visual mode.");
    }
    if (this.simulation === undefined) {
      return new ErrorMessage("Run simulation does not exist. Try starting a simulation first.");
    }

    this.visual.clearHighlights();
    this.simulation = undefined;
  }

  getRemainingInput() : string[] | undefined {
    return this.simulation?.configuration.remainingInput;
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

  simulationInProgress() {
    return this.simulation !== undefined;
  }

  algorithmInProgress(inProgress: boolean) {
    this.algorithm = inProgress;
  };
}

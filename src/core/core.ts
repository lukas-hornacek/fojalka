import cytoscape from "cytoscape";
import { PRIMARY_CYTOSCAPE_ID } from "../constants";
import { AlgorithmResult, IAlgorithm } from "../engine/algorithm/algorithm";
import { AutomatonType } from "../engine/automaton/automaton";
import { ErrorMessage, IErrorMessage } from "../engine/common";
import { GrammarType } from "../engine/grammar/grammar";
import { AutomatonCore, IAutomatonCore } from "./automatonCore";
import { GrammarCore, IGrammarCore } from "./grammarCore";

export enum Mode {
  EDIT,
  VISUAL,
}

export enum Kind {
  GRAMMAR,
  AUTOMATON,
}

// I got tired of having two different enums
export enum ObjectType {
  AUTOMATON_FINITE,
  GRAMMAR_REGULAR,
  GRAMMAR_PHRASAL,
}

// workaround to give IAutomatonCore | IGrammarCore access to mode reference
// if mode was not inside an object, it would always be passed by value, not by reference
export class ModeHolder {
  mode: Mode = Mode.EDIT;
}

export type ICoreType = IAutomatonCore | IGrammarCore;

export interface ICore {
  mode: ModeHolder;

  primary: ICoreType;
  secondary?: ICoreType;

  setCorePrimary: (primary: IAutomatonCore | IGrammarCore) => void;

  // switches to edit mode and if there are two cores present, deletes one of them
  switchToEditMode: (keepSecondary: boolean) => IErrorMessage | undefined;
  // switches to visual mode without immediately running any algorithm/simulation (and therefore without creating second window)
  switchToVisualMode: () => IErrorMessage | undefined;

  // applies all remaining steps of the algorithm at once and shows the final result
  transform: () => IErrorMessage | undefined;

  // takes algorithm object or enum that is then pushed into factory
  // creates simulation object, that can be used to call next() and undo()
  // if needed, creates new core and stores it in secondary
  algorithmStart: (algorithm: IAlgorithm) => IErrorMessage | undefined;
  algorithmNext: () => IErrorMessage | undefined;
  algorithmUndo: () => IErrorMessage | undefined;
  // deletes algorithm (and secondary window) without switching to edit mode
  algorithmDelete: (keepSecondary: boolean) => IErrorMessage | undefined;

  // get (readonly) cytoscape
  getCytoscape: () => cytoscape.Core | undefined;

  newWindow: (type: ObjectType) => void;

  // these are set once and then used only internally to trigger changes in UI
  setMode?: React.Dispatch<React.SetStateAction<Mode>>;
  setPrimaryType?: React.Dispatch<React.SetStateAction<ICoreType>>;
  setSecondaryType?: React.Dispatch<
    React.SetStateAction<ICoreType | undefined>
  >;
}

// component that holds global state and Grammar/Automaton cores
export class Core implements ICore {
  // current UI mode
  mode: ModeHolder = new ModeHolder();

  primary: ICoreType;
  secondary?: ICoreType | undefined;

  algorithm?: IAlgorithm;

  setMode?: React.Dispatch<React.SetStateAction<Mode>>;
  setPrimaryType?: React.Dispatch<React.SetStateAction<ICoreType>>;
  setSecondaryType?: React.Dispatch<
    React.SetStateAction<ICoreType | undefined>
  >;

  constructor() {
    this.mode = new ModeHolder();
    this.primary = new AutomatonCore(
      AutomatonType.FINITE,
      PRIMARY_CYTOSCAPE_ID,
      this.mode
    );
  }

  // like a constructor, because I am too tired to rework the whole fucking thing again
  setCorePrimary(primary: IAutomatonCore | IGrammarCore) {
    this.mode = new ModeHolder();
    this.primary = primary;
  }

  newWindow(type: ObjectType) {
    if (type === ObjectType.AUTOMATON_FINITE) {
      const reinitialize = this.primary.kind === Kind.AUTOMATON;
      this.primary = new AutomatonCore(
        AutomatonType.FINITE,
        PRIMARY_CYTOSCAPE_ID,
        this.mode
      );
      if (reinitialize) {
        this.primary.init();
      }
      this.setPrimaryType?.(this.primary);
    } else {
      this.primary = new GrammarCore(
        type === ObjectType.GRAMMAR_REGULAR
          ? GrammarType.REGULAR
          : GrammarType.CONTEXT_FREE,
        this.mode
      );
      this.setPrimaryType?.(this.primary);
      this.primary.visual.refresh();
      this.primary.visual.refresher?.(this.primary.display());
    }

    if (this.mode.mode === Mode.VISUAL) {
      this.switchToEditMode(false);
    }
  }

  getCytoscape() {
    return this.primary.getCytoscape();
  }

  // TODO test if this correctly stops any running algorithm/simulation
  switchToEditMode(keepSecondary: boolean) {
    if (this.mode.mode === Mode.EDIT) {
      return new ErrorMessage(
        "Cannot switch to edit mode when already in edit mode."
      );
    }

    // end simulation if there is any running
    if (this.primary.kind === Kind.AUTOMATON) {
      this.primary.runEnd();
    }

    this.algorithmDelete(keepSecondary);
    this.mode.mode = Mode.EDIT;
    this.setMode?.(this.mode.mode);
  }

  switchToVisualMode() {
    if (this.mode.mode === Mode.VISUAL) {
      return new ErrorMessage(
        "Cannot switch to visual mode when already in visual mode."
      );
    }

    this.mode.mode = Mode.VISUAL;

    this.setMode?.(this.mode.mode);
  }

  transform() {
    if (this.mode.mode === Mode.EDIT) {
      return new ErrorMessage("Cannot simulate algorithm in edit mode.");
    }
    if (this.algorithm === undefined) {
      return new ErrorMessage("Cannot simulate algorithm step before start.");
    }

    try {
      let result = this.algorithm.next();
      if (result === undefined) {
        this.primary.highlight([]);
        return new ErrorMessage("Algorithm is already completed.");
      }
      while (result !== undefined) {
        this.algorithmStep(result);
        result = this.algorithm.next();
      }
      this.primary.highlight([]);
    } catch (e: unknown) {
      if (e instanceof Error) {
        return new ErrorMessage(e.message);
      }
    }
  }

  algorithmStart(algorithm: IAlgorithm) {
    if (this.mode.mode === Mode.EDIT) {
      return new ErrorMessage("Cannot simulate algorithm in edit mode.");
    }
    if (this.algorithm !== undefined) {
      return new ErrorMessage(
        "Cannot start new algorithm when an algorithm is already in progress."
      );
    }
    if (this.primary.kind === Kind.AUTOMATON) {
      if (this.primary.simulationInProgress()) {
        return new ErrorMessage(
          "Cannot start algorithm when a simulation is in progress."
        );
      }
    }

    try {
      this.algorithm = algorithm;
      this.secondary = algorithm.init(this.mode);
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.algorithmDelete(false);
        return new ErrorMessage(e.message);
      }
    }

    this.setPrimaryType?.(this.primary);
    this.setSecondaryType?.(this.secondary);

    if (this.primary.kind === Kind.AUTOMATON) {
      this.primary.algorithmInProgress(true);
    }
  }

  algorithmNext() {
    if (this.mode.mode === Mode.EDIT) {
      return new ErrorMessage("Cannot simulate algorithm in edit mode.");
    }
    if (this.algorithm === undefined) {
      return new ErrorMessage("Cannot simulate algorithm step before start.");
    }
    try {
      const result = this.algorithm.next();
      if (result === undefined) {
        this.primary.highlight([]);
        return new ErrorMessage("Algorithm is already completed.");
      }
      this.algorithmStep(result);
    } catch (e: unknown) {
      if (e instanceof Error) {
        return new ErrorMessage(e.message);
      }
    }
  }

  // TODO reflect changes in visual
  algorithmUndo() {
    if (this.mode.mode === Mode.EDIT) {
      return new ErrorMessage("Cannot simulate algorithm in edit mode.");
    }
    if (this.algorithm === undefined) {
      return new ErrorMessage("Cannot undo algorithm step before start.");
    }

    return this.algorithm.undo();
  }

  algorithmDelete(keepSecondary: boolean) {
    this.setSecondaryType?.(undefined);
    if (keepSecondary) {
      if (this.secondary === undefined) {
        return new ErrorMessage(
          "Cannot keep second window, because the window does not exit."
        );
      }
      this.moveWindows();
    }
    if (this.primary.kind === Kind.AUTOMATON) {
      this.primary.algorithmInProgress(false);
    }
    this.setPrimaryType?.(this.primary);

    this.primary.highlight([]);

    this.secondary = undefined;
    this.algorithm = undefined;
  }

  moveWindows() {
    if (
      this.primary.kind === Kind.AUTOMATON &&
      this.secondary?.kind === Kind.AUTOMATON
    ) {
      const elems = this.secondary.visual.getElements();
      this.primary = this.secondary;
      this.primary.visual.reinitialize(elems);
      this.primary.visual.init();
    } else if (
      this.primary.kind === Kind.GRAMMAR &&
      this.secondary?.kind === Kind.AUTOMATON
    ) {
      const elems = this.secondary.visual.getElements();
      this.setPrimaryType?.(this.secondary);
      this.primary = this.secondary;
      this.primary.visual.reinitialize(elems);
    } else {
      this.primary = this.secondary!;
    }
  }

  //large part of the code for next and transform is the same, so I put it in this function
  private algorithmStep(result: AlgorithmResult) {
    if (this.algorithm!.outputType === undefined) {
      switch (this.primary.kind) {
        case Kind.GRAMMAR:
          if (result.command.kind !== Kind.GRAMMAR) {
            return new ErrorMessage(
              "Automaton command is not applicable to grammar."
            );
          }
          this.primary.grammar.executeCommand(result.command);
          break;
        case Kind.AUTOMATON:
          if (result.command.kind !== Kind.AUTOMATON) {
            return new ErrorMessage(
              "Grammar command is not applicable to automaton."
            );
          }
          this.primary.automaton.executeCommand(result.command);
          break;
      }
      // visualise edit command
      result.command.accept(this.primary.visitor);
    } else {
      if (this.secondary === undefined) {
        return new ErrorMessage("Second window does not exist.");
      }
      this.primary.highlight(result.highlight);

      switch (this.secondary.kind) {
        case Kind.GRAMMAR:
          if (result.command.kind !== Kind.GRAMMAR) {
            return new ErrorMessage(
              "Automaton command is not applicable to grammar."
            );
          }
          this.secondary.grammar.executeCommand(result.command);
          break;
        case Kind.AUTOMATON:
          if (result.command.kind !== Kind.AUTOMATON) {
            return new ErrorMessage(
              "Grammar command is not applicable to automaton."
            );
          }
          this.secondary.automaton.executeCommand(result.command);
          break;
      }
      // visualise edit command
      result.command.accept(this.secondary.visitor);
    }
  }
}

import { IAlgorithm } from "../engine/algorithm";
import { ErrorMessage, IErrorMessage } from "../engine/common";
import { IAutomatonCore } from "./automatonCore";
import { IGrammarCore } from "./grammarCore";

export enum Mode {
  EDIT,
  VISUAL,
}

export enum Kind {
  GRAMMAR,
  AUTOMATON,
}

export type ICoreType = IAutomatonCore | IGrammarCore;

export interface ICore {
  mode: Mode,

  primary: ICoreType,
  secondary?: ICoreType,

  // switches to edit mode and if there are two cores present, deletes one of them
  switchToEditMode: (keepSecondary: boolean) => IErrorMessage | undefined;
  // switches to visual mode without immediately running any algorithm/simulation (and therefore without creating second window)
  switchToVisualMode: () => IErrorMessage | undefined;

  // applies whole algorithm at once in Edit mode
  transform: (algorithm: IAlgorithm) => IErrorMessage | undefined;

  // takes algorithm object or enum that is then pushed into factory
  // creates simulation object, that can be used to call next() and undo()
  // if needed, creates new core and stores it in secondary
  algorithmStart: (algorithm: IAlgorithm) => IErrorMessage | undefined;
  algorithmNext: () => IErrorMessage | undefined;
  algorithmUndo: () => IErrorMessage | undefined;
  // deletes algorithm (and secondary window) without switching to edit mode
  algorithmDelete: (keepSecondary: boolean) => IErrorMessage | undefined;
}

// component that holds global state and Grammar/Automaton cores
export class Core implements ICore {
  // current UI mode
  mode: Mode = Mode.EDIT;

  primary: ICoreType;
  secondary?: ICoreType | undefined;

  algorithm?: IAlgorithm;

  constructor(primary: ICoreType) {
    this.mode = Mode.EDIT;
    this.primary = primary;
  }

  switchToEditMode(keepSecondary: boolean) {
    if (this.mode === Mode.EDIT) {
      return new ErrorMessage("Cannot switch to edit mode when already in edit mode.");
    }

    this.algorithmDelete(keepSecondary);
    this.mode = Mode.EDIT;
  }

  switchToVisualMode() {
    if (this.mode === Mode.VISUAL) {
      return new ErrorMessage("Cannot switch to visual mode when already in visual mode.");
    }

    this.mode = Mode.VISUAL;
  }

  transform(algorithm: IAlgorithm) {
    if (this.mode === Mode.VISUAL) {
      return new ErrorMessage("Cannot apply algorithm all at once in visual mode.");
    }
    // TODO first apply all EditCommands to Automaton and then display visual changes all at once
    return new ErrorMessage(`Not implemented. ${algorithm}`);
  }

  algorithmStart(algorithm: IAlgorithm) {
    if (this.algorithm !== undefined) {
      return new ErrorMessage("Cannot start new algorithm where an algorithm is already in progress.");
    }

    this.mode = Mode.VISUAL;

    this.algorithm = algorithm;
    this.secondary = algorithm.init();
  }

  algorithmNext() {
    if (this.algorithm === undefined) {
      return new ErrorMessage("Cannot simulate algorithm step before start.");
    }
    try {
      const result = this.algorithm.next();
      if (result === undefined) {
        return new ErrorMessage("Algorithm is already completed.");
      }

      if (this.algorithm.outputType === undefined) {
        switch (this.primary.kind) {
          case Kind.GRAMMAR:
            if (result.command.kind !== Kind.GRAMMAR) {
              return new ErrorMessage("Automaton command is not applicable to grammar.");
            }
            this.primary.grammar.executeCommand(result.command);
            break;
          case Kind.AUTOMATON:
            if (result.command.kind !== Kind.AUTOMATON) {
              return new ErrorMessage("Grammar command is not applicable to automaton.");
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
              return new ErrorMessage("Automaton command is not applicable to grammar.");
            }
            this.secondary.grammar.executeCommand(result.command);
            break;
          case Kind.AUTOMATON:
            if (result.command.kind !== Kind.AUTOMATON) {
              return new ErrorMessage("Grammar command is not applicable to automaton.");
            }
            this.secondary.automaton.executeCommand(result.command);
            break;
        }
        // visualise edit command
        result.command.accept(this.secondary.visitor);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        return new ErrorMessage(e.message);
      }
    }
  }

  // TODO reflect changes in visual
  algorithmUndo() {
    if (this.algorithm === undefined) {
      return new ErrorMessage("Cannot undo algorithm step before start.");
    }

    return this.algorithm.undo();
  }

  algorithmDelete(keepSecondary: boolean) {
    if (keepSecondary) {
      if (this.secondary === undefined) {
        return new ErrorMessage("Cannot keep second window, because the window does not exit.");
      }
      this.primary = this.secondary;
    }
    this.secondary = undefined;
    this.algorithm = undefined;
  }
}

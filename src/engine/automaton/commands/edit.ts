import { IAutomaton, IAutomatonMemento } from "../automaton.ts";
import { ErrorMessage, IErrorMessage } from "../../common.ts";
import { IEdge } from "../edge.ts";

export abstract class EditCommand<T = void> {
  automaton: IAutomaton;
  backup?: IAutomatonMemento;
  result?: T;

  protected constructor(_automaton: IAutomaton) {
    this.automaton = _automaton;
  }

  saveBackup() {
    this.backup = this.automaton.save();
  }

  undo() {
    if (this.backup) {
      this.automaton.restore(this.backup);
    }
  }

  getResult(): T | undefined {
    return this.result;
  }

  abstract execute(): IErrorMessage | undefined; // this.saveBackup(); ...perform command...
}

export class AddEdgeCommand extends EditCommand {
  fromStateId: string;
  toStateId: string;
  edge: IEdge;

  constructor(_automaton: IAutomaton, _fromStateId: string, _toStateId: string, _edge: IEdge) {
    super(_automaton);
    this.fromStateId = _fromStateId;
    this.toStateId = _toStateId;
    this.edge = _edge;
  }

  execute(): IErrorMessage | undefined {
    this.saveBackup();

    const fromStateExists = this.automaton.states.some(id => id === this.fromStateId);
    const toStateExists = this.automaton.states.some(id => id === this.toStateId);
    if (!fromStateExists || !toStateExists) {
      return new ErrorMessage(
        `Cannot add edge. Both ${this.fromStateId} and ${this.toStateId} state IDs have to exist.`
      );
    }

    if (this.automaton.deltaFunctionMatrix[this.fromStateId] === undefined) {
      this.automaton.deltaFunctionMatrix[this.fromStateId] = {};
    }

    if (this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId] === undefined) {
      this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId] = [];
    }

    if (this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId].some(
      edge => edge.equals(this.edge))
    ) {
      return new ErrorMessage(
        "Cannot add edge, as it already exists."
      );
    }

    this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId].push(this.edge);
  }
}

export class AddStateCommand extends EditCommand {
  stateId: string;

  constructor(_automaton: IAutomaton, _stateId: string) {
    super(_automaton);
    this.stateId = _stateId;
  }

  execute(): IErrorMessage | undefined {
    if (this.automaton.states.some(id => id === this.stateId)) {
      return new ErrorMessage(`Cannot add state ${this.stateId}, as it has already been added before.`);
    }

    this.saveBackup();
    this.automaton.states.push(this.stateId);
  }
}

export class RemoveStateCommand extends EditCommand {
  stateId: string;

  constructor(_automaton: IAutomaton, _stateId: string) {
    super(_automaton);
    this.stateId = _stateId;
  }

  execute(): IErrorMessage | undefined {
    const index = this.automaton.states.findIndex(id => id === this.stateId);
    if (index === -1) {
      return new ErrorMessage(`Cannot remove state ${this.stateId}, as it does not exist.`);
    }

    this.saveBackup();

    // remove state
    if (this.automaton.states.length > 1) {
      this.automaton.states[index] = this.automaton.states.pop()!;
    } else {
      this.automaton.states.pop();
    }

    // remove edges going from stateId
    this.automaton.deltaFunctionMatrix[this.stateId] = {};

    // remove edges going to stateId
    for (const from in this.automaton.deltaFunctionMatrix) {
      for (const to in this.automaton.deltaFunctionMatrix[from]) {
        if (to === this.stateId) {
          this.automaton.deltaFunctionMatrix[from][to] = [];
        }
      }
    }
  }
}

export class RemoveEdgeCommand extends EditCommand {
  edgeId: string;
  fromStateId: string;
  toStateId: string;

  constructor(_automaton: IAutomaton, _fromStateId: string, _toStateId: string, _edgeId: string) {
    super(_automaton);
    this.edgeId = _edgeId;
    this.fromStateId = _fromStateId;
    this.toStateId = _toStateId;
  }

  execute(): IErrorMessage | undefined {
    const index = this.automaton.deltaFunctionMatrix[this.fromStateId]?.[this.toStateId]?.findIndex(edge => edge.id === this.edgeId);
    if (index === undefined) {
      return new ErrorMessage(`Cannot remove edge ${this.edgeId} because one of its states is not incorrect.`);
    }
    if (index === -1) {
      return new ErrorMessage(`Cannot remove edge ${this.edgeId}, as it does not exist.`);
    }

    this.saveBackup();

    if (this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId].length > 1) {
      this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId][index] =
        this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId].pop()!;
    } else {
      this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId].pop();
    }
  }
}

export class SetStateFinalFlagCommand extends EditCommand {
  stateId: string;
  shouldBeFinal: boolean;

  constructor(_automaton: IAutomaton, _stateId: string, _shouldBeFinal: boolean) {
    super(_automaton);
    this.stateId = _stateId;
    this.shouldBeFinal = _shouldBeFinal;
  }

  execute(): IErrorMessage | undefined {
    if (this.automaton.states.every(id => id !== this.stateId)) {
      return new ErrorMessage(`Cannot edit state ${this.stateId}, as it does not exist.`);
    }

    const isFinalAlready = this.automaton.finalStateIds.some(id => id === this.stateId);
    if (isFinalAlready && this.shouldBeFinal) {
      return;
    }
    if (!isFinalAlready && !this.shouldBeFinal) {
      return;
    }

    this.saveBackup();

    if (this.shouldBeFinal) {
      this.automaton.finalStateIds.push(this.stateId);
    } else {
      this.automaton.finalStateIds = this.automaton.finalStateIds.filter(id => id !== this.stateId);
    }
  }
}

export class SetInitialStateCommand extends EditCommand {
  stateId: string;

  constructor(_automaton: IAutomaton, _stateId: string) {
    super(_automaton);
    this.stateId = _stateId;
  }

  execute(): IErrorMessage | undefined {
    if (this.automaton.states.every(id => id !== this.stateId)) {
      return new ErrorMessage(`Cannot edit state ${this.stateId}, as it does not exist.`);
    }

    this.saveBackup();
    this.automaton.initialStateId = this.stateId;
  }
}

import { IAutomaton, IAutomatonMemento } from "../automaton.ts";
import { ErrorMessage, IErrorMessage } from "../../common.ts";
import { IEdge } from "../edge.ts";
import { Kind } from "../../../core/core.ts";
import { IEditCommandVisitor } from "../visitors/editCommand.ts";
import { cloneDeep } from "lodash";

export abstract class AutomatonEditCommand {
  kind = Kind.AUTOMATON as const;
  automaton: IAutomaton;
  backup?: IAutomatonMemento;

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

  abstract accept(visitor: IEditCommandVisitor): void;
  abstract execute(): IErrorMessage | undefined; // this.saveBackup(); ...perform command...
}

export class AddStateCommand extends AutomatonEditCommand {
  stateId: string;

  constructor(automaton: IAutomaton, stateId: string) {
    super(automaton);
    this.stateId = stateId;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitAddStateCommand(this);
  }

  execute(): IErrorMessage | undefined {
    if (this.automaton.states.some((id) => id === this.stateId)) {
      return new ErrorMessage(
        `Cannot add state ${this.stateId}, as it has already been added before.`
      );
    }

    const delta = this.automaton.deltaFunctionMatrix;
    for (const fromState in delta) {
      for (const toState in delta[fromState]) {
        for (const edge of delta[fromState][toState]) {
          if (edge.inputChar === this.stateId) {
            return new ErrorMessage(
              `Cannot add state ${this.stateId}, as it is already present as an edge symbol.`
            );
          }
        }
      }
    }

    this.saveBackup();
    this.automaton.states.push(this.stateId);
  }
}

export class RemoveStateCommand extends AutomatonEditCommand {
  stateId: string;

  constructor(_automaton: IAutomaton, _stateId: string) {
    super(_automaton);
    this.stateId = _stateId;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitRemoveStateCommand(this);
  }

  execute(): IErrorMessage | undefined {
    const index = this.automaton.states.findIndex((id) => id === this.stateId);
    if (index === -1) {
      return new ErrorMessage(
        `Cannot remove state ${this.stateId}, as it does not exist.`
      );
    }
    if (this.stateId === this.automaton.initialStateId) {
      return new ErrorMessage(
        `Cannot remove state ${this.stateId}, as it is the initial state.`
      );
    }

    this.saveBackup();

    this.automaton.finalStateIds = this.automaton.finalStateIds.filter(
      (id) => id !== this.stateId
    );

    // remove state
    if (
      this.automaton.states.length > 1 &&
      index !== this.automaton.states.length - 1
    ) {
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

export class RenameStateCommand extends AutomatonEditCommand {
  stateId: string;
  newStateId: string;

  constructor(_automaton: IAutomaton, stateId: string, newStateId: string) {
    super(_automaton);
    this.stateId = stateId;
    this.newStateId = newStateId;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitRenameStateCommand(this);
  }

  execute(): IErrorMessage | undefined {
    if (this.automaton.states.every((id) => id !== this.stateId)) {
      return new ErrorMessage(
        `Cannot edit state ${this.stateId}, as it does not exist.`
      );
    }
    if (
      this.automaton.states.some((id) => id === this.newStateId) &&
      this.newStateId !== this.stateId
    ) {
      return new ErrorMessage(
        `Cannot rename state ${this.stateId} to ${this.newStateId}, as there is already a state with that name.`
      );
    }

    const delta = this.automaton.deltaFunctionMatrix;
    for (const fromState in delta) {
      for (const toState in delta[fromState]) {
        for (const edge of delta[fromState][toState]) {
          if (edge.inputChar === this.newStateId) {
            return new ErrorMessage(
              `Cannot rename state ${this.stateId} to ${this.newStateId}, as there is already an edge symbol with that name.`
            );
          }
        }
      }
    }

    this.saveBackup();

    this.automaton.states = this.automaton.states.map((state) =>
      state === this.stateId ? this.newStateId : state
    );
    if (this.automaton.initialStateId === this.stateId) {
      this.automaton.initialStateId = this.newStateId;
    }
    this.automaton.finalStateIds = this.automaton.finalStateIds.map((state) =>
      state === this.stateId ? this.newStateId : state
    );

    //rename state in delta function
    if (this.automaton.deltaFunctionMatrix[this.stateId] !== undefined) {
      this.automaton.deltaFunctionMatrix[this.newStateId] = cloneDeep(
        this.automaton.deltaFunctionMatrix[this.stateId]
      );
      this.automaton.deltaFunctionMatrix[this.stateId] = {};
    }
    for (const from in this.automaton.deltaFunctionMatrix) {
      if (
        this.automaton.deltaFunctionMatrix[from][this.stateId] !== undefined
      ) {
        this.automaton.deltaFunctionMatrix[from][this.newStateId] = cloneDeep(
          this.automaton.deltaFunctionMatrix[from][this.stateId]
        );
        this.automaton.deltaFunctionMatrix[from][this.stateId] = [];
      }
    }
  }
}

export class SetStateFinalFlagCommand extends AutomatonEditCommand {
  stateId: string;
  shouldBeFinal: boolean;

  constructor(
    _automaton: IAutomaton,
    _stateId: string,
    _shouldBeFinal: boolean
  ) {
    super(_automaton);
    this.stateId = _stateId;
    this.shouldBeFinal = _shouldBeFinal;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitSetStateFinalFlagCommand(this);
  }

  execute(): IErrorMessage | undefined {
    if (this.automaton.states.every((id) => id !== this.stateId)) {
      return new ErrorMessage(
        `Cannot edit state ${this.stateId}, as it does not exist.`
      );
    }

    const isFinalAlready = this.automaton.finalStateIds.some(
      (id) => id === this.stateId
    );
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
      this.automaton.finalStateIds = this.automaton.finalStateIds.filter(
        (id) => id !== this.stateId
      );
    }
  }
}

export class SetInitialStateCommand extends AutomatonEditCommand {
  stateId: string;

  constructor(_automaton: IAutomaton, _stateId: string) {
    super(_automaton);
    this.stateId = _stateId;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitSetInitialStateCommand(this);
  }

  execute(): IErrorMessage | undefined {
    if (this.automaton.states.every((id) => id !== this.stateId)) {
      return new ErrorMessage(
        `Cannot edit state ${this.stateId}, as it does not exist.`
      );
    }

    this.saveBackup();
    this.automaton.initialStateId = this.stateId;
  }
}

export class AddEdgeCommand extends AutomatonEditCommand {
  fromStateId: string;
  toStateId: string;
  edge: IEdge;

  constructor(
    _automaton: IAutomaton,
    _fromStateId: string,
    _toStateId: string,
    _edge: IEdge
  ) {
    super(_automaton);
    this.fromStateId = _fromStateId;
    this.toStateId = _toStateId;
    this.edge = _edge;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitAddEdgeCommand(this);
  }

  execute(): IErrorMessage | undefined {
    this.saveBackup();

    const fromStateExists = this.automaton.states.some(
      (id) => id === this.fromStateId
    );
    const toStateExists = this.automaton.states.some(
      (id) => id === this.toStateId
    );
    if (!fromStateExists || !toStateExists) {
      return new ErrorMessage(
        `Cannot add edge. Both ${this.fromStateId} and ${this.toStateId} state IDs have to exist.`
      );
    }

    if (this.automaton.deltaFunctionMatrix[this.fromStateId] === undefined) {
      this.automaton.deltaFunctionMatrix[this.fromStateId] = {};
    }

    if (
      this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId] ===
      undefined
    ) {
      this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId] = [];
    }

    if (
      this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId].some(
        (edge) => edge.equals(this.edge)
      )
    ) {
      return new ErrorMessage("Cannot add edge, as it already exists.");
    }

    if (this.automaton.states.includes(this.edge.inputChar)) {
      return new ErrorMessage(
        `Edge cannot contain character ${this.edge.inputChar}, as there is already a state with that name.`
      );
    }

    this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId].push(
      this.edge
    );
  }
}

export class RemoveEdgeCommand extends AutomatonEditCommand {
  edgeId: string;
  fromStateId: string;
  toStateId: string;

  // TODO fromStateId and toStateId are not strictly necessary to remove edge and are here only for simpler and faster implementation
  // EditCommand on the other hand has only edgeId
  // we can decide based on how it is called from UI which version is preferable
  constructor(
    _automaton: IAutomaton,
    _fromStateId: string,
    _toStateId: string,
    _edgeId: string
  ) {
    super(_automaton);
    this.edgeId = _edgeId;
    this.fromStateId = _fromStateId;
    this.toStateId = _toStateId;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitRemoveEdgeCommand(this);
  }

  execute(): IErrorMessage | undefined {
    const index = this.automaton.deltaFunctionMatrix[this.fromStateId]?.[
      this.toStateId
    ]?.findIndex((edge) => edge.id === this.edgeId);
    if (index === undefined) {
      return new ErrorMessage(
        `Cannot remove edge ${this.edgeId} because one of its states does not exist.`
      );
    }
    if (index === -1) {
      return new ErrorMessage(
        `Cannot remove edge ${this.edgeId}, as it does not exist on states ${this.fromStateId}, ${this.toStateId}.`
      );
    }

    this.saveBackup();

    if (
      this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId]
        .length > 1 &&
      index !==
        this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId]
          .length -
          1
    ) {
      this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId][
        index
      ] =
        this.automaton.deltaFunctionMatrix[this.fromStateId][
          this.toStateId
        ].pop()!;
    } else {
      this.automaton.deltaFunctionMatrix[this.fromStateId][
        this.toStateId
      ].pop();
    }

    console.log(
      this.automaton.deltaFunctionMatrix[this.fromStateId][this.toStateId]
    );
  }
}

// replaces edge with edgeId with edge from constructor
export class EditEdgeCommand extends AutomatonEditCommand {
  edgeId: string;
  edge: IEdge;

  constructor(automaton: IAutomaton, edgeId: string, edge: IEdge) {
    super(automaton);
    this.edgeId = edgeId;
    this.edge = edge;
  }

  accept(visitor: IEditCommandVisitor): void {
    visitor.visitEditEdgeCommand(this);
  }

  execute(): IErrorMessage | undefined {
    let fromState = "";
    let toState = "";
    let index = -1;

    console.log(this.automaton.deltaFunctionMatrix);

    for (const from in this.automaton.deltaFunctionMatrix) {
      for (const to in this.automaton.deltaFunctionMatrix[from]) {
        const find = this.automaton.deltaFunctionMatrix[from][to].findIndex(
          (someEdge) => someEdge.id === this.edgeId
        );
        if (find !== -1) {
          fromState = from;
          toState = to;
          index = find;
          break;
        }
      }

      if (index !== -1) {
        break;
      }
    }

    if (index === -1) {
      return new ErrorMessage(
        `Cannot edit edge ${this.edgeId}, as it does not exist.`
      );
    }

    if (this.automaton.states.includes(this.edge.inputChar)) {
      return new ErrorMessage(
        `Edge cannot contain character ${this.edge.inputChar}, as there is already a state with that name.`
      );
    }

    // check whether an edge with this name already exists
    
        const find = this.automaton.deltaFunctionMatrix[fromState][toState].findIndex(
          (someEdge) => someEdge.inputChar === this.edge.inputChar
        );
        if (find !== -1) {
          return new ErrorMessage(
            `An edge already exists for input characters ${this.edge.inputChar} between ${fromState} and ${toState}.`
          );
        }
  

    this.saveBackup();

    this.automaton.deltaFunctionMatrix[fromState][toState][index] = this.edge;
  }
}

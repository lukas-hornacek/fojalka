import {IAutomaton, IState, IEdge, EditCommand} from "../types.ts";
import {ErrorMessage, IErrorMessage} from "../common.ts";

export class AddEdgeCommand extends EditCommand {
    fromStateId: number;
    toStateId: number;
    edge: IEdge;

    constructor(_automaton: IAutomaton, _fromStateId: number, _toStateId: number, _edge: IEdge) {
        super(_automaton);
        this.fromStateId = _fromStateId;
        this.toStateId = _toStateId;
        this.edge = _edge;
    }

    execute(): IErrorMessage | undefined {
        this.saveBackup();

        const fromStateExists = this.automaton.states.some(state => state.id === this.fromStateId);
        const toStateExists = this.automaton.states.some(state => state.id === this.toStateId);
        if (!fromStateExists || !toStateExists) {
            return new ErrorMessage(
                `Cannot add edge. Both ${this.fromStateId} and ${this.toStateId} state IDs have to exist.`
            );
        }

        if (this.automaton.deltaFunctionMatrix?.[this.fromStateId]?.[this.toStateId] === undefined) {
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
    state: IState;

    constructor(_automaton: IAutomaton, _state: IState) {
        super(_automaton);
        this.state = _state;
    }

    execute(): IErrorMessage | undefined {
        if (this.automaton.states.some(otherState => otherState.id === this.state.id)) {
            return new ErrorMessage("Cannot add state, as it has already been added before.");
        }

        this.saveBackup();
        this.automaton.states.push(this.state);
    }
}

export class SetStateFinalFlagCommand extends EditCommand {
    stateId: number;
    shouldBeFinal: boolean;

    constructor(_automaton: IAutomaton, _stateId: number, _shouldBeFinal: boolean) {
        super(_automaton);
        this.stateId = _stateId;
        this.shouldBeFinal = _shouldBeFinal;
    }

    execute(): IErrorMessage | undefined {
        if (this.automaton.states.every(state => state.id !== this.stateId)) {
            return new ErrorMessage(`Cannot edit state ${this.stateId}, as it does not exist.`);
        }

        this.saveBackup();
        this.automaton.states.forEach(state => {
            if (state.id === this.stateId) {
                state.isFinal = this.shouldBeFinal;
            }
        });
    }
}

export class SetInitialStateCommand extends EditCommand {
    stateId: number;

    constructor(_automaton: IAutomaton, _stateId: number) {
        super(_automaton);
        this.stateId = _stateId;
    }

    execute(): IErrorMessage | undefined {
        if (this.automaton.states.every(state => state.id !== this.stateId)) {
            return new ErrorMessage(`Cannot edit state ${this.stateId}, as it does not exist.`);
        }

        this.saveBackup();
        this.automaton.states.forEach(state => {
            state.isInitial = state.id === this.stateId;
        });
    }
}

import {IAutomaton, IEdge, EditCommand} from "../types.ts";
import {ErrorMessage, IErrorMessage} from "../common.ts";

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

        if (this.automaton.deltaFunctionMatrix?.[this.fromStateId] === undefined) {
            this.automaton.deltaFunctionMatrix[this.fromStateId] = {};
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

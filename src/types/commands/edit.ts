import {IAutomaton, IState, IEdge, EditModeCommand} from "../types.ts";

export class AddEdgeCommand extends EditModeCommand {
    edge: IEdge;

    constructor(_automaton: IAutomaton, _edge: IEdge) {
        super(_automaton);
        this.edge = _edge;
    }

    execute(): boolean {
        this.saveBackup();
        // TODO check if needed states exist (return false if they do not)
        this.automaton.states = this.automaton.states.map(state => {
            if (state.id === this.edge.fromStateId) {
                return {
                    ...state,
                    outgoing: [...state.outgoing, this.edge],
                };
            }
            if (state.id === this.edge.toStateId) {
                return {
                    ...state,
                    incoming: [...state.incoming, this.edge],
                };
            }
            return state;
        });
        return true;
    }
}

export class AddStateCommand extends EditModeCommand {
    state: IState;

    constructor(_automaton: IAutomaton, _state: IState) {
        super(_automaton);
        this.state = _state;
    }

    execute(): boolean {
        // TODO check if a state with this label does not exist yet (return false if it does)
        this.saveBackup();
        this.automaton.states.push(this.state);
        return true;
    }
}

import {RunCommand, ISimulation} from "../types.ts";
import {IErrorMessage} from "../common.ts";
import {NextStepVisitor} from "../visitors/configuration.ts";

export class NextStepCommand extends RunCommand {

    constructor (_simulation: ISimulation){
        super (_simulation);
    }

    // creates new visitor, configuration accepts it, this simulates a step on the automata, saves the edge traversed into this.result
    execute(): IErrorMessage | undefined {
        this.saveBackup();
        const nextStepVisitor = new NextStepVisitor(this.simulation.automaton);

        const oldState = this.simulation.configuration.stateId;

        this.simulation.configuration = this.simulation.configuration.accept(nextStepVisitor);

        const newState = this.simulation.configuration.stateId;
        this.result = this.simulation.automaton.deltaFunctionMatrix[oldState][newState][0];

        return;
    }
}

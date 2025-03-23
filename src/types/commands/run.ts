import {RunCommand, ISimulation} from "../types.ts";
import {IErrorMessage} from "../common.ts";
import {NextStepVisitor} from "../visitors/configuration.ts";

export class NextStepCommand extends RunCommand {

    constructor (_simulation: ISimulation){
        super (_simulation);
    }

    // creates new visitor, configuration accepts it, this simulates a step on the automata, saves the edge traversed into this.result
    execute(): IErrorMessage | void {
        this.saveBackup();
        const nextStepVisitor = new NextStepVisitor(this.simulation.automaton);
        
        const oldState = this.simulation.configuration.stateId;
        const usedSymbol = this.simulation.configuration.remainingInput[0];
        this.simulation.configuration = this.simulation.configuration.accept(nextStepVisitor);

        const newState = this.simulation.configuration.stateId;
        
        const edges = this.simulation.automaton.deltaFunctionMatrix[oldState][newState];
        for(let i = 0; i< edges.length; i++){ 
            if (edges[i].inputChar == usedSymbol) this.result = edges[i];
        }
        return;
    }
}

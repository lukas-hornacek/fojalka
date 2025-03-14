import {RunCommand} from "../types.ts";
import {IErrorMessage} from "../common.ts";
import {NextStepVisitor} from "../visitors/configuration.ts";

export class NextStepCommand extends RunCommand<number> {
    execute(): IErrorMessage | undefined {
        this.saveBackup();
        const nextStepVisitor = new NextStepVisitor(this.simulation.automaton);
        this.simulation.configuration = this.simulation.configuration.accept(nextStepVisitor);
        // TODO store the used edge into this.result. Get this info from the return value of accept probably.
        return;
    }
}

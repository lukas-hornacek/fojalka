import {RunCommand} from "../types.ts";
import {IErrorMessage} from "../common.ts";
import {NextStepVisitor} from "../visitors/configuration.ts";

export class NextStepCommand extends RunCommand {
    execute(): IErrorMessage | undefined {
        this.saveBackup();
        const nextStepVisitor = new NextStepVisitor(this.simulation.automaton);
        this.simulation.configuration = this.simulation.configuration.accept(nextStepVisitor);
        return;
    }
}

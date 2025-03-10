import {InteractiveModeCommand} from "../types.ts";
import {IErrorMessage} from "../common.ts";

export class NextStepCommand extends InteractiveModeCommand {
    execute(): IErrorMessage | undefined {
        this.saveBackup();
        this.simulation.configuration = this.simulation.configuration.accept(this.simulation.automaton);
        return;
    }
}

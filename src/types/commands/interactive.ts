import {InteractiveModeCommand} from "../types.ts";

export class NextStepCommand extends InteractiveModeCommand {
    execute() {
        this.saveBackup();
        this.simulation.configuration = this.simulation.configuration.accept(this.simulation.automaton);
    }
}

import { IErrorMessage } from "../../common";
import { IGrammarSimulation, SententialFormMemento } from "../simulation";

// prob LR or RR parsing commands
export abstract class GrammarRunCommand<T = void> {
  simulation: IGrammarSimulation;
  backup?: SententialFormMemento;
  result?: T;

  protected constructor(_simulation: IGrammarSimulation) {
    this.simulation = _simulation;
  }

  saveBackup() {
    this.backup = this.simulation.sententialForm.save();
  }

  undo() {
    if (this.backup) {
      this.simulation.sententialForm.restore(this.backup);
    }
  }

  getResult(): T | undefined {
    return this.result;
  }

  abstract execute(): IErrorMessage | undefined;
}

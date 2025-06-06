import { ErrorMessage, IErrorMessage, RunStoppedError, RunStoppedErrorMessage } from "../../common.ts";
import { NextStepVisitor } from "../visitors/configuration.ts";
import { IEdge } from "../edge.ts";
import { IAutomatonSimulation } from "../simulation.ts";
import { IConfigurationMemento } from "../configuration.ts";

export abstract class AutomatonRunCommand<T = void> {
  simulation: IAutomatonSimulation;
  backup?: IConfigurationMemento;
  result?: T;

  protected constructor(_simulation: IAutomatonSimulation) {
    this.simulation = _simulation;
  }

  saveBackup() {
    this.backup = this.simulation.configuration.save();
  }

  undo() {
    if (this.backup) {
      this.simulation.configuration.restore(this.backup);
    }
  }

  getResult(): T | undefined {
    return this.result;
  }

  abstract execute(): IErrorMessage | undefined; // this.saveBackup(); ...perform command...
}

export class NextStepCommand extends AutomatonRunCommand<IEdge> {
  constructor (_simulation: IAutomatonSimulation) {
    super (_simulation);
  }

  // creates new visitor, configuration accepts it, this simulates a step on the automata, saves the edge traversed into this.result
  execute(): IErrorMessage | undefined {
    this.saveBackup();
    const nextStepVisitor = new NextStepVisitor(this.simulation.automaton);

    try {
      const newConfiguration = this.simulation.configuration.accept(nextStepVisitor);
      this.simulation.configuration = newConfiguration;
      this.result = nextStepVisitor.result;
    } catch (error) {
      if (error instanceof Error) {
        if (error instanceof RunStoppedError) {
          return new RunStoppedErrorMessage (error.message);
        }
        return new ErrorMessage(error.message);
      }
    }

    return;
  }
}

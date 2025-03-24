import { RunCommand, ISimulation, IEdge } from "../types.ts";
import { IErrorMessage } from "../common.ts";
import { NextStepVisitor } from "../visitors/configuration.ts";

export class NextStepCommand extends RunCommand<IEdge> {

  constructor (_simulation: ISimulation) {
    super (_simulation);
  }

  // creates new visitor, configuration accepts it, this simulates a step on the automata, saves the edge traversed into this.result
  execute(): IErrorMessage | undefined {
    this.saveBackup();
    const nextStepVisitor = new NextStepVisitor(this.simulation.automaton);

    this.simulation.configuration = this.simulation.configuration.accept(nextStepVisitor);

    this.result = nextStepVisitor.result;

    return;
  }
}

import { AddStateCommand } from "./types/commands/edit";
import { IErrorMessage } from "./types/common";
import { IAutomatonFactory, AbstractAutomatonFactory } from "./types/factories";
import { IAutomaton, ISimulation, AutomatonType, EditCommand } from "./types/types";

export interface IEngine {
    addState: (id: string) => IErrorMessage | undefined;
}

export class Engine implements IEngine {
    // used to create automata and edges
    factory: IAutomatonFactory;
    // the automaton in first window, which is always present
    automaton: IAutomaton;
    // optional automaton in second window, which can be used to visualise algorithms
    secondaryAutomaton?: IAutomaton;
    // optionally hold current simulation
    // the simulation also contains configuration
    simulation?: ISimulation;

    constructor(type: AutomatonType) {
        this.factory = new AbstractAutomatonFactory(type);
        this.automaton = this.factory.createAutomaton("q_0");
    }

    addState(id: string) {
        const command: EditCommand = new AddStateCommand(this.automaton!, id);

        const error = this.automaton.executeCommand(command);
        if (error !== undefined) {
            return error;
        }
    };
}

import {
    FiniteConfiguration,
    IAutomaton,
    IConfigurationVisitor,
    PDAConfiguration,
    IEdge,
} from "../types.ts";

export class NextStepVisitor implements IConfigurationVisitor {
    automaton: IAutomaton;

    constructor(_automaton: IAutomaton) {
        this.automaton = _automaton;
    }

    visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration {
        // TODO implement: Based on this.automaton and configuration, calculate the next step configuration for FA
        const nextSymbol = configuration.remainingInput[0];

        let nextState: string | undefined;
        let delta: Record<string, IEdge[]>;
        delta = this.automaton.deltaFunctionMatrix[configuration.stateId];
        for (const key in delta){
            const edge = delta[key][0];
            if (edge.inputChar == nextSymbol) nextState = edge.id
        }

        if (nextState === undefined)    return configuration;
            else {
                let NewConfiguration: FiniteConfiguration;
                NewConfiguration = new FiniteConfiguration(nextState, configuration.remainingInput.slice(1));
                return NewConfiguration;
            }
    };
    visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration {
        // TODO implement: Based on this.automaton and configuration, calculate the next step configuration for PDA
        return configuration; // TODO remove, just a dummy return
    };
}

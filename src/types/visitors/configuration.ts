import {
    FiniteConfiguration,
    IAutomaton,
    IConfigurationVisitor,
    PDAConfiguration
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
        this.automaton.deltaFunctionMatrix[configuration.stateId].array.forEach(edge => {
            if (edge.inputChar == nextSymbol) nextState = edge.id
        });

        if (nextState === undefined)    return configuration;
                else {
                    const t = this.automaton.deltaFunctionMatrix[configuration.stateId][nextState];
                    return configuration
                }

    };

    visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration {
        // TODO implement: Based on this.automaton and configuration, calculate the next step configuration for PDA
        return configuration; // TODO remove, just a dummy return
    };
}

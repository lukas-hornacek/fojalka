import {
    FiniteConfiguration,
    IAutomaton,
    IConfigurationVisitor,
    PDAConfiguration,
} from "../types.ts";


export class NextStepVisitor implements IConfigurationVisitor {
    automaton: IAutomaton;

    constructor(_automaton: IAutomaton) {
        this.automaton = _automaton;
    }

    // Finite Automata visit command, preforms the next step command based on the finite configuration
    // (which has currnet StateId and next symbol) and the FiniteAutomaton in this.automaton (using the deltaFunction)
    visitFiniteConfiguration(configuration: FiniteConfiguration): FiniteConfiguration {
        const nextSymbol = configuration.remainingInput[0];

        let nextState: string | undefined;
        const delta = this.automaton.deltaFunctionMatrix[configuration.stateId];
        for (const key in delta){
            const edge = delta[key][0];
            if (edge.inputChar == nextSymbol) nextState = key;
        }

        if (nextState === undefined)    return configuration;
            else {
                const NewConfiguration = new FiniteConfiguration(nextState, configuration.remainingInput.slice(1));
                return NewConfiguration;
            }
    };

    
    visitPDAConfiguration(configuration: PDAConfiguration): PDAConfiguration {
        // TODO implement: Based on this.automaton and configuration, calculate the next step configuration for PDA
        return configuration; // TODO remove, just a dummy return
    };
}

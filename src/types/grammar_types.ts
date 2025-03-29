import {ErrorMessage, IErrorMessage} from "./common.ts";
import {arraysEqual} from "../utils.ts";

export enum GrammarType {
    REGULAR = "REGULAR",
    CONTEXT_FREE = "CONTEXT_FREE",
}

export class ProductionRule {
    id: string;
    inputNonTerminal: string;
    outputSymbols: string[];

    constructor(_id: string, inputNonTerminal: string, outputSymbols: string[]) {
        this.id = _id;
        this.inputNonTerminal = inputNonTerminal;
        this.outputSymbols = outputSymbols;
    }

    equals(other: ProductionRule): boolean {
        if (!(other instanceof ProductionRule)) {
            return false;
        }
        return this.inputNonTerminal === other.inputNonTerminal && arraysEqual(this.outputSymbols, other.outputSymbols);
    }

    toString(): string {
        return `${this.inputNonTerminal} -> ${this.outputSymbols.join("")}`;
    }
}

export class Grammar {
    grammarType: GrammarType;
    nonTerminalSymbols: string[];
    terminalSymbols: string[];
    initialNonTerminalSymbol: string;
    productionRules: ProductionRule[];
    commandHistory: GrammarEditCommand<unknown>[];
    
    constructor(grammarType: GrammarType,
        nonTerminalSymbols: string[],
        terminalSymbols: string[],
        initialNonTerminalSymbol: string) {
        this.grammarType = grammarType;
        this.nonTerminalSymbols = nonTerminalSymbols;
        this.terminalSymbols = terminalSymbols;
        this.initialNonTerminalSymbol = initialNonTerminalSymbol;
        this.productionRules = [];
        this.commandHistory = []
    }

    hasNonTerminalSymbol(findNonTerminal: string): boolean{
        return this.nonTerminalSymbols.some(nonTerminal => nonTerminal === findNonTerminal);
    }
    hasTerminalSymbol(findTerminal: string): boolean{
        return this.terminalSymbols.some(terminal => terminal === findTerminal);
    }
    
    executeCommand<T>(command: GrammarEditCommand<T>): void {
        let res = command.execute();
        if(res == undefined) {
            this.commandHistory.push(command);
        } else {
            throw res;
        }

        
    }
    undo(): void {
        const command = this.commandHistory.pop();
        if (command) {
          command.undo();
        }
    }

    save(): GrammarMemento {
        return new GrammarMemento(this.grammarType, this.nonTerminalSymbols, this.terminalSymbols, this.initialNonTerminalSymbol, this.productionRules)
    }
    restore(memento: GrammarMemento): void {
        this.grammarType = memento.grammarType;
        this.nonTerminalSymbols = memento.nonTerminalSymbols;
        this.terminalSymbols = memento.terminalSymbols;
        this.initialNonTerminalSymbol = memento.initialNonTerminalSymbol;
        this.productionRules = memento.productionRules;
        this.commandHistory = []
    }
}

export class GrammarMemento {
    grammarType: GrammarType;
    nonTerminalSymbols: string[];
    terminalSymbols: string[];
    initialNonTerminalSymbol: string;
    productionRules: ProductionRule[];
    
    constructor(grammarType: GrammarType,
        nonTerminalSymbols: string[],
        terminalSymbols: string[],
        initialNonTerminalSymbol: string,
        productionRules: ProductionRule[]) {
        this.grammarType = grammarType;
        this.nonTerminalSymbols = nonTerminalSymbols;
        this.terminalSymbols = terminalSymbols;
        this.initialNonTerminalSymbol = initialNonTerminalSymbol;
        this.productionRules = productionRules;
    }
}

export interface ISententialFormVisitor {
    visitRegularSententialForm(sententialForm: SententialForm): SententialForm;
    visitContextFreeSententialForm(sententialForm: SententialForm): SententialForm;
}

export class SententialForm {
    sententialForm: string[];
    constructor(sententialForm: string[]) {
        this.sententialForm = sententialForm;
    }

    accept(visitor: SententialForm): SententialForm {
        return visitor;
    }

    save(): SententialFormMemento {
        return new SententialFormMemento(this.sententialForm);

    }
    restore(memento: SententialFormMemento): void {
        this.sententialForm = memento.sententialForm;
    }
}

class SententialFormMemento {
    sententialForm: string[];
    constructor(sententialForm: string[]) {
        this.sententialForm = sententialForm;
    }
}

export interface IGrammarSimulation {
    grammar: Grammar;
    sententialForm: SententialForm;

    commandHistory: RunCommand<unknown>[];
    executeCommand<T>(command: RunCommand<T>): void; // if (command.execute()) { commandHistory.push(command); }
    undo(): void; // command = commandHistory.pop(); command.undo();

    run(): void;
}

export abstract class RunCommand<T = void> {
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

    abstract execute(): IErrorMessage | undefined; // this.saveBackup(); ...perform command...
}

export abstract class GrammarEditCommand<T = void> {
    grammar: Grammar;
    backup?: GrammarMemento;
    result?: T;

    protected constructor(grammar: Grammar) {
        this.grammar = grammar;
    }

    saveBackup() {
        this.backup = this.grammar.save();
    }

    undo() {
        if (this.backup) {
            this.grammar.restore(this.backup);
        }
    }

    getResult(): T | undefined {
        return this.result;
    }

    abstract execute(): IErrorMessage | undefined; // this.saveBackup(); ...perform command...
}

export class AddProductionRuleCommand extends GrammarEditCommand {
    productionRule: ProductionRule;
    
    constructor(grammar: Grammar, productionRule: ProductionRule) {
        super(grammar);
        this.productionRule = productionRule;
    }

    execute(): IErrorMessage | undefined {
        if(this.productionRule.inputNonTerminal == null) {
            return new ErrorMessage(`Cannot add production rule: input non-terminal is empty.`);
        }
        if(this.productionRule.outputSymbols === undefined || this.productionRule.outputSymbols.length == 0) {
            return new ErrorMessage(`Cannot add production rule: output symbols are empty.`);
        }
        if(!this.grammar.hasNonTerminalSymbol(this.productionRule.inputNonTerminal)) {
            return new ErrorMessage(`Cannot add production rule: non-terminal ${this.productionRule.inputNonTerminal} is not present in grammar's non-terminals ${this.grammar.nonTerminalSymbols}`);
        }
        for(let outputSymbol of this.productionRule.outputSymbols) {
            if (!this.grammar.hasNonTerminalSymbol(outputSymbol) && !this.grammar.hasTerminalSymbol(outputSymbol)) {
                return new ErrorMessage(`Cannot add production rule: output symbol ${outputSymbol} is not present in grammar's non-terminals ${this.grammar.nonTerminalSymbols} or terminals ${this.grammar.terminalSymbols}`);
            }
        }
        
        if(this.grammar.grammarType == GrammarType.REGULAR) {
            //P ⊆ N × T∗ (N ∪ {ε})
            let lastOutputSymbol = this.productionRule.outputSymbols.slice(-1)[0];
            let lastOutputSymbolIsEpsilon = lastOutputSymbol.length === 0;
            let lastOutputSymbolIsNonTerminal = this.grammar.hasNonTerminalSymbol(lastOutputSymbol);
            let prefixOutputSymbols = this.productionRule.outputSymbols.slice(0, -1);
            let prefixOutputSymbolsIsTerminal = prefixOutputSymbols.every(this.grammar.hasTerminalSymbol); // returns true for empty (Vacuous truth)
            let productionRuleIsContextFree = prefixOutputSymbolsIsTerminal && (lastOutputSymbolIsEpsilon || lastOutputSymbolIsNonTerminal);

            if(!productionRuleIsContextFree) {
                return new ErrorMessage(`Cannot add production rule: production rule ${this.productionRule} is not a regular rule.`);
            }
        } else if(this.grammar.grammarType == GrammarType.CONTEXT_FREE) {
            // OK by default
        }

        if(this.grammar.productionRules.includes(this.productionRule)) {
            return new ErrorMessage(`Cannot add production rule: ${this.productionRule.toString()}: is already present.`);
        }

        this.saveBackup();
        this.grammar.productionRules.push(this.productionRule);
        
        return undefined;
    }
}

export class RemoveProductionRuleCommand extends GrammarEditCommand {
    productionRuleId: string;
    
    constructor(grammar: Grammar, productionRuleId: string) {
        super(grammar);
        this.productionRuleId = productionRuleId;
    }
    
    execute(): IErrorMessage | undefined {
        let newProductionRules = this.grammar.productionRules.filter(productionRule => productionRule.id === this.productionRuleId);
        if(newProductionRules.length === this.grammar.productionRules.length) {
            return new ErrorMessage(`Cannot remove production rule ${this.productionRuleId}: production rule is not present.`);
        }
        this.saveBackup();
        this.grammar.productionRules = newProductionRules;
    }
}
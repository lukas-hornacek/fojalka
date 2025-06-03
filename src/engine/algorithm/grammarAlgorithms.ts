import { SECONDARY_CYTOSCAPE_ID, EPSILON, INITIAL_STATE } from "../../constants";
import { AutomatonCore, IAutomatonCore } from "../../core/automatonCore";
import { Kind, ModeHolder } from "../../core/core";
import { GrammarCore, IGrammarCore } from "../../core/grammarCore";
import { AutomatonType } from "./../automaton/automaton";
import { AddEdgeCommand, AddStateCommand, AutomatonEditCommand, RenameStateCommand, SetStateFinalFlagCommand } from "../automaton/commands/edit";
import { ErrorMessage } from "../common";
import { AddProductionRuleCommand } from "../grammar/commands/edit";
import { GrammarType } from "../grammar/grammar";
import { Algorithm, AlgorithmParams } from "./algorithm";

export class GrammarToAutomatonAlgorithm extends Algorithm {
  inputType: AlgorithmParams = { Kind: Kind.GRAMMAR, GrammarType: GrammarType.REGULAR };
  outputType: AlgorithmParams = { Kind: Kind.AUTOMATON, AutomatonType: AutomatonType.FINITE };

  inputCore: IGrammarCore;
  outputCore?: IAutomatonCore;

  constructor(_inputCore: IGrammarCore) {
    super();
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder) {
    if (this.inputCore.grammar.grammarType !== this.inputType.GrammarType) {
      throw new Error("Cannot use algorithm, as it only works with regular grammars.");
    }
    if (!this.isGrammarInNormalForm()) {
      throw new Error("Cannot use algorithm, as the grammar is not in required normal form. Try running the normal form algorithm first.");
    }

    this.outputCore = new AutomatonCore(AutomatonType.FINITE, SECONDARY_CYTOSCAPE_ID, mode);
    this.precomputeResults();

    return this.outputCore;
  }

  undo() {
    if (this.outputCore === undefined) {
      return new ErrorMessage("Cannot undo algorithm step before start.");
    }
    if (this.index === 0) {
      return new ErrorMessage("There is nothing to undo.");
    }

    this.outputCore.automaton.undo();
    this.index--;
  }

  precomputeResults() {
    this.results = [];

    //add state for each nonterminal
    const initialNonTerminal = this.inputCore.grammar.initialNonTerminalSymbol;
    let currentCommand: AutomatonEditCommand = new RenameStateCommand(this.outputCore!.automaton, INITIAL_STATE, initialNonTerminal);
    this.results.push({ highlight: [initialNonTerminal], command: currentCommand });

    for (const nonterminal of this.inputCore.grammar.nonTerminalSymbols) {
      if (nonterminal !== initialNonTerminal) {
        currentCommand = new AddStateCommand(this.outputCore!.automaton, nonterminal);
        this.results.push({ highlight: [nonterminal], command: currentCommand });
      }
    }

    //add final state
    currentCommand = new AddStateCommand(this.outputCore!.automaton, "fin");
    this.results.push({ highlight: [], command: currentCommand });

    currentCommand = new SetStateFinalFlagCommand(this.outputCore!.automaton, "fin", true);
    this.results.push({ highlight: [], command: currentCommand });

    //add edges corresponding to the production rules
    for (const rule of this.inputCore.grammar.productionRules) {
      const firstOuputSymbol = rule.outputSymbols[0];
      const secondOuputSymbol = rule.outputSymbols[1];

      if (rule.outputSymbols.length === 2) {
        const edge = this.outputCore!.createEdge({ id: "", inputChar: firstOuputSymbol });
        currentCommand = new AddEdgeCommand(this.outputCore!.automaton, rule.inputNonTerminal, secondOuputSymbol, edge);
      }
      else if (this.inputCore.grammar.hasNonTerminalSymbol(firstOuputSymbol)) {
        const edge = this.outputCore!.createEdge({ id: "", inputChar: EPSILON });
        currentCommand = new AddEdgeCommand(this.outputCore!.automaton, rule.inputNonTerminal, firstOuputSymbol, edge);
      }
      else {
        const edge = this.outputCore!.createEdge({ id: "", inputChar: firstOuputSymbol });
        currentCommand = new AddEdgeCommand(this.outputCore!.automaton, rule.inputNonTerminal, "fin", edge);
      }
      this.results.push({ highlight: [rule.id], command: currentCommand });
    }
  }

  //function checks if all rules in grammar have at most one terminal on the right side and length of the right side at most 2
  isGrammarInNormalForm() {
    for (const rule of this.inputCore.grammar.productionRules) {
      if (rule.outputSymbols.length > 2) {
        return false;
      }
      if (rule.outputSymbols.length == 2 && !this.inputCore.grammar.hasNonTerminalSymbol(rule.outputSymbols[1])) {
        return false;
      }
    }

    return true;
  }
}

//transforms grammar into normal form where all rules in the grammar have at most one terminal on the right side
export class GrammarNormalFormAlgorithm extends Algorithm {
  inputType: AlgorithmParams = { Kind: Kind.GRAMMAR, GrammarType: GrammarType.REGULAR };
  outputType: AlgorithmParams = { Kind: Kind.GRAMMAR, GrammarType: GrammarType.REGULAR };

  inputCore: IGrammarCore;
  outputCore?: IGrammarCore;

  constructor(_inputCore: IGrammarCore) {
    super();
    this.inputCore = _inputCore;
  }

  init(mode: ModeHolder) {
    if (this.inputCore.grammar.grammarType !== this.inputType.GrammarType) {
      throw new Error("Cannot use algorithm, as it only works with regular grammars.");
    }

    this.outputCore = new GrammarCore(GrammarType.REGULAR, mode);
    this.precomputeResults();

    return this.outputCore;
  }

  undo() {
    if (this.outputCore === undefined) {
      return new ErrorMessage("Cannot undo algorithm step before start.");
    }
    if (this.index === 0) {
      return new ErrorMessage("There is nothing to undo.");
    }

    this.outputCore.grammar.undo();
    this.index--;
  }

  precomputeResults() {
    //add all original symbols to grammar
    this.outputCore!.grammar.nonTerminalSymbols = [...this.inputCore.grammar.nonTerminalSymbols];
    this.outputCore!.grammar.terminalSymbols = [...this.inputCore.grammar.terminalSymbols];
    this.outputCore!.grammar.initialNonTerminalSymbol = this.inputCore.grammar.initialNonTerminalSymbol;

    this.results = [];

    let id = 1;
    for (const rule of this.inputCore.grammar.productionRules) {
      const lastOutputSymbol = rule.outputSymbols.slice(-1)[0];
      const secondToLastOutputSymbol = rule.outputSymbols.slice(-2)[0];

      //for each rule that has more than one terminal on the right side add new nonterminal symbols
      //using the new nonterminals divide the rule into several short rules
      if (rule.outputSymbols.length > 2 || rule.outputSymbols.length === 2 && this.inputCore.grammar.hasTerminalSymbol(lastOutputSymbol)) {
        const prefixOutputSymbols = rule.outputSymbols.slice(0, -2);
        let input = rule.inputNonTerminal;
        let i = 1;

        for (const symbol of prefixOutputSymbols) {
          const newSymbol = "ψ" + id + "," + i;
          this.outputCore!.grammar.nonTerminalSymbols.push(newSymbol);

          const newRule = this.outputCore!.factory.createProductionRule(input, [symbol, newSymbol], this.outputCore!.grammar);
          const command = new AddProductionRuleCommand(this.outputCore!.grammar, newRule);
          this.results.push({ highlight: [rule.id], command: command });

          input = newSymbol;
          i++;
        }

        //special case when the final two output symbols are both terminal
        if (this.inputCore.grammar.hasTerminalSymbol(lastOutputSymbol)) {
          const newSymbol = "ψ" + id + "," + i;
          this.outputCore!.grammar.nonTerminalSymbols.push(newSymbol);

          let newRule = this.outputCore!.factory.createProductionRule(input, [secondToLastOutputSymbol, newSymbol], this.outputCore!.grammar);
          let command = new AddProductionRuleCommand(this.outputCore!.grammar, newRule);
          this.results.push({ highlight: [rule.id], command: command });

          newRule = this.outputCore!.factory.createProductionRule(newSymbol, [lastOutputSymbol], this.outputCore!.grammar);
          command = new AddProductionRuleCommand(this.outputCore!.grammar, newRule);
          this.results.push({ highlight: [rule.id], command: command });
        }
        else {
          const newRule = this.outputCore!.factory.createProductionRule(input, [secondToLastOutputSymbol, lastOutputSymbol], this.outputCore!.grammar);
          const command = new AddProductionRuleCommand(this.outputCore!.grammar, newRule);
          this.results.push({ highlight: [rule.id], command: command });
        }

        id++;
      }
      else {
        const command = new AddProductionRuleCommand(this.outputCore!.grammar, rule);
        this.results.push({ highlight: [rule.id], command: command });
      }
    }
  }
}

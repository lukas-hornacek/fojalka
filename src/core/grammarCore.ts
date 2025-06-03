import { INITIAL_NONTERMINAL } from "../constants";
import {
  IEditCommandVisitor,
  VisualVisitor,
} from "../engine/automaton/visitors/editCommand";
import { ErrorMessage, IErrorMessage } from "../engine/common";
import {
  AddNonterminalsCommand,
  AddProductionRuleCommand,
  AddTerminalsCommand,
  EditProductionRuleCommand,
  GrammarEditCommand,
  RemoveNonterminalCommand,
  RemoveProductionRuleCommand,
  RemoveTerminalCommand,
  SetInitialNonterminalCommand,
} from "../engine/grammar/commands/edit";
import {
  AbstractGrammarFactory,
  IGrammarFactory,
} from "../engine/grammar/factories";
import { Grammar, GrammarType } from "../engine/grammar/grammar";
import { IGrammarSimulation } from "../engine/grammar/simulation";
import { SavedGrammar } from "../ui/importAndExport";
import { GrammarVisual, IGrammarVisual } from "../visual/grammarVisual";
import { ModeHolder, Kind, Mode } from "./core";

export interface IGrammarCore {
  kind: Kind.GRAMMAR;
  mode: ModeHolder;
  factory: IGrammarFactory;
  grammar: Grammar;
  visual: IGrammarVisual;
  type: GrammarType;

  display: () => React.ReactNode;

  addProductionRule: (
    inputNonTerminal: string,
    outputSymbols: string[]
  ) => IErrorMessage | undefined;
  editProductionRule: (
    id: string,
    inputNonTerminal: string,
    outputSymbols: string[]
  ) => IErrorMessage | undefined;
  removeProductionRule: (id: string) => IErrorMessage | undefined;
  addNonterminals: (nonterminals: string[]) => IErrorMessage | undefined;
  addTerminals: (terminals: string[]) => IErrorMessage | undefined;
  removeNonterminal: (nonTerminal: string) => IErrorMessage | undefined;
  removeTerminal: (terminal: string) => IErrorMessage | undefined;
  setInitialNonterminal: (nonTerminal: string) => IErrorMessage | undefined;
  undo: () => IErrorMessage | undefined;

  highlight: (ids: string[]) => IErrorMessage | undefined;

  // ??
  simulateParsing: (word: string[]) => unknown;

  visitor: IEditCommandVisitor;

  getCytoscape: () => cytoscape.Core | undefined;
}

export class GrammarCore implements IGrammarCore {
  kind = Kind.GRAMMAR as const;
  mode: ModeHolder;
  type: GrammarType;

  factory: IGrammarFactory;
  grammar: Grammar;
  simulation?: IGrammarSimulation;

  visual: IGrammarVisual;
  visitor: IEditCommandVisitor;

  constructor(type: GrammarType, mode: ModeHolder) {
    this.type = type;

    this.factory = new AbstractGrammarFactory(type);
    this.grammar = this.factory.createGrammar(
      [INITIAL_NONTERMINAL],
      [],
      INITIAL_NONTERMINAL
    );

    this.visual = new GrammarVisual();
    this.visual.setGrammar(this.grammar);
    this.visitor = new VisualVisitor(this.visual);
    this.mode = mode;
  }

  static fromSavedJSON(savedGrammar: SavedGrammar): GrammarCore {
    const grammarCore = new GrammarCore(savedGrammar.type, { mode: Mode.EDIT });
    grammarCore.grammar = new Grammar(
      savedGrammar.grammar.grammarType,
      savedGrammar.grammar.nonTerminalSymbols,
      savedGrammar.grammar.terminalSymbols,
      savedGrammar.grammar.initialNonTerminalSymbol,
      savedGrammar.grammar.productionRules
    );

    return grammarCore;
  }

  display() {
    return this.visual.display();
  }

  addProductionRule(inputNonTerminal: string, outputSymbols: string[]) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    try {
      const rule = this.factory.createProductionRule(
        inputNonTerminal,
        outputSymbols,
        this.grammar
      );
      const command: GrammarEditCommand = new AddProductionRuleCommand(
        this.grammar,
        rule
      );

      const error = this.grammar.executeCommand(command);
      if (error !== undefined) {
        return error;
      }

      // highlighting newly added rules
      // this.visual.clearHighlights();
      // this.visual.highlight([rule.id]);

      command.accept(this.visitor);
    } catch (e: unknown) {
      if (e instanceof Error) {
        return new ErrorMessage(e.message);
      }
    }
  }

  editProductionRule(
    id: string,
    inputNonTerminal: string,
    outputSymbols: string[]
  ) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    try {
      const rule = this.factory.createProductionRule(
        inputNonTerminal,
        outputSymbols,
        this.grammar
      );
      const command: GrammarEditCommand = new EditProductionRuleCommand(
        this.grammar,
        id,
        rule
      );

      const error = this.grammar.executeCommand(command);
      if (error !== undefined) {
        return error;
      }

      command.accept(this.visitor);
    } catch (e: unknown) {
      if (e instanceof Error) {
        return new ErrorMessage(e.message);
      }
    }
  }

  removeProductionRule(id: string) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    const command: GrammarEditCommand = new RemoveProductionRuleCommand(
      this.grammar,
      id
    );

    const error = this.grammar.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  addNonterminals(nonTerminals: string[]) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }
    for (const symbol of nonTerminals) {
      const trimmed = symbol.trim();

      if (trimmed.length === 0) {
        return new ErrorMessage(
          "Nonterminal symbol must contain at least one non-whitespace character."
        );
      }

      if (trimmed.charAt(0) === "_") {
        return new ErrorMessage(
          "Nonterminal symbol cannot start with an underscore."
        );
      }

      if (trimmed.includes(" ")) {
        return new ErrorMessage("Nonterminal symbol must not contain spaces.");
      }
    }

    const command: GrammarEditCommand = new AddNonterminalsCommand(
      this.grammar,
      nonTerminals
    );

    const error = this.grammar.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    // highlighting newly added non-terminals
    // this.visual.clearHighlights();
    // this.visual.highlight(nonTerminals);
    command.accept(this.visitor);
  }

  addTerminals(terminals: string[]) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }
    for (const symbol of terminals) {
      const trimmed = symbol.trim();

      if (trimmed.length === 0) {
        return new ErrorMessage(
          "Terminal symbol must contain at least one non-whitespace character."
        );
      }

      if (trimmed.charAt(0) === "_") {
        return new ErrorMessage(
          "Terminal symbol cannot start with an underscore."
        );
      }

      if (trimmed.includes(" ")) {
        return new ErrorMessage("Terminal symbol must not contain spaces.");
      }
    }

    const command: GrammarEditCommand = new AddTerminalsCommand(
      this.grammar,
      terminals
    );

    const error = this.grammar.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    // highlighting newly added terminals
    // this.visual.clearHighlights();
    // this.visual.highlight(terminals);
    command.accept(this.visitor);
  }

  removeNonterminal(nonTerminal: string) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    const command: GrammarEditCommand = new RemoveNonterminalCommand(
      this.grammar,
      nonTerminal
    );

    const error = this.grammar.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  removeTerminal(terminal: string) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    const command: GrammarEditCommand = new RemoveTerminalCommand(
      this.grammar,
      terminal
    );

    const error = this.grammar.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  setInitialNonterminal(nonTerminal: string) {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }

    const command: GrammarEditCommand = new SetInitialNonterminalCommand(
      this.grammar,
      nonTerminal
    );

    const error = this.grammar.executeCommand(command);
    if (error !== undefined) {
      return error;
    }

    command.accept(this.visitor);
  }

  undo() {
    if (this.mode.mode !== Mode.EDIT) {
      return new ErrorMessage("Operation is only permitted in edit mode.");
    }
    const maybeError = this.grammar.undo();
    this.visual.refresh();
    this.visual.refresher?.(this.visual.display());
    return maybeError;
  }

  highlight(ids: string[]) {
    if (this.mode.mode !== Mode.VISUAL) {
      return new ErrorMessage("Operation is only permitted in visual mode.");
    }

    this.visual.clearHighlights();
    this.visual.highlight(ids);
  }

  simulateParsing(word: string[]) {
    if (this.mode.mode !== Mode.VISUAL) {
      return new ErrorMessage("Operation is only permitted in visual mode.");
    }

    return new ErrorMessage(`Not implemented. ${word}`);
  }

  getCytoscape() {
    return undefined;
  }
}

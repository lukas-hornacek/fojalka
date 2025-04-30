import { Kind } from "../../../core/core";
import { IAutomatonVisual } from "../../../visual/automatonVisual";
import { IGrammarVisual } from "../../../visual/grammarVisual";
import { AddNonterminalsCommand, AddProductionRuleCommand, AddTerminalsCommand, RemoveNonterminalCommand, RemoveProductionRuleCommand, RemoveTerminalCommand, SetInitialNonterminalCommand } from "../../grammar/commands/edit";
import { AddEdgeCommand, AddStateCommand, EditEdgeCommand, RemoveEdgeCommand, RemoveStateCommand, RenameStateCommand, SetInitialStateCommand, SetStateFinalFlagCommand } from "../commands/edit";

export interface IEditCommandVisitor {
  // automaton commands
  visitAddStateCommand(command: AddStateCommand): void;
  visitRemoveStateCommand(command: RemoveStateCommand): void;
  visitRenameStateCommand(command: RenameStateCommand): void;
  visitSetInitialStateCommand(command: SetInitialStateCommand): void;
  visitSetStateFinalFlagCommand(command: SetStateFinalFlagCommand): void;
  visitAddEdgeCommand(command: AddEdgeCommand): void;
  visitRemoveEdgeCommand(command: RemoveEdgeCommand): void;
  visitEditEdgeCommand(command: EditEdgeCommand): void;

  // grammar commands
  visitAddProductionRuleCommand(command: AddProductionRuleCommand): void;
  visitRemoveProductionRuleCommand(command: RemoveProductionRuleCommand): void;
  visitAddNonterminalsCommand(command: AddNonterminalsCommand): void;
  visitAddTerminalsCommand(command: AddTerminalsCommand): void;
  visitSetInitialNonterminalCommand(command: SetInitialNonterminalCommand): void;
  visitRemoveNonterminalCommand(command: RemoveNonterminalCommand): void;
  visitRemoveTerminalCommand(command: RemoveTerminalCommand): void;
}

export class VisualVisitor implements IEditCommandVisitor {
  visual: IAutomatonVisual | IGrammarVisual;

  constructor(visual: IAutomatonVisual | IGrammarVisual) {
    this.visual = visual;
  }

  visitAddStateCommand(command: AddStateCommand) {
    if (this.visual.kind !== Kind.AUTOMATON) {
      throw new Error("Type mismatch");
    }
    // TODO eventually we will probably want to get initial position from mouse position
    this.visual.addNode(command.stateId, { x: 0, y: 0 });
  }

  visitRemoveStateCommand(command: RemoveStateCommand): void {
    if (this.visual.kind !== Kind.AUTOMATON) {
      throw new Error("Type mismatch");
    }
    this.visual.removeNode(command.stateId);
  }

  visitRenameStateCommand(command: RenameStateCommand): void {
    if (this.visual.kind !== Kind.AUTOMATON) {
      throw new Error("Type mismatch");
    }
    this.visual.renameNode(command.stateId, command.newStateId);
  }

  visitSetInitialStateCommand(command: SetInitialStateCommand): void {
    if (this.visual.kind !== Kind.AUTOMATON) {
      throw new Error("Type mismatch");
    }
    this.visual.setInitialNode(command.stateId);
  }

  visitSetStateFinalFlagCommand(command: SetStateFinalFlagCommand): void {
    if (this.visual.kind !== Kind.AUTOMATON) {
      throw new Error("Type mismatch");
    }
    this.visual.setIsFinalNode(command.stateId, command.shouldBeFinal);
  }

  visitAddEdgeCommand(command: AddEdgeCommand): void {
    if (this.visual.kind !== Kind.AUTOMATON) {
      throw new Error("Type mismatch");
    }
    this.visual.addEdge(command.edge.id, command.fromStateId, command.toStateId, command.edge.label);
  }

  visitRemoveEdgeCommand(command: RemoveEdgeCommand): void {
    if (this.visual.kind !== Kind.AUTOMATON) {
      throw new Error("Type mismatch");
    }
    this.visual.removeEdge(command.edgeId);
  }

  visitEditEdgeCommand(command: EditEdgeCommand): void {
    if (this.visual.kind !== Kind.AUTOMATON) {
      throw new Error("Type mismatch");
    }
    this.visual.editEdge(command.edgeId, command.edge.label);
  }

  // no point implementing this until we have actual grammar visualisation
  visitAddProductionRuleCommand(command: AddProductionRuleCommand): void {
    if (this.visual.kind !== Kind.GRAMMAR) {
      throw new Error("Type mismatch");
    }
    throw new Error(`Not implemented. ${command}`);
  }

  // no point implementing this until we have actual grammar visualisation
  visitRemoveProductionRuleCommand(command: RemoveProductionRuleCommand): void {
    if (this.visual.kind !== Kind.GRAMMAR) {
      throw new Error("Type mismatch");
    }
    throw new Error(`Not implemented. ${command}`);
  }

  // no point implementing this until we have actual grammar visualisation
  visitAddNonterminalsCommand(command: AddNonterminalsCommand): void {
    if (this.visual.kind !== Kind.GRAMMAR) {
      throw new Error("Type mismatch");
    }
    throw new Error(`Not implemented. ${command}`);
  }

  // no point implementing this until we have actual grammar visualisation
  visitAddTerminalsCommand(command: AddTerminalsCommand): void {
    if (this.visual.kind !== Kind.GRAMMAR) {
      throw new Error("Type mismatch");
    }
    throw new Error(`Not implemented. ${command}`);
  }

  // no point implementing this until we have actual grammar visualisation
  visitSetInitialNonterminalCommand(command: SetInitialNonterminalCommand): void {
    if (this.visual.kind !== Kind.GRAMMAR) {
      throw new Error("Type mismatch");
    }
    throw new Error(`Not implemented. ${command}`);
  }

  // no point implementing this until we have actual grammar visualisation
  visitRemoveNonterminalCommand(command: RemoveNonterminalCommand): void {
    if (this.visual.kind !== Kind.GRAMMAR) {
      throw new Error("Type mismatch");
    }
    throw new Error(`Not implemented. ${command}`);
  }

  // no point implementing this until we have actual grammar visualisation
  visitRemoveTerminalCommand(command: RemoveTerminalCommand): void {
    if (this.visual.kind !== Kind.GRAMMAR) {
      throw new Error("Type mismatch");
    }
    throw new Error(`Not implemented. ${command}`);
  }
}

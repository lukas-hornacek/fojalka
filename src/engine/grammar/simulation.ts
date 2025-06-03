import { GrammarRunCommand } from "./commands/run";
import { Grammar } from "./grammar";

export abstract class IGrammarSimulation {
  grammar: Grammar;
  sententialForm: SententialForm;
  commandHistory: GrammarRunCommand<unknown>[];

  constructor(grammar: Grammar, sententialForm: SententialForm) {
    this.grammar = grammar;
    this.sententialForm = sententialForm;
    this.commandHistory = [];
  }

  executeCommand<T>(command: GrammarRunCommand<T>): void {
    if (command.execute()) {
      this.commandHistory.push(command);
    }
  }
  undo(): void {
    this.commandHistory.pop()?.undo();
  }

  abstract run(): void;
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

export class SententialFormMemento {
  sententialForm: string[];
  constructor(sententialForm: string[]) {
    this.sententialForm = [...sententialForm];
  }
}

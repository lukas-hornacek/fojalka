import { IConfigurationVisitor } from "./visitors/configuration";

export interface IAutomatonConfiguration {
  stateId: string;
  remainingInput: string[];

  accept(visitor: IConfigurationVisitor): IAutomatonConfiguration;
  save(): IConfigurationMemento;
  restore(memento: IConfigurationMemento): void;
}

export class FiniteConfiguration implements IAutomatonConfiguration {
  stateId: string;
  remainingInput: string[];

  constructor(_stateId: string, _remainingInput: string[]) {
    this.stateId = _stateId;
    this.remainingInput = _remainingInput;
  }

  accept(visitor: IConfigurationVisitor): FiniteConfiguration {
    return visitor.visitFiniteConfiguration(this);
  }

  save(): FiniteConfigurationMemento {
    return new FiniteConfigurationMemento(this.stateId, this.remainingInput);
  }

  restore(memento: FiniteConfigurationMemento): void {
    this.stateId = memento.stateId;
    this.remainingInput = memento.remainingInput;
  }
}

export class PDAConfiguration implements IAutomatonConfiguration {
  stateId: string;
  remainingInput: string[];
  stack: string[];

  constructor(_stateId: string, _remainingInput: string[], _stack: string[]) {
    this.stateId = _stateId;
    this.remainingInput = _remainingInput;
    this.stack = _stack;
  }

  accept(visitor: IConfigurationVisitor): PDAConfiguration {
    return visitor.visitPDAConfiguration(this);
  }

  save(): PDAConfigurationMemento {
    return new PDAConfigurationMemento(this.stateId, this.remainingInput, this.stack);
  }

  restore(memento: PDAConfigurationMemento): void {
    this.stateId = memento.stateId;
    this.remainingInput = memento.remainingInput;
    this.stack = memento.stack;
  }
}

export interface IConfigurationMemento {
  stateId: string;
}

export class FiniteConfigurationMemento implements IConfigurationMemento {
  stateId: string;
  remainingInput: string[];

  constructor(_stateId: string, _remainingInput: string[]) {
    this.stateId = _stateId;
    this.remainingInput = [..._remainingInput];
  }
}

export class PDAConfigurationMemento implements IConfigurationMemento {
  stateId: string;
  remainingInput: string[];
  stack: string[];

  constructor(_stateId: string, _remainingInput: string[], _stack: string[]) {
    this.stateId = _stateId;
    this.remainingInput = [..._remainingInput];
    this.stack = [..._stack];
  }
}

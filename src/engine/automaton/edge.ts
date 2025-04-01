import { arraysEqual } from "../../utils";

export interface IEdge {
  id: string;
  inputChar: string;

  equals(otherEdge: IEdge): boolean;
}

export class FiniteAutomatonEdge implements IEdge {
  id: string;
  inputChar: string;

  constructor(_id: string, _inputChar: string) {
    this.id = _id;
    this.inputChar = _inputChar;
  }

  equals(otherEdge: IEdge): boolean {
    if (!(otherEdge instanceof FiniteAutomatonEdge)) {
      return false;
    }
    return this.inputChar === otherEdge.inputChar;
  }
}

export class PDAEdge implements IEdge {
  id: string;
  inputChar: string;
  readStackChar: string;
  writeStackWord: string[];

  constructor(_id: string, _inputChar: string, _readStackChar: string, _writeStackWord: string[]) {
    this.id = _id;
    this.inputChar = _inputChar;
    this.readStackChar = _readStackChar;
    this.writeStackWord = _writeStackWord;
  }

  equals(otherEdge: IEdge): boolean {
    if (!(otherEdge instanceof PDAEdge)) {
      return false;
    }
    return (
      this.inputChar === otherEdge.inputChar &&
        this.readStackChar === otherEdge.readStackChar &&
        arraysEqual(this.writeStackWord, otherEdge.writeStackWord)
    );
  }
}

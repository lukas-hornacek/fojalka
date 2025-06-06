export interface IErrorMessage {
  details: string;
}

export class ErrorMessage implements IErrorMessage {
  details: string;

  constructor(_details: string) {
    this.details = _details;
  }
}

export class RunStoppedErrorMessage extends ErrorMessage {
}

export class RunStoppedError extends Error {
}

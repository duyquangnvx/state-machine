export class StateNotFoundError extends Error {
  constructor(stateId: string) {
    super(`State not found: "${stateId}"`);
    this.name = "StateNotFoundError";
  }
}

export class MachineNotStartedError extends Error {
  constructor() {
    super("State machine has not been started. Call start() first.");
    this.name = "MachineNotStartedError";
  }
}

export class TransitionDeniedError extends Error {
  constructor(from: string, to: string) {
    super(`Transition denied: "${from}" -> "${to}"`);
    this.name = "TransitionDeniedError";
  }
}

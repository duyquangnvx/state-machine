import type { StateChangeEvent } from "./interfaces.js";

export type StateEventListener<TStateId extends string> = (
  event: StateChangeEvent<TStateId>,
) => void;

/**
 * Typed event emitter for state changes with bounded history.
 */
export class StateEventEmitter<TStateId extends string> {
  private readonly listeners: StateEventListener<TStateId>[] = [];
  private readonly history: StateChangeEvent<TStateId>[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  on(listener: StateEventListener<TStateId>): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  emit(change: StateChangeEvent<TStateId>): void {
    this.history.push(change);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    for (const listener of this.listeners) {
      listener(change);
    }
  }

  getHistory(): ReadonlyArray<StateChangeEvent<TStateId>> {
    return [...this.history];
  }

  clear(): void {
    this.history.length = 0;
    this.listeners.length = 0;
  }
}

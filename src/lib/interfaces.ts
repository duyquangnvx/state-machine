/**
 * A single state in the machine.
 * TContext is shared mutable data, TStateId identifies states.
 *
 * All lifecycle hooks are synchronous. Model async work as its own
 * state that polls for completion in onUpdate.
 */
export interface IState<TContext, TStateId extends string> {
  readonly id: TStateId;
  canTransitionTo(targetState: TStateId, ctx: TContext): boolean;
  onEnter(ctx: TContext, prevState: TStateId | null): void;
  onUpdate(ctx: TContext, dt: number): TStateId | undefined;
  onExit(ctx: TContext, nextState: TStateId | null): void;
}

/**
 * Recorded state change for history / debugging.
 */
export interface StateChangeEvent<TStateId extends string> {
  from: TStateId;
  to: TStateId;
  timestamp: number;
}

/**
 * Configuration to construct a StateMachine.
 */
export interface StateMachineConfig<TContext, TStateId extends string> {
  states: IState<TContext, TStateId>[];
  initialState: TStateId;
  context: TContext;
  historySize?: number;
}

/**
 * Public interface for a state machine.
 */
export interface IStateMachine<TContext, TStateId extends string> {
  readonly currentStateId: TStateId;
  readonly context: TContext;
  readonly isStarted: boolean;
  start(): void;
  stop(): void;
  transitionTo(stateId: TStateId): void;
  update(dt: number): void;
  getHistory(): ReadonlyArray<StateChangeEvent<TStateId>>;
}

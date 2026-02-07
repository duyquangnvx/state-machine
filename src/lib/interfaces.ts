/**
 * A single state in the machine.
 * TContext is shared mutable data, TStateId identifies states.
 *
 * onEnter/onExit may be async (e.g. API calls, data loading).
 * onUpdate stays sync — runs every tick, should be fast.
 */
export interface IState<TContext, TStateId extends string> {
  readonly id: TStateId;
  onEnter(ctx: TContext): void | Promise<void>;
  onUpdate(ctx: TContext, dt: number): TStateId | undefined;
  onExit(ctx: TContext): void | Promise<void>;
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
  start(): Promise<void>;
  stop(): Promise<void>;
  transitionTo(stateId: TStateId): Promise<void>;
  update(dt: number): Promise<void>;
  getHistory(): ReadonlyArray<StateChangeEvent<TStateId>>;
}

import type {
  IState,
  IStateMachine,
  StateMachineConfig,
  StateChangeEvent,
} from "./interfaces.js";
import { StateEventEmitter, type StateEventListener } from "./StateEvent.js";
import {
  StateNotFoundError,
  MachineNotStartedError,
  TransitionDeniedError,
} from "./errors.js";

export class StateMachine<TContext, TStateId extends string>
  implements IStateMachine<TContext, TStateId>
{
  private readonly stateMap = new Map<TStateId, IState<TContext, TStateId>>();
  private readonly emitter: StateEventEmitter<TStateId>;
  private currentState: IState<TContext, TStateId> | null = null;
  private readonly initialStateId: TStateId;
  private _isStarted = false;

  readonly context: TContext;

  constructor(config: StateMachineConfig<TContext, TStateId>) {
    this.context = config.context;
    this.initialStateId = config.initialState;
    this.emitter = new StateEventEmitter(config.historySize ?? 100);

    for (const state of config.states) {
      if (this.stateMap.has(state.id)) {
        throw new Error(`Duplicate state id: "${state.id}"`);
      }
      this.stateMap.set(state.id, state);
    }

    if (!this.stateMap.has(config.initialState)) {
      throw new StateNotFoundError(config.initialState);
    }
  }

  get currentStateId(): TStateId {
    if (!this.currentState) throw new MachineNotStartedError();
    return this.currentState.id;
  }

  get isStarted(): boolean {
    return this._isStarted;
  }

  start(): void {
    if (this._isStarted) return;
    const state = this.stateMap.get(this.initialStateId);
    if (!state) throw new StateNotFoundError(this.initialStateId);
    this.currentState = state;
    this._isStarted = true;
    this.currentState.onEnter(this.context, null);
  }

  stop(): void {
    if (!this._isStarted || !this.currentState) return;
    this.currentState.onExit(this.context, null);
    this.currentState = null;
    this._isStarted = false;
  }

  transitionTo(stateId: TStateId): void {
    if (!this.currentState) throw new MachineNotStartedError();
    const to = this.stateMap.get(stateId);
    if (!to) throw new StateNotFoundError(stateId);

    const from = this.currentState;
    if (!from.canTransitionTo(stateId, this.context)) {
      throw new TransitionDeniedError(from.id, stateId);
    }

    const change: StateChangeEvent<TStateId> = {
      from: from.id,
      to: to.id,
      timestamp: Date.now(),
    };

    from.onExit(this.context, to.id);
    this.currentState = to;
    this.emitter.emit(change);
    to.onEnter(this.context, from.id);
  }

  update(dt: number): void {
    if (!this.currentState) throw new MachineNotStartedError();
    const next = this.currentState.onUpdate(this.context, dt);
    if (next) {
      this.transitionTo(next);
    }
  }

  on(listener: StateEventListener<TStateId>): () => void {
    return this.emitter.on(listener);
  }

  getHistory(): ReadonlyArray<StateChangeEvent<TStateId>> {
    return this.emitter.getHistory();
  }
}

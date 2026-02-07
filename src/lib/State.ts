import type { IState } from "./interfaces.js";

/**
 * Abstract base class providing default no-op lifecycle hooks.
 * Concrete states override only what they need.
 *
 * onEnter/onExit can be overridden as async when needed.
 * onUpdate stays sync — return a state ID to trigger a transition.
 */
export abstract class BaseState<TContext, TStateId extends string>
  implements IState<TContext, TStateId>
{
  abstract readonly id: TStateId;

  onEnter(_ctx: TContext, _prevState: TStateId | null): void | Promise<void> {
    // no-op
  }

  onUpdate(_ctx: TContext, _dt: number): TStateId | undefined {
    return undefined;
  }

  onExit(_ctx: TContext, _nextState: TStateId | null): void | Promise<void> {
    // no-op
  }
}

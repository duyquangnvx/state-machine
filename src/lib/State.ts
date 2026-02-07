import type { IState } from "./interfaces.js";

/**
 * Abstract base class providing default no-op lifecycle hooks.
 * Concrete states override only what they need.
 */
export abstract class BaseState<TContext, TStateId extends string>
  implements IState<TContext, TStateId>
{
  abstract readonly id: TStateId;

  onEnter(_ctx: TContext): void {
    // no-op
  }

  onUpdate(_ctx: TContext, _dt: number): TStateId | undefined {
    return undefined;
  }

  onExit(_ctx: TContext): void {
    // no-op
  }
}

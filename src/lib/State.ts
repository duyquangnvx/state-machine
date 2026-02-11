import type { IState } from './interfaces.js';

/**
 * Abstract base class providing default no-op lifecycle hooks.
 * Concrete states override only what they need.
 *
 * All hooks are synchronous. Model async work as its own state
 * that polls for completion in onUpdate.
 */
export abstract class BaseState<TContext, TStateId extends string>
    implements IState<TContext, TStateId>
{
    abstract readonly id: TStateId;

    canTransitionTo(_targetState: TStateId, _ctx: TContext): boolean {
        return true;
    }

    onEnter(_ctx: TContext, _prevState: TStateId | null): void {
        // no-op
    }

    onUpdate(_ctx: TContext, _dt: number): TStateId | undefined {
        return undefined;
    }

    onExit(_ctx: TContext, _nextState: TStateId | null): void {
        // no-op
    }
}

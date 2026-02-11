import type { StateMachineConfig } from './interfaces.js';
import { BaseState } from './State.js';
import { StateMachine } from './StateMachine.js';

/**
 * A composite state that contains a nested StateMachine.
 * When this state is entered, the nested machine starts.
 * When this state is exited, the nested machine stops.
 * On update, the nested machine is updated.
 */
export abstract class HierarchicalState<
    TContext,
    TStateId extends string,
    TChildStateId extends string,
> extends BaseState<TContext, TStateId> {
    protected childMachine: StateMachine<TContext, TChildStateId> | null = null;

    protected abstract createChildConfig(
        ctx: TContext
    ): StateMachineConfig<TContext, TChildStateId>;

    override onEnter(ctx: TContext, _prevState: TStateId | null): void {
        const config = this.createChildConfig(ctx);
        this.childMachine = new StateMachine(config);
        this.childMachine.start();
    }

    override onUpdate(_ctx: TContext, _dt: number): TStateId | undefined {
        // Child machine update must be called separately by the consumer
        // or override this method to call this.childMachine.update(dt).
        return undefined;
    }

    override onExit(_ctx: TContext, _nextState: TStateId | null): void {
        this.childMachine?.stop();
        this.childMachine = null;
    }
}

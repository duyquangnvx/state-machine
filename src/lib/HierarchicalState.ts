import { BaseState } from "./State.js";
import { StateMachine } from "./StateMachine.js";
import type { StateMachineConfig } from "./interfaces.js";

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
    ctx: TContext,
  ): StateMachineConfig<TContext, TChildStateId>;

  override async onEnter(ctx: TContext): Promise<void> {
    const config = this.createChildConfig(ctx);
    this.childMachine = new StateMachine(config);
    await this.childMachine.start();
  }

  override onUpdate(_ctx: TContext, _dt: number): TStateId | undefined {
    // Child machine update must be called separately by the consumer
    // since onUpdate is sync. Use the childMachine property directly
    // or override this method to schedule the update.
    return undefined;
  }

  override async onExit(_ctx: TContext): Promise<void> {
    await this.childMachine?.stop();
    this.childMachine = null;
  }
}

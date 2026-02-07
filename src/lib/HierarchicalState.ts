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

  override onEnter(ctx: TContext): void {
    const config = this.createChildConfig(ctx);
    this.childMachine = new StateMachine(config);
    this.childMachine.start();
  }

  override onUpdate(ctx: TContext, dt: number): TStateId | undefined {
    this.childMachine?.update(dt);
    return undefined;
  }

  override onExit(ctx: TContext): void {
    this.childMachine?.stop();
    this.childMachine = null;
  }
}

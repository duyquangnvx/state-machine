import { BaseState } from "../../../lib/index.js";
import type { EnemyContext } from "../EnemyContext.js";
import type { EnemyStateId } from "../EnemyEvents.js";

export class DyingState extends BaseState<EnemyContext, EnemyStateId> {
  readonly id = "DYING" as const;

  override onEnter(ctx: EnemyContext, _prevState: EnemyStateId | null): void {
    ctx.deathTimer = 0;
  }

  override onUpdate(ctx: EnemyContext, dt: number): EnemyStateId | undefined {
    ctx.deathTimer += dt;
    if (ctx.deathTimer >= ctx.deathDuration) return "DEAD";
    return undefined;
  }
}

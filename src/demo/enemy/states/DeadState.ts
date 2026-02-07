import { BaseState } from "../../../lib/index.js";
import type { EnemyContext } from "../EnemyContext.js";
import type { EnemyStateId } from "../EnemyEvents.js";

export class DeadState extends BaseState<EnemyContext, EnemyStateId> {
  readonly id = "DEAD" as const;

  override onEnter(ctx: EnemyContext): void {
    ctx.onEnemyDeath(ctx.id);
  }
}

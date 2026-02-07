import { BaseState } from "../../../lib/index.js";
import type { TowerContext } from "../TowerContext.js";
import type { TowerStateId } from "../TowerEvents.js";

export class IdleState extends BaseState<TowerContext, TowerStateId> {
  readonly id = "IDLE" as const;

  override onUpdate(ctx: TowerContext, _dt: number): TowerStateId | undefined {
    if (ctx.hp <= 0) return "DESTROYED";
    const enemy = ctx.findNearestEnemy(ctx.position, ctx.range);
    if (enemy) return "TARGETING";
    return undefined;
  }
}

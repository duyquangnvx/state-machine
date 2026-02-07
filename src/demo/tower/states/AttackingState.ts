import { BaseState } from "../../../lib/index.js";
import type { TowerContext } from "../TowerContext.js";
import type { TowerStateId } from "../TowerEvents.js";

export class AttackingState extends BaseState<TowerContext, TowerStateId> {
  readonly id = "ATTACKING" as const;

  override onEnter(ctx: TowerContext, _prevState: TowerStateId | null): void {
    ctx.attackTimer = 0;
  }

  override onUpdate(ctx: TowerContext, dt: number): TowerStateId | undefined {
    if (ctx.hp <= 0) return "DESTROYED";
    ctx.attackTimer += dt;
    if (ctx.attackTimer >= ctx.attackCooldown) {
      if (ctx.targetEnemyId !== null) {
        ctx.dealDamageToEnemy(ctx.targetEnemyId, ctx.damage);
      }
      return "TARGETING";
    }
    return undefined;
  }
}

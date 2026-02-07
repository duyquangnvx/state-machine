import { BaseState } from "../../../lib/index.js";
import type { EnemyContext } from "../EnemyContext.js";
import type { EnemyStateId } from "../EnemyEvents.js";

export class EnemyAttackingState extends BaseState<EnemyContext, EnemyStateId> {
  readonly id = "ATTACKING" as const;

  override onEnter(ctx: EnemyContext, _prevState: EnemyStateId | null): void {
    ctx.attackTimer = 0;
  }

  override onUpdate(ctx: EnemyContext, dt: number): EnemyStateId | undefined {
    if (ctx.hp <= 0) return "DYING";

    ctx.attackTimer += dt;
    if (ctx.attackTimer >= ctx.attackCooldown) {
      ctx.dealDamageToBase(ctx.damage);
      ctx.attackTimer = 0;
    }
    return undefined;
  }
}

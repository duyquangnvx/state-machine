import { BaseState } from "../../../lib/index.js";
import type { TowerContext } from "../TowerContext.js";
import type { TowerStateId } from "../TowerEvents.js";

export class UpgradingState extends BaseState<TowerContext, TowerStateId> {
  readonly id = "UPGRADING" as const;

  override onEnter(ctx: TowerContext, _prevState: TowerStateId | null): void {
    ctx.upgradeTimer = 0;
  }

  override onUpdate(ctx: TowerContext, dt: number): TowerStateId | undefined {
    ctx.upgradeTimer += dt;
    if (ctx.upgradeTimer >= ctx.upgradeDuration) {
      ctx.level += 1;
      ctx.damage = Math.floor(ctx.damage * 1.5);
      ctx.range += 0.5;
      return "IDLE";
    }
    return undefined;
  }
}

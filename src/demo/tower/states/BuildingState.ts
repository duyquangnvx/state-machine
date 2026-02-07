import { BaseState } from "../../../lib/index.js";
import type { TowerContext } from "../TowerContext.js";
import type { TowerStateId } from "../TowerEvents.js";

export class BuildingState extends BaseState<TowerContext, TowerStateId> {
  readonly id = "BUILDING" as const;

  override onEnter(ctx: TowerContext, _prevState: TowerStateId | null): void {
    ctx.buildTimer = 0;
  }

  override onUpdate(ctx: TowerContext, dt: number): TowerStateId | undefined {
    ctx.buildTimer += dt;
    if (ctx.buildTimer >= ctx.buildDuration) return "IDLE";
    return undefined;
  }
}

import { BaseState } from "../../../lib/index.js";
import type { TowerContext } from "../TowerContext.js";
import type { TowerStateId } from "../TowerEvents.js";

export class DestroyedState extends BaseState<TowerContext, TowerStateId> {
  readonly id = "DESTROYED" as const;

  override onEnter(ctx: TowerContext): void {
    ctx.targetEnemyId = null;
    ctx.hp = 0;
  }
}

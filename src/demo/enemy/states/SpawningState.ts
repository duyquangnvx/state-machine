import { BaseState } from "../../../lib/index.js";
import type { EnemyContext } from "../EnemyContext.js";
import type { EnemyStateId } from "../EnemyEvents.js";

export class SpawningState extends BaseState<EnemyContext, EnemyStateId> {
  readonly id = "SPAWNING" as const;

  override onEnter(ctx: EnemyContext, _prevState: EnemyStateId | null): void {
    ctx.spawnTimer = 0;
  }

  override onUpdate(ctx: EnemyContext, dt: number): EnemyStateId | undefined {
    ctx.spawnTimer += dt;
    if (ctx.spawnTimer >= ctx.spawnDuration) return "MOVING";
    return undefined;
  }
}

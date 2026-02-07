import { BaseState } from "../../../lib/index.js";
import type { WaveContext } from "../WaveContext.js";
import type { WaveStateId } from "../WaveEvents.js";

export class WaveActiveState extends BaseState<WaveContext, WaveStateId> {
  readonly id = "WAVE_ACTIVE" as const;

  override onEnter(ctx: WaveContext): void {
    ctx.currentWave += 1;
    const count = ctx.enemiesPerWave + (ctx.currentWave - 1) * 2;
    ctx.enemiesRemaining = count;
    ctx.spawnWaveEnemies(ctx.currentWave, count);
  }

  override onUpdate(ctx: WaveContext, _dt: number): WaveStateId | undefined {
    if (ctx.baseHp <= 0) return "GAME_OVER";
    if (ctx.enemiesRemaining <= 0) return "WAVE_COMPLETE";
    return undefined;
  }
}

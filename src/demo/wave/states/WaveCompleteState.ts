import { BaseState } from "../../../lib/index.js";
import type { WaveContext } from "../WaveContext.js";
import type { WaveStateId } from "../WaveEvents.js";

export class WaveCompleteState extends BaseState<WaveContext, WaveStateId> {
  readonly id = "WAVE_COMPLETE" as const;

  override onEnter(ctx: WaveContext, _prevState: WaveStateId | null): void {
    ctx.score += ctx.currentWave * 50;
  }

  override onUpdate(ctx: WaveContext, _dt: number): WaveStateId | undefined {
    if (ctx.currentWave >= ctx.totalWaves) return "GAME_OVER";
    return "PREPARING";
  }
}

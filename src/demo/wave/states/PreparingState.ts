import { BaseState } from "../../../lib/index.js";
import type { WaveContext } from "../WaveContext.js";
import type { WaveStateId } from "../WaveEvents.js";

export class PreparingState extends BaseState<WaveContext, WaveStateId> {
  readonly id = "PREPARING" as const;

  override onEnter(ctx: WaveContext, _prevState: WaveStateId | null): void {
    ctx.prepTimer = 0;
  }

  override onUpdate(ctx: WaveContext, dt: number): WaveStateId | undefined {
    if (ctx.baseHp <= 0) return "GAME_OVER";
    ctx.prepTimer += dt;
    if (ctx.prepTimer >= ctx.prepDuration) return "WAVE_ACTIVE";
    return undefined;
  }
}

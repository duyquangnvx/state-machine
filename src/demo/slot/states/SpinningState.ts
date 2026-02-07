import { BaseState } from "../../../lib/index.js";
import type { SlotContext } from "../SlotContext.js";
import type { SlotStateId } from "../SlotStateId.js";

export class SpinningState extends BaseState<SlotContext, SlotStateId> {
  readonly id = "SPINNING" as const;

  override async onEnter(ctx: SlotContext, _prevState: SlotStateId | null): Promise<void> {
    ctx.reels = [null, null, null];
    ctx.spinTimer = 0;
    ctx.stopIndex = 0;
    ctx.winAmount = 0;
    ctx.winMultiplier = 0;
    ctx.lastResult = "";
    ctx.spinsRemaining -= 1;

    // Async mock API: deduct bet
    await ctx.deductBet(ctx.betAmount);
  }

  override onUpdate(ctx: SlotContext, dt: number): SlotStateId | undefined {
    ctx.spinTimer += dt;
    if (ctx.spinTimer >= ctx.spinDuration) {
      return "STOPPING";
    }
    return undefined;
  }
}

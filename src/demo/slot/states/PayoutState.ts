import { BaseState } from "../../../lib/index.js";
import type { SlotContext } from "../SlotContext.js";
import type { SlotStateId } from "../SlotStateId.js";

export class PayoutState extends BaseState<SlotContext, SlotStateId> {
  readonly id = "PAYOUT" as const;

  override async onEnter(ctx: SlotContext, _prevState: SlotStateId | null): Promise<void> {
    // Async mock API: credit winnings
    await ctx.creditWinnings(ctx.winAmount);
  }

  override onUpdate(_ctx: SlotContext, _dt: number): SlotStateId | undefined {
    return "IDLE";
  }
}

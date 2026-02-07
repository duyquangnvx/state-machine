import { BaseState } from "../../../lib/index.js";
import type { SlotContext } from "../SlotContext.js";
import type { SlotStateId } from "../SlotStateId.js";

export class IdleState extends BaseState<SlotContext, SlotStateId> {
  readonly id = "IDLE" as const;

  override onUpdate(ctx: SlotContext, _dt: number): SlotStateId | undefined {
    if (ctx.spinsRemaining > 0 && ctx.balance >= ctx.betAmount) {
      return "DEDUCTING_BET";
    }
    return undefined;
  }
}

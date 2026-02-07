import { BaseState } from "../../../lib/index.js";
import type { SlotContext } from "../SlotContext.js";
import type { SlotStateId } from "../SlotStateId.js";

export class StoppingState extends BaseState<SlotContext, SlotStateId> {
  readonly id = "STOPPING" as const;

  override onEnter(ctx: SlotContext, _prevState: SlotStateId | null): void {
    ctx.stopTimer = 0;
    ctx.stopIndex = 0;
  }

  override onUpdate(ctx: SlotContext, dt: number): SlotStateId | undefined {
    ctx.stopTimer += dt;

    if (ctx.stopTimer >= ctx.stopInterval && ctx.stopIndex < ctx.reels.length) {
      const symbol =
        ctx.symbols[Math.floor(Math.random() * ctx.symbols.length)]!;
      ctx.reels[ctx.stopIndex] = symbol;
      ctx.stopIndex += 1;
      ctx.stopTimer = 0;
    }

    if (ctx.stopIndex >= ctx.reels.length) {
      return "EVALUATING";
    }
    return undefined;
  }
}

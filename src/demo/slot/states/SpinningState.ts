import { BaseState } from "../../../lib/index.js";
import type { SlotContext } from "../SlotContext.js";
import type { SlotStateId } from "../SlotStateId.js";

export class SpinningState extends BaseState<SlotContext, SlotStateId> {
  readonly id = "SPINNING" as const;

  override onEnter(ctx: SlotContext, _prevState: SlotStateId | null): void {
    ctx.spinTimer = 0;
  }

  override onUpdate(ctx: SlotContext, dt: number): SlotStateId | undefined {
    ctx.spinTimer += dt;
    if (ctx.spinTimer >= ctx.spinDuration) {
      return "STOPPING";
    }
    return undefined;
  }
}

import { BaseState } from '../../../lib/index.js';
import type { SlotContext } from '../SlotContext.js';
import type { SlotStateId } from '../SlotStateId.js';

export class CreditingWinState extends BaseState<SlotContext, SlotStateId> {
    readonly id = 'CREDITING_WIN' as const;

    override onEnter(ctx: SlotContext, _prevState: SlotStateId | null): void {
        ctx.creditPending = true;
        ctx.creditWinnings(ctx.winAmount).then(() => {
            ctx.creditPending = false;
        });
    }

    override onUpdate(ctx: SlotContext, _dt: number): SlotStateId | undefined {
        if (!ctx.creditPending) {
            return 'IDLE';
        }
        return undefined;
    }
}

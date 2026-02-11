import { BaseState } from '../../../lib/index.js';
import type { SlotContext } from '../SlotContext.js';
import type { SlotStateId } from '../SlotStateId.js';

export class DeductingBetState extends BaseState<SlotContext, SlotStateId> {
    readonly id = 'DEDUCTING_BET' as const;

    override onEnter(ctx: SlotContext, _prevState: SlotStateId | null): void {
        ctx.reels = [null, null, null];
        ctx.spinTimer = 0;
        ctx.stopIndex = 0;
        ctx.winAmount = 0;
        ctx.winMultiplier = 0;
        ctx.lastResult = '';
        ctx.spinsRemaining -= 1;

        ctx.betPending = true;
        ctx.deductBet(ctx.betAmount).then(() => {
            ctx.betPending = false;
        });
    }

    override onUpdate(ctx: SlotContext, _dt: number): SlotStateId | undefined {
        if (!ctx.betPending) {
            return 'SPINNING';
        }
        return undefined;
    }
}

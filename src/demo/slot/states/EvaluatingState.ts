import { BaseState } from '../../../lib/index.js';
import type { SlotContext } from '../SlotContext.js';
import type { SlotStateId } from '../SlotStateId.js';

export class EvaluatingState extends BaseState<SlotContext, SlotStateId> {
    readonly id = 'EVALUATING' as const;

    override onUpdate(ctx: SlotContext, _dt: number): SlotStateId | undefined {
        const [a, b, c] = ctx.reels;

        if (a === b && b === c) {
            // 3 matching
            ctx.winMultiplier = 10;
            ctx.winAmount = ctx.betAmount * ctx.winMultiplier;
            ctx.lastResult = `3 matching -- Win $${ctx.winAmount}!`;
            return 'PAYOUT';
        } else if (a === b || b === c || a === c) {
            // 2 matching
            ctx.winMultiplier = 3;
            ctx.winAmount = ctx.betAmount * ctx.winMultiplier;
            ctx.lastResult = `2 matching -- Win $${ctx.winAmount}!`;
            return 'PAYOUT';
        } else {
            // No match
            ctx.winMultiplier = 0;
            ctx.winAmount = 0;
            ctx.lastResult = 'No match -- Loss';
            return 'IDLE';
        }
    }
}

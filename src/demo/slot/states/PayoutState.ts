import { BaseState } from '../../../lib/index.js';
import type { SlotContext } from '../SlotContext.js';
import type { SlotStateId } from '../SlotStateId.js';

export class PayoutState extends BaseState<SlotContext, SlotStateId> {
    readonly id = 'PAYOUT' as const;

    override onUpdate(_ctx: SlotContext, _dt: number): SlotStateId | undefined {
        return 'CREDITING_WIN';
    }
}

import { StateMachine } from '../../lib/index.js';
import type { SlotContext } from './SlotContext.js';
import type { SlotStateId } from './SlotStateId.js';
import { CreditingWinState } from './states/CreditingWinState.js';
import { DeductingBetState } from './states/DeductingBetState.js';
import { EvaluatingState } from './states/EvaluatingState.js';
import { IdleState } from './states/IdleState.js';
import { PayoutState } from './states/PayoutState.js';
import { SpinningState } from './states/SpinningState.js';
import { StoppingState } from './states/StoppingState.js';

export function createSlotFSM(ctx: SlotContext): StateMachine<SlotContext, SlotStateId> {
    return new StateMachine({
        context: ctx,
        initialState: 'IDLE',
        states: [
            new IdleState(),
            new DeductingBetState(),
            new SpinningState(),
            new StoppingState(),
            new EvaluatingState(),
            new PayoutState(),
            new CreditingWinState(),
        ],
    });
}

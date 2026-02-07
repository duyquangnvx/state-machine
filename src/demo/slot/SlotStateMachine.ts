import { StateMachine } from "../../lib/index.js";
import type { SlotContext } from "./SlotContext.js";
import type { SlotStateId } from "./SlotStateId.js";
import { IdleState } from "./states/IdleState.js";
import { SpinningState } from "./states/SpinningState.js";
import { StoppingState } from "./states/StoppingState.js";
import { EvaluatingState } from "./states/EvaluatingState.js";
import { PayoutState } from "./states/PayoutState.js";

export function createSlotFSM(
  ctx: SlotContext,
): StateMachine<SlotContext, SlotStateId> {
  return new StateMachine({
    context: ctx,
    initialState: "IDLE",
    states: [
      new IdleState(),
      new SpinningState(),
      new StoppingState(),
      new EvaluatingState(),
      new PayoutState(),
    ],
  });
}

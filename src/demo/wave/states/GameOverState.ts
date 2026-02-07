import { BaseState } from "../../../lib/index.js";
import type { WaveContext } from "../WaveContext.js";
import type { WaveStateId } from "../WaveEvents.js";

export class GameOverState extends BaseState<WaveContext, WaveStateId> {
  readonly id = "GAME_OVER" as const;
}

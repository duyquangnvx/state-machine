import { StateMachine } from "../../lib/index.js";
import type { EnemyContext } from "./EnemyContext.js";
import type { EnemyStateId } from "./EnemyEvents.js";
import { SpawningState } from "./states/SpawningState.js";
import { MovingState } from "./states/MovingState.js";
import { SlowedState } from "./states/SlowedState.js";
import { EnemyAttackingState } from "./states/AttackingState.js";
import { DyingState } from "./states/DyingState.js";
import { DeadState } from "./states/DeadState.js";

export function createEnemyFSM(
  ctx: EnemyContext,
): StateMachine<EnemyContext, EnemyStateId> {
  return new StateMachine({
    context: ctx,
    initialState: "SPAWNING",
    states: [
      new SpawningState(),
      new MovingState(),
      new SlowedState(),
      new EnemyAttackingState(),
      new DyingState(),
      new DeadState(),
    ],
  });
}

import { StateMachine } from '../../lib/index.js';
import { AttackingState } from './states/AttackingState.js';
import { BuildingState } from './states/BuildingState.js';
import { DestroyedState } from './states/DestroyedState.js';
import { IdleState } from './states/IdleState.js';
import { TargetingState } from './states/TargetingState.js';
import { UpgradingState } from './states/UpgradingState.js';
import type { TowerContext } from './TowerContext.js';
import type { TowerStateId } from './TowerEvents.js';

export function createTowerFSM(ctx: TowerContext): StateMachine<TowerContext, TowerStateId> {
    return new StateMachine({
        context: ctx,
        initialState: 'BUILDING',
        states: [
            new BuildingState(),
            new IdleState(),
            new TargetingState(),
            new AttackingState(),
            new UpgradingState(),
            new DestroyedState(),
        ],
    });
}

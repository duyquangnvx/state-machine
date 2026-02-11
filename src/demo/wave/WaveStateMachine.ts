import { StateMachine } from '../../lib/index.js';
import { GameOverState } from './states/GameOverState.js';
import { PreparingState } from './states/PreparingState.js';
import { WaveActiveState } from './states/WaveActiveState.js';
import { WaveCompleteState } from './states/WaveCompleteState.js';
import type { WaveContext } from './WaveContext.js';
import type { WaveStateId } from './WaveEvents.js';

export function createWaveFSM(ctx: WaveContext): StateMachine<WaveContext, WaveStateId> {
    return new StateMachine({
        context: ctx,
        initialState: 'PREPARING',
        states: [
            new PreparingState(),
            new WaveActiveState(),
            new WaveCompleteState(),
            new GameOverState(),
        ],
    });
}

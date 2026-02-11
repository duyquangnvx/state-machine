import { BaseState } from '../../../lib/index.js';
import type { TowerContext } from '../TowerContext.js';
import type { TowerStateId } from '../TowerEvents.js';

export class TargetingState extends BaseState<TowerContext, TowerStateId> {
    readonly id = 'TARGETING' as const;

    override onEnter(ctx: TowerContext, _prevState: TowerStateId | null): void {
        ctx.targetEnemyId = null;
    }

    override onUpdate(ctx: TowerContext, _dt: number): TowerStateId | undefined {
        if (ctx.hp <= 0) return 'DESTROYED';
        const enemy = ctx.findNearestEnemy(ctx.position, ctx.range);
        if (!enemy) return 'IDLE';
        ctx.targetEnemyId = enemy.id;
        return 'ATTACKING';
    }
}

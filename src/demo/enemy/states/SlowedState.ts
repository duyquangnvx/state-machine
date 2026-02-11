import { BaseState } from '../../../lib/index.js';
import { distance } from '../../types.js';
import type { EnemyContext } from '../EnemyContext.js';
import type { EnemyStateId } from '../EnemyEvents.js';

export class SlowedState extends BaseState<EnemyContext, EnemyStateId> {
    readonly id = 'SLOWED' as const;

    override onEnter(ctx: EnemyContext, _prevState: EnemyStateId | null): void {
        ctx.slowTimer = 0;
        ctx.speed = ctx.baseSpeed * 0.5;
    }

    override onUpdate(ctx: EnemyContext, dt: number): EnemyStateId | undefined {
        if (ctx.hp <= 0) return 'DYING';

        ctx.slowTimer += dt;
        if (ctx.slowTimer >= ctx.slowDuration) return 'MOVING';

        const target = ctx.path[ctx.pathIndex];
        if (!target) return 'ATTACKING';

        const dist = distance(ctx.position, target);
        const step = ctx.speed * dt;

        if (step >= dist) {
            ctx.position = { ...target };
            ctx.pathIndex += 1;
            if (ctx.pathIndex >= ctx.path.length) return 'ATTACKING';
        } else {
            const dx = target.x - ctx.position.x;
            const dy = target.y - ctx.position.y;
            ctx.position.x += (dx / dist) * step;
            ctx.position.y += (dy / dist) * step;
        }

        return undefined;
    }

    override onExit(ctx: EnemyContext, _nextState: EnemyStateId | null): void {
        ctx.speed = ctx.baseSpeed;
    }
}

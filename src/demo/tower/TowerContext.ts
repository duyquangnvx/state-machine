import type { Position } from '../types.js';

export interface EnemyRef {
    id: number;
    position: Position;
    hp: number;
}

export interface TowerContext {
    // Identity
    id: number;
    position: Position;

    // Stats
    hp: number;
    maxHp: number;
    damage: number;
    range: number;
    attackCooldown: number;
    level: number;

    // Timers
    buildTimer: number;
    buildDuration: number;
    attackTimer: number;
    upgradeTimer: number;
    upgradeDuration: number;

    // Targeting
    targetEnemyId: number | null;

    // Injected callbacks
    findNearestEnemy: (pos: Position, range: number) => EnemyRef | null;
    dealDamageToEnemy: (enemyId: number, damage: number) => void;
}

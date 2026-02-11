import type { Position } from '../types.js';

export interface EnemyContext {
    // Identity
    id: number;
    position: Position;

    // Stats
    hp: number;
    maxHp: number;
    speed: number;
    baseSpeed: number;
    damage: number;

    // Path
    path: Position[];
    pathIndex: number;

    // Timers
    spawnTimer: number;
    spawnDuration: number;
    attackTimer: number;
    attackCooldown: number;
    slowTimer: number;
    slowDuration: number;
    deathTimer: number;
    deathDuration: number;

    // Injected callbacks
    dealDamageToBase: (damage: number) => void;
    onEnemyDeath: (enemyId: number) => void;
}

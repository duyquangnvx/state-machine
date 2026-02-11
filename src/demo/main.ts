import type { StateMachine } from '../lib/index.js';
import type { EnemyContext } from './enemy/EnemyContext.js';
import type { EnemyStateId } from './enemy/EnemyEvents.js';
import { createEnemyFSM } from './enemy/EnemyStateMachine.js';
import { GameLoop } from './GameLoop.js';
import type { EnemyRef, TowerContext } from './tower/TowerContext.js';
import type { TowerStateId } from './tower/TowerEvents.js';
import { createTowerFSM } from './tower/TowerStateMachine.js';
import type { Position } from './types.js';
import { distance } from './types.js';

import type { WaveContext } from './wave/WaveContext.js';
import type { WaveStateId } from './wave/WaveEvents.js';
import { createWaveFSM } from './wave/WaveStateMachine.js';

// ─── Game State ───────────────────────────────────────

interface TowerInstance {
    ctx: TowerContext;
    fsm: StateMachine<TowerContext, TowerStateId>;
}

interface EnemyInstance {
    ctx: EnemyContext;
    fsm: StateMachine<EnemyContext, EnemyStateId>;
}

const towers: TowerInstance[] = [];
const enemies: EnemyInstance[] = [];
let nextEnemyId = 0;

// ─── Enemy Path ───────────────────────────────────────

const ENEMY_PATH: Position[] = [
    { x: 0, y: 5 },
    { x: 3, y: 5 },
    { x: 5, y: 5 },
    { x: 8, y: 5 },
    { x: 10, y: 5 },
];

// ─── Callbacks (injected into contexts) ───────────────

function findNearestEnemy(pos: Position, range: number): EnemyRef | null {
    let best: EnemyRef | null = null;
    let bestDist = Infinity;

    for (const e of enemies) {
        if (!e.fsm.isStarted) continue;
        const sid = e.fsm.currentStateId;
        if (sid === 'DEAD' || sid === 'DYING' || sid === 'SPAWNING') continue;

        const d = distance(pos, e.ctx.position);
        if (d <= range && d < bestDist) {
            bestDist = d;
            best = { id: e.ctx.id, position: { ...e.ctx.position }, hp: e.ctx.hp };
        }
    }
    return best;
}

function dealDamageToEnemy(enemyId: number, damage: number): void {
    const e = enemies.find((e) => e.ctx.id === enemyId);
    if (!e) return;
    e.ctx.hp -= damage;
}

function dealDamageToBase(damage: number): void {
    waveCtx.baseHp -= damage;
}

function onEnemyDeath(_enemyId: number): void {
    waveCtx.enemiesRemaining -= 1;
    waveCtx.score += 10;
}

function spawnWaveEnemies(wave: number, count: number): void {
    for (let i = 0; i < count; i++) {
        const id = nextEnemyId++;
        const ctx: EnemyContext = {
            id,
            position: { x: -1 - i * 0.5, y: 5 },
            hp: 80 + wave * 20,
            maxHp: 80 + wave * 20,
            speed: 1,
            baseSpeed: 1,
            damage: 5 + wave * 2,
            path: ENEMY_PATH.map((p) => ({ ...p })),
            pathIndex: 0,
            spawnTimer: 0,
            spawnDuration: 0.3 + i * 0.2,
            attackTimer: 0,
            attackCooldown: 1.0,
            slowTimer: 0,
            slowDuration: 2.0,
            deathTimer: 0,
            deathDuration: 0.5,
            dealDamageToBase,
            onEnemyDeath,
        };
        const fsm = createEnemyFSM(ctx);
        fsm.start();
        enemies.push({ ctx, fsm });
    }
}

// ─── Create Towers ────────────────────────────────────

function createTower(id: number, pos: Position): TowerInstance {
    const ctx: TowerContext = {
        id,
        position: pos,
        hp: 200,
        maxHp: 200,
        damage: 25,
        range: 3,
        attackCooldown: 0.5,
        level: 1,
        buildTimer: 0,
        buildDuration: 1.0,
        attackTimer: 0,
        upgradeTimer: 0,
        upgradeDuration: 3.0,
        targetEnemyId: null,
        findNearestEnemy,
        dealDamageToEnemy,
    };
    const fsm = createTowerFSM(ctx);
    fsm.start();
    return { ctx, fsm };
}

// ─── Create Wave FSM ─────────────────────────────────

const waveCtx: WaveContext = {
    currentWave: 0,
    totalWaves: 5,
    enemiesRemaining: 0,
    enemiesPerWave: 3,
    baseHp: 100,
    score: 0,
    prepTimer: 0,
    prepDuration: 1.0,
    spawnWaveEnemies,
};

// ─── Render ───────────────────────────────────────────

function render(tick: number, waveFSM: StateMachine<WaveContext, WaveStateId>): void {
    const waveState = waveFSM.currentStateId;
    console.log(
        `\n=== Tick ${tick} | Wave ${waveCtx.currentWave}/${waveCtx.totalWaves} | Score: ${waveCtx.score} | Base HP: ${waveCtx.baseHp} ===`
    );
    console.log(`Wave: ${waveState} (${waveCtx.enemiesRemaining} enemies remaining)`);

    for (const t of towers) {
        const state = t.fsm.isStarted ? t.fsm.currentStateId : 'STOPPED';
        const target = t.ctx.targetEnemyId !== null ? ` -> enemy_${t.ctx.targetEnemyId}` : '';
        console.log(
            `  Tower[${t.ctx.id}] @ (${t.ctx.position.x},${t.ctx.position.y}): ${state}${target}`
        );
    }

    const alive = enemies.filter((e) => e.fsm.isStarted && e.fsm.currentStateId !== 'DEAD');
    for (const e of alive) {
        const state = e.fsm.currentStateId;
        console.log(
            `  Enemy[${e.ctx.id}] @ (${e.ctx.position.x.toFixed(1)},${e.ctx.position.y.toFixed(1)}): ${state} (HP: ${e.ctx.hp}/${e.ctx.maxHp})`
        );
    }
}

// ─── Boot & Game Loop ─────────────────────────────────

const MAX_TICKS = 200;

function main(): void {
    towers.push(createTower(0, { x: 3, y: 3 }));
    towers.push(createTower(1, { x: 5, y: 3 }));
    towers.push(createTower(2, { x: 8, y: 3 }));

    const waveFSM = createWaveFSM(waveCtx);
    waveFSM.start();

    const loop = new GameLoop((dt, tick) => {
        waveFSM.update(dt);

        for (const t of towers) {
            if (t.fsm.isStarted) t.fsm.update(dt);
        }

        for (const e of enemies) {
            if (e.fsm.isStarted && e.fsm.currentStateId !== 'DEAD') {
                e.fsm.update(dt);
            }
        }

        if (tick % 5 === 0 || waveFSM.currentStateId === 'GAME_OVER') {
            render(tick, waveFSM);
        }

        if (waveFSM.currentStateId === 'GAME_OVER' || tick >= MAX_TICKS) {
            const won = waveCtx.baseHp > 0 && waveCtx.currentWave >= waveCtx.totalWaves;
            console.log(
                won
                    ? `\n*** VICTORY! Final Score: ${waveCtx.score} ***`
                    : `\n*** GAME OVER — Score: ${waveCtx.score} ***`
            );
            loop.stop();
        }
    }, 10);

    loop.start();
}

main();

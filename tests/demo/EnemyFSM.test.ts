import { createEnemyFSM } from "../../src/demo/enemy/EnemyStateMachine.js";
import type { EnemyContext } from "../../src/demo/enemy/EnemyContext.js";

function createEnemyCtx(overrides?: Partial<EnemyContext>): EnemyContext {
  return {
    id: 0,
    position: { x: 0, y: 0 },
    hp: 100,
    maxHp: 100,
    speed: 2,
    baseSpeed: 2,
    damage: 10,
    path: [
      { x: 5, y: 0 },
      { x: 10, y: 0 },
    ],
    pathIndex: 0,
    spawnTimer: 0,
    spawnDuration: 0.5,
    attackTimer: 0,
    attackCooldown: 1.0,
    slowTimer: 0,
    slowDuration: 2.0,
    deathTimer: 0,
    deathDuration: 0.5,
    dealDamageToBase: () => {},
    onEnemyDeath: () => {},
    ...overrides,
  };
}

describe("EnemyFSM", () => {
  it("starts in SPAWNING and moves to MOVING after spawn duration", async () => {
    const ctx = createEnemyCtx();
    const fsm = createEnemyFSM(ctx);
    await fsm.start();
    expect(fsm.currentStateId).toBe("SPAWNING");

    for (let i = 0; i < 6; i++) await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("MOVING");
  });

  it("moves along path toward waypoints", async () => {
    const ctx = createEnemyCtx({ spawnDuration: 0 });
    const fsm = createEnemyFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // spawn completes

    const startX = ctx.position.x;
    await fsm.update(0.5);
    expect(ctx.position.x).toBeGreaterThan(startX);
  });

  it("transitions to ATTACKING when reaching end of path", async () => {
    const ctx = createEnemyCtx({
      spawnDuration: 0,
      speed: 100,
      baseSpeed: 100,
      path: [{ x: 1, y: 0 }],
    });
    const fsm = createEnemyFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // spawn
    await fsm.update(0.1); // reach end
    expect(fsm.currentStateId).toBe("ATTACKING");
  });

  it("deals damage to base while ATTACKING", async () => {
    const damages: number[] = [];
    const ctx = createEnemyCtx({
      spawnDuration: 0,
      speed: 100,
      baseSpeed: 100,
      attackCooldown: 0.2,
      path: [{ x: 1, y: 0 }],
      dealDamageToBase: (d) => damages.push(d),
    });
    const fsm = createEnemyFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // spawn
    await fsm.update(0.1); // reach end -> ATTACKING

    for (let i = 0; i < 3; i++) await fsm.update(0.1);
    expect(damages.length).toBeGreaterThanOrEqual(1);
    expect(damages[0]).toBe(10);
  });

  it("transitions MOVING -> SLOWED -> MOVING via transitionTo", async () => {
    const ctx = createEnemyCtx({ spawnDuration: 0 });
    const fsm = createEnemyFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // spawn completes

    await fsm.transitionTo("SLOWED");
    expect(fsm.currentStateId).toBe("SLOWED");
    expect(ctx.speed).toBe(ctx.baseSpeed * 0.5);

    for (let i = 0; i < 25; i++) await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("MOVING");
    expect(ctx.speed).toBe(ctx.baseSpeed);
  });

  it("dies on fatal damage while MOVING", async () => {
    const deaths: number[] = [];
    const ctx = createEnemyCtx({
      spawnDuration: 0,
      deathDuration: 0.2,
      onEnemyDeath: (id) => deaths.push(id),
    });
    const fsm = createEnemyFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // spawn completes

    ctx.hp = -10;
    await fsm.update(0.1); // MOVING checks hp -> DYING
    expect(fsm.currentStateId).toBe("DYING");

    for (let i = 0; i < 3; i++) await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("DEAD");
    expect(deaths).toEqual([0]);
  });

  it("dies on fatal damage while SLOWED", async () => {
    const ctx = createEnemyCtx({ spawnDuration: 0, deathDuration: 0.1 });
    const fsm = createEnemyFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // spawn
    await fsm.transitionTo("SLOWED");

    ctx.hp = -5;
    await fsm.update(0.1); // SLOWED checks hp -> DYING
    expect(fsm.currentStateId).toBe("DYING");

    await fsm.update(0.2);
    expect(fsm.currentStateId).toBe("DEAD");
  });
});

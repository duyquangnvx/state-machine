import { createTowerFSM } from "../../src/demo/tower/TowerStateMachine.js";
import type { TowerContext } from "../../src/demo/tower/TowerContext.js";

function createTowerCtx(overrides?: Partial<TowerContext>): TowerContext {
  return {
    id: 0,
    position: { x: 5, y: 5 },
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
    upgradeDuration: 2.0,
    targetEnemyId: null,
    findNearestEnemy: () => null,
    dealDamageToEnemy: () => {},
    ...overrides,
  };
}

describe("TowerFSM", () => {
  it("starts in BUILDING and transitions to IDLE after build completes", () => {
    const ctx = createTowerCtx();
    const fsm = createTowerFSM(ctx);
    fsm.start();
    expect(fsm.currentStateId).toBe("BUILDING");

    for (let i = 0; i < 11; i++) fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("transitions IDLE -> TARGETING -> ATTACKING when enemy in range", () => {
    const ctx = createTowerCtx({
      buildDuration: 0,
      findNearestEnemy: () => ({
        id: 42,
        position: { x: 5, y: 6 },
        hp: 100,
      }),
    });
    const fsm = createTowerFSM(ctx);
    fsm.start();
    fsm.update(0.1); // build completes -> IDLE

    fsm.update(0.1); // IDLE finds enemy -> TARGETING
    expect(fsm.currentStateId).toBe("TARGETING");

    fsm.update(0.1); // TARGETING acquires target -> ATTACKING
    expect(fsm.currentStateId).toBe("ATTACKING");
    expect(ctx.targetEnemyId).toBe(42);
  });

  it("returns to IDLE when no enemies in range", () => {
    let hasEnemy = true;
    const ctx = createTowerCtx({
      buildDuration: 0,
      findNearestEnemy: () =>
        hasEnemy ? { id: 1, position: { x: 5, y: 6 }, hp: 100 } : null,
    });
    const fsm = createTowerFSM(ctx);
    fsm.start();
    fsm.update(0.1); // build -> IDLE
    fsm.update(0.1); // -> TARGETING
    fsm.update(0.1); // -> ATTACKING

    hasEnemy = false;
    // Let attack complete -> TARGETING -> IDLE (no enemy)
    for (let i = 0; i < 10; i++) fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("deals damage on attack complete", () => {
    const damages: { id: number; dmg: number }[] = [];
    const ctx = createTowerCtx({
      buildDuration: 0,
      attackCooldown: 0.2,
      findNearestEnemy: () => ({
        id: 7,
        position: { x: 5, y: 6 },
        hp: 100,
      }),
      dealDamageToEnemy: (id, dmg) => damages.push({ id, dmg }),
    });
    const fsm = createTowerFSM(ctx);
    fsm.start();
    fsm.update(0.1); // build -> IDLE
    fsm.update(0.1); // -> TARGETING
    fsm.update(0.1); // -> ATTACKING

    for (let i = 0; i < 3; i++) fsm.update(0.1);
    expect(damages.length).toBeGreaterThanOrEqual(1);
    expect(damages[0]).toEqual({ id: 7, dmg: 25 });
  });

  it("transitions to UPGRADING from IDLE via transitionTo", () => {
    const ctx = createTowerCtx({ buildDuration: 0 });
    const fsm = createTowerFSM(ctx);
    fsm.start();
    fsm.update(0.1); // build -> IDLE

    fsm.transitionTo("UPGRADING");
    expect(fsm.currentStateId).toBe("UPGRADING");

    for (let i = 0; i < 25; i++) fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
    expect(ctx.level).toBe(2);
    expect(ctx.damage).toBe(37); // floor(25 * 1.5)
  });

  it("transitions to DESTROYED when hp <= 0 during IDLE update", () => {
    const ctx = createTowerCtx({ buildDuration: 0 });
    const fsm = createTowerFSM(ctx);
    fsm.start();
    fsm.update(0.1); // build -> IDLE

    ctx.hp = 0;
    fsm.update(0.1); // IDLE checks hp -> DESTROYED
    expect(fsm.currentStateId).toBe("DESTROYED");
  });

  it("stays IDLE when hp > 0", () => {
    const ctx = createTowerCtx({ buildDuration: 0 });
    const fsm = createTowerFSM(ctx);
    fsm.start();
    fsm.update(0.1); // build -> IDLE

    ctx.hp = 50;
    fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });
});

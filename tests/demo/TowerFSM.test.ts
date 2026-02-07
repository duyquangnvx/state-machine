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
  it("starts in BUILDING and transitions to IDLE after build completes", async () => {
    const ctx = createTowerCtx();
    const fsm = createTowerFSM(ctx);
    await fsm.start();
    expect(fsm.currentStateId).toBe("BUILDING");

    for (let i = 0; i < 11; i++) await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("transitions IDLE -> TARGETING -> ATTACKING when enemy in range", async () => {
    const ctx = createTowerCtx({
      buildDuration: 0,
      findNearestEnemy: () => ({
        id: 42,
        position: { x: 5, y: 6 },
        hp: 100,
      }),
    });
    const fsm = createTowerFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // build -> IDLE

    await fsm.update(0.1); // IDLE finds enemy -> TARGETING
    expect(fsm.currentStateId).toBe("TARGETING");

    await fsm.update(0.1); // TARGETING acquires -> ATTACKING
    expect(fsm.currentStateId).toBe("ATTACKING");
    expect(ctx.targetEnemyId).toBe(42);
  });

  it("returns to IDLE when no enemies in range", async () => {
    let hasEnemy = true;
    const ctx = createTowerCtx({
      buildDuration: 0,
      findNearestEnemy: () =>
        hasEnemy ? { id: 1, position: { x: 5, y: 6 }, hp: 100 } : null,
    });
    const fsm = createTowerFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // build -> IDLE
    await fsm.update(0.1); // -> TARGETING
    await fsm.update(0.1); // -> ATTACKING

    hasEnemy = false;
    for (let i = 0; i < 10; i++) await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("deals damage on attack complete", async () => {
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
    await fsm.start();
    await fsm.update(0.1); // build -> IDLE
    await fsm.update(0.1); // -> TARGETING
    await fsm.update(0.1); // -> ATTACKING

    for (let i = 0; i < 3; i++) await fsm.update(0.1);
    expect(damages.length).toBeGreaterThanOrEqual(1);
    expect(damages[0]).toEqual({ id: 7, dmg: 25 });
  });

  it("transitions to UPGRADING from IDLE via transitionTo", async () => {
    const ctx = createTowerCtx({ buildDuration: 0 });
    const fsm = createTowerFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // build -> IDLE

    await fsm.transitionTo("UPGRADING");
    expect(fsm.currentStateId).toBe("UPGRADING");

    for (let i = 0; i < 25; i++) await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
    expect(ctx.level).toBe(2);
    expect(ctx.damage).toBe(37);
  });

  it("transitions to DESTROYED when hp <= 0 during IDLE update", async () => {
    const ctx = createTowerCtx({ buildDuration: 0 });
    const fsm = createTowerFSM(ctx);
    await fsm.start();
    await fsm.update(0.1); // build -> IDLE

    ctx.hp = 0;
    await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("DESTROYED");
  });

  it("stays IDLE when hp > 0", async () => {
    const ctx = createTowerCtx({ buildDuration: 0 });
    const fsm = createTowerFSM(ctx);
    await fsm.start();
    await fsm.update(0.1);

    ctx.hp = 50;
    await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });
});

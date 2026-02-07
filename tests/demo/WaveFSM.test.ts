import { createWaveFSM } from "../../src/demo/wave/WaveStateMachine.js";
import type { WaveContext } from "../../src/demo/wave/WaveContext.js";

function createWaveCtx(overrides?: Partial<WaveContext>): WaveContext {
  return {
    currentWave: 0,
    totalWaves: 3,
    enemiesRemaining: 0,
    enemiesPerWave: 2,
    baseHp: 100,
    score: 0,
    prepTimer: 0,
    prepDuration: 1.0,
    spawnWaveEnemies: () => {},
    ...overrides,
  };
}

describe("WaveFSM", () => {
  it("starts in PREPARING", () => {
    const ctx = createWaveCtx();
    const fsm = createWaveFSM(ctx);
    fsm.start();
    expect(fsm.currentStateId).toBe("PREPARING");
  });

  it("transitions to WAVE_ACTIVE after preparation", () => {
    const ctx = createWaveCtx({ prepDuration: 0.2 });
    const fsm = createWaveFSM(ctx);
    fsm.start();

    for (let i = 0; i < 3; i++) fsm.update(0.1);
    expect(fsm.currentStateId).toBe("WAVE_ACTIVE");
    expect(ctx.currentWave).toBe(1);
  });

  it("calls spawnWaveEnemies on entering WAVE_ACTIVE", () => {
    const spawns: { wave: number; count: number }[] = [];
    const ctx = createWaveCtx({
      prepDuration: 0.1,
      spawnWaveEnemies: (w, c) => spawns.push({ wave: w, count: c }),
    });
    const fsm = createWaveFSM(ctx);
    fsm.start();
    fsm.update(0.2); // prep -> WAVE_ACTIVE

    expect(spawns).toHaveLength(1);
    expect(spawns[0]!.wave).toBe(1);
    expect(spawns[0]!.count).toBe(2);
  });

  it("transitions to WAVE_COMPLETE when all enemies dead", () => {
    const ctx = createWaveCtx({ prepDuration: 0.1 });
    const fsm = createWaveFSM(ctx);
    fsm.start();
    fsm.update(0.2); // -> WAVE_ACTIVE

    ctx.enemiesRemaining = 0;
    fsm.update(0.1);
    expect(fsm.currentStateId).toBe("WAVE_COMPLETE");
  });

  it("loops PREPARING -> WAVE_ACTIVE -> WAVE_COMPLETE -> PREPARING", () => {
    const ctx = createWaveCtx({ prepDuration: 0.1 });
    const fsm = createWaveFSM(ctx);
    fsm.start();

    fsm.update(0.2); // -> WAVE_ACTIVE
    ctx.enemiesRemaining = 0;
    fsm.update(0.1); // -> WAVE_COMPLETE
    fsm.update(0.1); // -> PREPARING

    expect(fsm.currentStateId).toBe("PREPARING");
    expect(ctx.score).toBe(50);
  });

  it("goes to GAME_OVER after all waves complete", () => {
    const ctx = createWaveCtx({ prepDuration: 0.1, totalWaves: 1 });
    const fsm = createWaveFSM(ctx);
    fsm.start();

    fsm.update(0.2); // -> WAVE_ACTIVE
    ctx.enemiesRemaining = 0;
    fsm.update(0.1); // -> WAVE_COMPLETE
    fsm.update(0.1); // -> GAME_OVER

    expect(fsm.currentStateId).toBe("GAME_OVER");
  });

  it("goes to GAME_OVER if base destroyed during WAVE_ACTIVE", () => {
    const ctx = createWaveCtx({ prepDuration: 0.1 });
    const fsm = createWaveFSM(ctx);
    fsm.start();
    fsm.update(0.2); // -> WAVE_ACTIVE

    ctx.baseHp = 0;
    fsm.update(0.1);
    expect(fsm.currentStateId).toBe("GAME_OVER");
  });

  it("goes to GAME_OVER if base destroyed during PREPARING", () => {
    const ctx = createWaveCtx({ prepDuration: 2.0 });
    const fsm = createWaveFSM(ctx);
    fsm.start();

    ctx.baseHp = 0;
    fsm.update(0.1);
    expect(fsm.currentStateId).toBe("GAME_OVER");
  });

  it("increases enemy count each wave", () => {
    const spawns: { wave: number; count: number }[] = [];
    const ctx = createWaveCtx({
      prepDuration: 0.1,
      spawnWaveEnemies: (w, c) => spawns.push({ wave: w, count: c }),
    });
    const fsm = createWaveFSM(ctx);
    fsm.start();

    // Wave 1
    fsm.update(0.2);
    ctx.enemiesRemaining = 0;
    fsm.update(0.1);
    fsm.update(0.1);

    // Wave 2
    fsm.update(0.2);
    ctx.enemiesRemaining = 0;
    fsm.update(0.1);
    fsm.update(0.1);

    expect(spawns).toHaveLength(2);
    expect(spawns[0]!.count).toBe(2);
    expect(spawns[1]!.count).toBe(4);
  });
});

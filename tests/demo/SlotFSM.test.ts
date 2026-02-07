import { createSlotFSM } from "../../src/demo/slot/SlotStateMachine.js";
import type { SlotContext } from "../../src/demo/slot/SlotContext.js";

function createSlotCtx(overrides?: Partial<SlotContext>): SlotContext {
  return {
    balance: 100,
    betAmount: 10,
    reels: [null, null, null],
    symbols: ["7", "BAR", "CHERRY", "BELL", "LEMON", "STAR"],
    spinTimer: 0,
    spinDuration: 0.3,
    stopIndex: 0,
    stopTimer: 0,
    stopInterval: 0.2,
    winAmount: 0,
    winMultiplier: 0,
    spinsRemaining: 5,
    totalSpins: 5,
    lastResult: "",
    deductBet: async () => {},
    creditWinnings: async () => {},
    ...overrides,
  };
}

describe("SlotFSM", () => {
  it("starts in IDLE", async () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    await fsm.start();
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("transitions IDLE -> SPINNING when spins remain and balance sufficient", async () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("SPINNING");
  });

  it("stays IDLE when balance is insufficient", async () => {
    const ctx = createSlotCtx({ balance: 5, betAmount: 10 });
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("stays IDLE when no spins remaining", async () => {
    const ctx = createSlotCtx({ spinsRemaining: 0 });
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    await fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("calls deductBet on entering SPINNING", async () => {
    const deductions: number[] = [];
    const ctx = createSlotCtx({
      deductBet: async (amount) => { deductions.push(amount); },
    });
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    await fsm.update(0.1); // IDLE -> SPINNING
    expect(deductions).toEqual([10]);
  });

  it("decrements spinsRemaining on entering SPINNING", async () => {
    const ctx = createSlotCtx({ spinsRemaining: 3 });
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    await fsm.update(0.1); // IDLE -> SPINNING
    expect(ctx.spinsRemaining).toBe(2);
  });

  it("resets reels to null on entering SPINNING", async () => {
    const ctx = createSlotCtx();
    ctx.reels = ["7", "BAR", "CHERRY"];
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    await fsm.update(0.1); // IDLE -> SPINNING
    expect(ctx.reels).toEqual([null, null, null]);
  });

  it("transitions SPINNING -> STOPPING after spinDuration", async () => {
    const ctx = createSlotCtx({ spinDuration: 0.2 });
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    await fsm.update(0.1); // IDLE -> SPINNING
    expect(fsm.currentStateId).toBe("SPINNING");

    await fsm.update(0.1); // spinTimer = 0.1
    expect(fsm.currentStateId).toBe("SPINNING");

    await fsm.update(0.1); // spinTimer = 0.2 -> STOPPING
    expect(fsm.currentStateId).toBe("STOPPING");
  });

  it("reveals reels one by one in STOPPING", async () => {
    const ctx = createSlotCtx({ spinDuration: 0, stopInterval: 0.1 });
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    await fsm.update(0.1); // IDLE -> SPINNING
    await fsm.update(0.1); // SPINNING -> STOPPING (spinDuration=0 met on first tick)

    // In STOPPING, first reel reveals
    await fsm.update(0.1);
    expect(ctx.reels[0]).not.toBeNull();
    expect(ctx.reels[1]).toBeNull();

    await fsm.update(0.1);
    expect(ctx.reels[1]).not.toBeNull();
    expect(ctx.reels[2]).toBeNull();

    // Third reel reveals and transition to EVALUATING
    await fsm.update(0.1);
    expect(ctx.reels[2]).not.toBeNull();
  });

  it("transitions STOPPING -> EVALUATING when all reels revealed", async () => {
    const ctx = createSlotCtx({ spinDuration: 0, stopInterval: 0.1 });
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    await fsm.update(0.1); // IDLE -> SPINNING
    await fsm.update(0.1); // SPINNING -> STOPPING
    await fsm.update(0.1); // reel 0
    await fsm.update(0.1); // reel 1
    await fsm.update(0.1); // reel 2 -> EVALUATING
    expect(fsm.currentStateId).toBe("EVALUATING");
  });

  it("evaluates 3 matching as 10x win", async () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    // Force reels to 3 matching
    ctx.reels = ["7", "7", "7"];
    await fsm.transitionTo("EVALUATING");

    await fsm.update(0.1); // EVALUATING -> PAYOUT
    expect(ctx.winMultiplier).toBe(10);
    expect(ctx.winAmount).toBe(100);
    expect(fsm.currentStateId).toBe("PAYOUT");
  });

  it("evaluates 2 matching as 3x win", async () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    ctx.reels = ["7", "7", "BAR"];
    await fsm.transitionTo("EVALUATING");

    await fsm.update(0.1);
    expect(ctx.winMultiplier).toBe(3);
    expect(ctx.winAmount).toBe(30);
    expect(fsm.currentStateId).toBe("PAYOUT");
  });

  it("evaluates 2 matching (last two) as 3x win", async () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    ctx.reels = ["BAR", "7", "7"];
    await fsm.transitionTo("EVALUATING");

    await fsm.update(0.1);
    expect(ctx.winMultiplier).toBe(3);
    expect(ctx.winAmount).toBe(30);
  });

  it("evaluates 2 matching (first and last) as 3x win", async () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    ctx.reels = ["7", "BAR", "7"];
    await fsm.transitionTo("EVALUATING");

    await fsm.update(0.1);
    expect(ctx.winMultiplier).toBe(3);
    expect(ctx.winAmount).toBe(30);
  });

  it("evaluates no match as loss", async () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    ctx.reels = ["7", "BAR", "CHERRY"];
    await fsm.transitionTo("EVALUATING");

    await fsm.update(0.1);
    expect(ctx.winMultiplier).toBe(0);
    expect(ctx.winAmount).toBe(0);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("calls creditWinnings on entering PAYOUT", async () => {
    const credits: number[] = [];
    const ctx = createSlotCtx({
      creditWinnings: async (amount) => { credits.push(amount); },
    });
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    ctx.reels = ["7", "7", "7"];
    await fsm.transitionTo("EVALUATING");

    await fsm.update(0.1); // EVALUATING -> PAYOUT
    expect(credits).toEqual([100]);
  });

  it("transitions PAYOUT -> IDLE on update", async () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    ctx.reels = ["7", "7", "7"];
    await fsm.transitionTo("EVALUATING");
    await fsm.update(0.1); // -> PAYOUT
    expect(fsm.currentStateId).toBe("PAYOUT");

    await fsm.update(0.1); // -> IDLE
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("completes a full spin cycle", async () => {
    const deductions: number[] = [];
    const ctx = createSlotCtx({
      spinDuration: 0.1,
      stopInterval: 0.1,
      deductBet: async (amount) => { deductions.push(amount); },
    });
    const fsm = createSlotFSM(ctx);
    await fsm.start();
    expect(fsm.currentStateId).toBe("IDLE");

    // Run enough updates to complete at least one full cycle
    for (let i = 0; i < 20; i++) {
      await fsm.update(0.1);
    }

    expect(deductions).toEqual(expect.arrayContaining([10]));
    // Should have passed through EVALUATING and decided win or loss
    expect(ctx.lastResult).not.toBe("");
  });

  it("records state transitions in history", async () => {
    const ctx = createSlotCtx({ spinDuration: 0, stopInterval: 0 });
    const fsm = createSlotFSM(ctx);
    await fsm.start();

    // Run several updates to drive through states
    for (let i = 0; i < 10; i++) {
      await fsm.update(0.1);
    }

    const history = fsm.getHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]!.from).toBe("IDLE");
    expect(history[0]!.to).toBe("SPINNING");
  });
});

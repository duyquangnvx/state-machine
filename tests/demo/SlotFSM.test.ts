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
    betPending: false,
    creditPending: false,
    deductBet: async () => {},
    creditWinnings: async () => {},
    ...overrides,
  };
}

describe("SlotFSM", () => {
  it("starts in IDLE", () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    fsm.start();
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("transitions IDLE -> DEDUCTING_BET when spins remain and balance sufficient", () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1);
    expect(fsm.currentStateId).toBe("DEDUCTING_BET");
  });

  it("stays IDLE when balance is insufficient", () => {
    const ctx = createSlotCtx({ balance: 5, betAmount: 10 });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("stays IDLE when no spins remaining", () => {
    const ctx = createSlotCtx({ spinsRemaining: 0 });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("calls deductBet on entering DEDUCTING_BET", () => {
    const deductions: number[] = [];
    const ctx = createSlotCtx({
      deductBet: async (amount) => { deductions.push(amount); },
    });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1); // IDLE -> DEDUCTING_BET
    expect(deductions).toEqual([10]);
  });

  it("decrements spinsRemaining on entering DEDUCTING_BET", () => {
    const ctx = createSlotCtx({ spinsRemaining: 3 });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1); // IDLE -> DEDUCTING_BET
    expect(ctx.spinsRemaining).toBe(2);
  });

  it("resets reels to null on entering DEDUCTING_BET", () => {
    const ctx = createSlotCtx();
    ctx.reels = ["7", "BAR", "CHERRY"];
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1); // IDLE -> DEDUCTING_BET
    expect(ctx.reels).toEqual([null, null, null]);
  });

  it("stays in DEDUCTING_BET while bet is pending", () => {
    const ctx = createSlotCtx({
      deductBet: async () => {
        await new Promise((r) => setTimeout(r, 1000));
      },
    });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1); // IDLE -> DEDUCTING_BET
    expect(fsm.currentStateId).toBe("DEDUCTING_BET");

    fsm.update(0.1); // still pending
    expect(fsm.currentStateId).toBe("DEDUCTING_BET");
  });

  it("transitions DEDUCTING_BET -> SPINNING when bet resolves", async () => {
    let resolve!: () => void;
    const ctx = createSlotCtx({
      deductBet: async () => {
        await new Promise<void>((r) => { resolve = r; });
      },
    });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1); // IDLE -> DEDUCTING_BET
    expect(fsm.currentStateId).toBe("DEDUCTING_BET");

    resolve();
    // flush microtasks: one for the await inside deductBet, one for the .then()
    await Promise.resolve();
    await Promise.resolve();

    fsm.update(0.1);
    expect(fsm.currentStateId).toBe("SPINNING");
  });

  it("transitions SPINNING -> STOPPING after spinDuration", async () => {
    const ctx = createSlotCtx({ spinDuration: 0.2 });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1); // IDLE -> DEDUCTING_BET
    ctx.betPending = false; // simulate instant resolve
    fsm.update(0.1); // DEDUCTING_BET -> SPINNING

    expect(fsm.currentStateId).toBe("SPINNING");

    fsm.update(0.1); // spinTimer = 0.1
    expect(fsm.currentStateId).toBe("SPINNING");

    fsm.update(0.1); // spinTimer = 0.2 -> STOPPING
    expect(fsm.currentStateId).toBe("STOPPING");
  });

  it("reveals reels one by one in STOPPING", () => {
    const ctx = createSlotCtx({ spinDuration: 0, stopInterval: 0.1 });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1); // IDLE -> DEDUCTING_BET
    ctx.betPending = false;
    fsm.update(0.1); // DEDUCTING_BET -> SPINNING
    fsm.update(0.1); // SPINNING -> STOPPING (spinDuration=0 met on first tick)

    // In STOPPING, first reel reveals
    fsm.update(0.1);
    expect(ctx.reels[0]).not.toBeNull();
    expect(ctx.reels[1]).toBeNull();

    fsm.update(0.1);
    expect(ctx.reels[1]).not.toBeNull();
    expect(ctx.reels[2]).toBeNull();

    // Third reel reveals and transition to EVALUATING
    fsm.update(0.1);
    expect(ctx.reels[2]).not.toBeNull();
  });

  it("transitions STOPPING -> EVALUATING when all reels revealed", () => {
    const ctx = createSlotCtx({ spinDuration: 0, stopInterval: 0.1 });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    fsm.update(0.1); // IDLE -> DEDUCTING_BET
    ctx.betPending = false;
    fsm.update(0.1); // DEDUCTING_BET -> SPINNING
    fsm.update(0.1); // SPINNING -> STOPPING
    fsm.update(0.1); // reel 0
    fsm.update(0.1); // reel 1
    fsm.update(0.1); // reel 2 -> EVALUATING
    expect(fsm.currentStateId).toBe("EVALUATING");
  });

  it("evaluates 3 matching as 10x win", () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    fsm.start();

    // Force reels to 3 matching
    ctx.reels = ["7", "7", "7"];
    fsm.transitionTo("EVALUATING");

    fsm.update(0.1); // EVALUATING -> PAYOUT
    expect(ctx.winMultiplier).toBe(10);
    expect(ctx.winAmount).toBe(100);
    expect(fsm.currentStateId).toBe("PAYOUT");
  });

  it("evaluates 2 matching as 3x win", () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    fsm.start();

    ctx.reels = ["7", "7", "BAR"];
    fsm.transitionTo("EVALUATING");

    fsm.update(0.1);
    expect(ctx.winMultiplier).toBe(3);
    expect(ctx.winAmount).toBe(30);
    expect(fsm.currentStateId).toBe("PAYOUT");
  });

  it("evaluates 2 matching (last two) as 3x win", () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    fsm.start();

    ctx.reels = ["BAR", "7", "7"];
    fsm.transitionTo("EVALUATING");

    fsm.update(0.1);
    expect(ctx.winMultiplier).toBe(3);
    expect(ctx.winAmount).toBe(30);
  });

  it("evaluates 2 matching (first and last) as 3x win", () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    fsm.start();

    ctx.reels = ["7", "BAR", "7"];
    fsm.transitionTo("EVALUATING");

    fsm.update(0.1);
    expect(ctx.winMultiplier).toBe(3);
    expect(ctx.winAmount).toBe(30);
  });

  it("evaluates no match as loss", () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    fsm.start();

    ctx.reels = ["7", "BAR", "CHERRY"];
    fsm.transitionTo("EVALUATING");

    fsm.update(0.1);
    expect(ctx.winMultiplier).toBe(0);
    expect(ctx.winAmount).toBe(0);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("calls creditWinnings on entering CREDITING_WIN", () => {
    const credits: number[] = [];
    const ctx = createSlotCtx({
      creditWinnings: async (amount) => { credits.push(amount); },
    });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    ctx.reels = ["7", "7", "7"];
    fsm.transitionTo("EVALUATING");

    fsm.update(0.1); // EVALUATING -> PAYOUT
    fsm.update(0.1); // PAYOUT -> CREDITING_WIN
    expect(credits).toEqual([100]);
  });

  it("stays in CREDITING_WIN while credit is pending", () => {
    const ctx = createSlotCtx({
      creditWinnings: async () => {
        await new Promise((r) => setTimeout(r, 1000));
      },
    });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    ctx.reels = ["7", "7", "7"];
    fsm.transitionTo("EVALUATING");

    fsm.update(0.1); // EVALUATING -> PAYOUT
    fsm.update(0.1); // PAYOUT -> CREDITING_WIN
    expect(fsm.currentStateId).toBe("CREDITING_WIN");

    fsm.update(0.1); // still pending
    expect(fsm.currentStateId).toBe("CREDITING_WIN");
  });

  it("transitions CREDITING_WIN -> IDLE when credit resolves", async () => {
    let resolve!: () => void;
    const ctx = createSlotCtx({
      creditWinnings: async () => {
        await new Promise<void>((r) => { resolve = r; });
      },
    });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    ctx.reels = ["7", "7", "7"];
    fsm.transitionTo("EVALUATING");

    fsm.update(0.1); // EVALUATING -> PAYOUT
    fsm.update(0.1); // PAYOUT -> CREDITING_WIN
    expect(fsm.currentStateId).toBe("CREDITING_WIN");

    resolve();
    // flush microtasks: one for the await inside creditWinnings, one for the .then()
    await Promise.resolve();
    await Promise.resolve();

    fsm.update(0.1);
    expect(fsm.currentStateId).toBe("IDLE");
  });

  it("transitions PAYOUT -> CREDITING_WIN on update", () => {
    const ctx = createSlotCtx();
    const fsm = createSlotFSM(ctx);
    fsm.start();

    ctx.reels = ["7", "7", "7"];
    fsm.transitionTo("EVALUATING");
    fsm.update(0.1); // -> PAYOUT
    expect(fsm.currentStateId).toBe("PAYOUT");

    fsm.update(0.1); // -> CREDITING_WIN
    expect(fsm.currentStateId).toBe("CREDITING_WIN");
  });

  it("completes a full spin cycle", () => {
    const deductions: number[] = [];
    const results: string[] = [];
    const ctx = createSlotCtx({
      spinsRemaining: 1,
      spinDuration: 0.1,
      stopInterval: 0.1,
      deductBet: async (amount) => { deductions.push(amount); },
    });
    const fsm = createSlotFSM(ctx);

    // Track results before they get cleared by next spin
    fsm.on((e) => {
      if (e.from === "EVALUATING") results.push(ctx.lastResult);
    });

    fsm.start();
    expect(fsm.currentStateId).toBe("IDLE");

    // First update: IDLE -> DEDUCTING_BET
    fsm.update(0.1);
    // Simulate instant bet resolution
    ctx.betPending = false;

    // Run enough updates to complete one full cycle
    for (let i = 0; i < 20; i++) {
      // Also clear creditPending if we reach CREDITING_WIN
      if (fsm.currentStateId === "CREDITING_WIN") {
        ctx.creditPending = false;
      }
      fsm.update(0.1);
    }

    expect(deductions).toEqual([10]);
    expect(results.length).toBe(1);
    expect(results[0]).not.toBe("");
  });

  it("records state transitions in history", () => {
    const ctx = createSlotCtx({ spinDuration: 0, stopInterval: 0 });
    const fsm = createSlotFSM(ctx);
    fsm.start();

    // Drive through states, clearing pending flags as needed
    for (let i = 0; i < 10; i++) {
      if (fsm.currentStateId === "DEDUCTING_BET") ctx.betPending = false;
      if (fsm.currentStateId === "CREDITING_WIN") ctx.creditPending = false;
      fsm.update(0.1);
    }

    const history = fsm.getHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]!.from).toBe("IDLE");
    expect(history[0]!.to).toBe("DEDUCTING_BET");
  });
});

import { createSlotFSM } from "./slot/SlotStateMachine.js";
import type { SlotContext } from "./slot/SlotContext.js";
import { GameLoop } from "./GameLoop.js";

const SYMBOLS = ["7", "BAR", "CHERRY", "BELL", "LEMON", "STAR"];
const TOTAL_SPINS = 10;
const BET_AMOUNT = 10;
const STARTING_BALANCE = 100;

function createSlotContext(): SlotContext {
  return {
    balance: STARTING_BALANCE,
    betAmount: BET_AMOUNT,
    reels: [null, null, null],
    symbols: SYMBOLS,
    spinTimer: 0,
    spinDuration: 0.3,
    stopIndex: 0,
    stopTimer: 0,
    stopInterval: 0.2,
    winAmount: 0,
    winMultiplier: 0,
    spinsRemaining: TOTAL_SPINS,
    totalSpins: TOTAL_SPINS,
    lastResult: "",

    deductBet: async (amount: number) => {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 50));
      ctx.balance -= amount;
    },
    creditWinnings: async (amount: number) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      ctx.balance += amount;
    },
  };
}

const ctx = createSlotContext();

function formatReels(reels: (string | null)[]): string {
  const display = reels.map((r) => (r === null ? "???" : r));
  return `[ ${display.join(" | ")} ]`;
}

function render(ctx: SlotContext, stateId: string): void {
  const spin = ctx.totalSpins - ctx.spinsRemaining;
  console.log(
    `=== Spin ${spin}/${ctx.totalSpins} | Balance: $${ctx.balance} | Bet: $${ctx.betAmount} ===`,
  );
  console.log(`  State: ${stateId}`);
  console.log(`  ${formatReels(ctx.reels)}`);
  if (ctx.lastResult) {
    console.log(`  ${ctx.lastResult}`);
  }
  console.log();
}

async function main(): Promise<void> {
  const fsm = createSlotFSM(ctx);
  await fsm.start();

  let lastStateId = fsm.currentStateId;
  render(ctx, lastStateId);

  const loop = new GameLoop(async (dt) => {
    await fsm.update(dt);
    const currentId = fsm.currentStateId;

    if (currentId !== lastStateId) {
      render(ctx, currentId);
      lastStateId = currentId;
    }

    // Stop when out of spins and back to IDLE
    const done =
      currentId === "IDLE" &&
      (ctx.spinsRemaining <= 0 || ctx.balance < ctx.betAmount);
    if (done) {
      loop.stop();
      console.log("=== Session Complete ===");
      console.log(`  Final Balance: $${ctx.balance}`);
      const net = ctx.balance - STARTING_BALANCE;
      console.log(`  Net: ${net >= 0 ? "+" : ""}$${net}`);
    }
  }, 20);

  loop.start();
}

main().catch(console.error);

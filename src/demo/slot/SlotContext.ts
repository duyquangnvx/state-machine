export interface SlotContext {
  balance: number;
  betAmount: number;
  reels: (string | null)[]; // null = still spinning
  symbols: string[];
  spinTimer: number;
  spinDuration: number;
  stopIndex: number;
  stopTimer: number;
  stopInterval: number;
  winAmount: number;
  winMultiplier: number;
  spinsRemaining: number;
  totalSpins: number;
  lastResult: string;

  // Async mock API callbacks
  deductBet: (amount: number) => Promise<void>;
  creditWinnings: (amount: number) => Promise<void>;
}

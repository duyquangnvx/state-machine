/**
 * setTimeout-based tick loop with delta time.
 */
export class GameLoop {
  private running = false;
  private tickCount = 0;
  private readonly intervalMs: number;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly onTick: (dt: number, tick: number) => void,
    private readonly tickRate: number = 10,
  ) {
    this.intervalMs = 1000 / tickRate;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.tickCount = 0;
    this.schedule();
  }

  stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  get isRunning(): boolean {
    return this.running;
  }

  get ticks(): number {
    return this.tickCount;
  }

  private schedule(): void {
    this.timerId = setTimeout(() => {
      if (!this.running) return;
      this.tickCount += 1;
      const dt = this.intervalMs / 1000;
      this.onTick(dt, this.tickCount);
      if (this.running) this.schedule();
    }, this.intervalMs);
  }
}

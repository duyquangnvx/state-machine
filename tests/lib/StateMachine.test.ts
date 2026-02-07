import {
  StateMachine,
  BaseState,
  StateNotFoundError,
  MachineNotStartedError,
  HierarchicalState,
} from "../../src/lib/index.js";
import type { StateMachineConfig } from "../../src/lib/index.js";

// ---------- test helpers ----------

type TestStateId = "idle" | "walking" | "running" | "stopped";

interface TestContext {
  speed: number;
  log: string[];
}

class IdleState extends BaseState<TestContext, TestStateId> {
  readonly id = "idle" as const;
  override onEnter(ctx: TestContext): void {
    ctx.log.push("enter:idle");
  }
  override onExit(ctx: TestContext): void {
    ctx.log.push("exit:idle");
  }
}

class WalkingState extends BaseState<TestContext, TestStateId> {
  readonly id = "walking" as const;
  override onEnter(ctx: TestContext): void {
    ctx.speed = 1;
    ctx.log.push("enter:walking");
  }
  override onUpdate(ctx: TestContext, dt: number): TestStateId | undefined {
    ctx.speed += dt;
    if (ctx.speed >= 5) return "running";
    return undefined;
  }
  override onExit(ctx: TestContext): void {
    ctx.log.push("exit:walking");
  }
}

class RunningState extends BaseState<TestContext, TestStateId> {
  readonly id = "running" as const;
  override onEnter(ctx: TestContext): void {
    ctx.log.push("enter:running");
  }
  override onExit(ctx: TestContext): void {
    ctx.log.push("exit:running");
  }
}

class StoppedState extends BaseState<TestContext, TestStateId> {
  readonly id = "stopped" as const;
  override onEnter(ctx: TestContext): void {
    ctx.speed = 0;
    ctx.log.push("enter:stopped");
  }
}

function createConfig(
  overrides?: Partial<StateMachineConfig<TestContext, TestStateId>>,
): StateMachineConfig<TestContext, TestStateId> {
  return {
    states: [
      new IdleState(),
      new WalkingState(),
      new RunningState(),
      new StoppedState(),
    ],
    initialState: "idle",
    context: { speed: 0, log: [] },
    ...overrides,
  };
}

// ---------- tests ----------

describe("StateMachine", () => {
  describe("construction", () => {
    it("creates a machine from valid config", () => {
      const sm = new StateMachine(createConfig());
      expect(sm.isStarted).toBe(false);
    });

    it("throws on duplicate state id", () => {
      expect(
        () =>
          new StateMachine({
            ...createConfig(),
            states: [new IdleState(), new IdleState()],
          }),
      ).toThrow("Duplicate state id");
    });

    it("throws if initial state not found", () => {
      expect(
        () =>
          new StateMachine({
            ...createConfig(),
            initialState: "nonexistent" as TestStateId,
          }),
      ).toThrow(StateNotFoundError);
    });
  });

  describe("start / stop", () => {
    it("enters initial state on start", () => {
      const sm = new StateMachine(createConfig());
      sm.start();
      expect(sm.isStarted).toBe(true);
      expect(sm.currentStateId).toBe("idle");
      expect(sm.context.log).toContain("enter:idle");
    });

    it("is idempotent on double start", () => {
      const sm = new StateMachine(createConfig());
      sm.start();
      sm.start();
      expect(sm.context.log.filter((l) => l === "enter:idle")).toHaveLength(1);
    });

    it("exits current state on stop", () => {
      const sm = new StateMachine(createConfig());
      sm.start();
      sm.transitionTo("walking");
      sm.stop();
      expect(sm.isStarted).toBe(false);
      expect(sm.context.log).toContain("exit:walking");
    });

    it("throws when accessing currentStateId before start", () => {
      const sm = new StateMachine(createConfig());
      expect(() => sm.currentStateId).toThrow(MachineNotStartedError);
    });
  });

  describe("transitionTo()", () => {
    it("transitions to target state", () => {
      const sm = new StateMachine(createConfig());
      sm.start();
      sm.transitionTo("walking");
      expect(sm.currentStateId).toBe("walking");
    });

    it("throws on unknown state", () => {
      const sm = new StateMachine(createConfig());
      sm.start();
      expect(() => sm.transitionTo("flying" as TestStateId)).toThrow(
        StateNotFoundError,
      );
    });

    it("calls onExit then onEnter in order", () => {
      const sm = new StateMachine(createConfig());
      sm.start();
      sm.context.log = [];
      sm.transitionTo("walking");
      expect(sm.context.log).toEqual(["exit:idle", "enter:walking"]);
    });

    it("throws if machine not started", () => {
      const sm = new StateMachine(createConfig());
      expect(() => sm.transitionTo("walking")).toThrow(MachineNotStartedError);
    });
  });

  describe("update()", () => {
    it("calls onUpdate on current state", () => {
      const sm = new StateMachine(createConfig());
      sm.start();
      sm.transitionTo("walking");
      sm.update(1);
      expect(sm.context.speed).toBe(2); // 1 (enter) + 1 (update)
    });

    it("auto-transitions when onUpdate returns a state id", () => {
      const sm = new StateMachine(createConfig());
      sm.start();
      sm.transitionTo("walking");
      // speed starts at 1, each update adds dt
      sm.update(4); // speed=5 -> returns "running"
      expect(sm.currentStateId).toBe("running");
    });

    it("throws if machine not started", () => {
      const sm = new StateMachine(createConfig());
      expect(() => sm.update(1)).toThrow(MachineNotStartedError);
    });
  });

  describe("history & events", () => {
    it("records state changes in history", () => {
      const sm = new StateMachine(createConfig());
      sm.start();
      sm.transitionTo("walking");
      sm.transitionTo("stopped");

      const history = sm.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]!.from).toBe("idle");
      expect(history[0]!.to).toBe("walking");
      expect(history[1]!.from).toBe("walking");
      expect(history[1]!.to).toBe("stopped");
    });

    it("emits events to listeners", () => {
      const sm = new StateMachine(createConfig());
      const events: string[] = [];
      sm.on((e) => events.push(`${e.from}->${e.to}`));
      sm.start();
      sm.transitionTo("walking");
      sm.transitionTo("stopped");
      expect(events).toEqual(["idle->walking", "walking->stopped"]);
    });

    it("unsubscribe works", () => {
      const sm = new StateMachine(createConfig());
      const events: string[] = [];
      const unsub = sm.on((e) => events.push(`${e.from}->${e.to}`));
      sm.start();
      sm.transitionTo("walking");
      unsub();
      sm.transitionTo("stopped");
      expect(events).toEqual(["idle->walking"]);
    });

    it("respects bounded history", () => {
      const sm = new StateMachine(createConfig({ historySize: 2 }));
      sm.start();
      sm.transitionTo("walking");
      sm.transitionTo("stopped");
      sm.transitionTo("idle");
      expect(sm.getHistory()).toHaveLength(2);
      expect(sm.getHistory()[0]!.from).toBe("walking");
    });
  });

  describe("HierarchicalState", () => {
    type ParentId = "active" | "done";
    type ChildId = "a" | "b";

    class ChildA extends BaseState<TestContext, ChildId> {
      readonly id = "a" as const;
      override onEnter(ctx: TestContext): void {
        ctx.log.push("enter:child:a");
      }
      override onExit(ctx: TestContext): void {
        ctx.log.push("exit:child:a");
      }
    }

    class ChildB extends BaseState<TestContext, ChildId> {
      readonly id = "b" as const;
      override onEnter(ctx: TestContext): void {
        ctx.log.push("enter:child:b");
      }
    }

    class ActiveState extends HierarchicalState<TestContext, ParentId, ChildId> {
      readonly id = "active" as const;
      protected override createChildConfig(ctx: TestContext) {
        return {
          states: [new ChildA(), new ChildB()],
          initialState: "a" as const,
          context: ctx,
        };
      }
    }

    class DoneState extends BaseState<TestContext, ParentId> {
      readonly id = "done" as const;
    }

    it("starts and stops child machine with parent state", () => {
      const ctx: TestContext = { speed: 0, log: [] };
      const sm = new StateMachine<TestContext, ParentId>({
        states: [new ActiveState(), new DoneState()],
        initialState: "active",
        context: ctx,
      });
      sm.start();
      expect(ctx.log).toContain("enter:child:a");

      sm.transitionTo("done");
      expect(ctx.log).toContain("exit:child:a");
    });
  });
});

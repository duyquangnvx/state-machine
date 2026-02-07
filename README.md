# state-machine

A generic, type-safe finite state machine library for TypeScript with synchronous lifecycle hooks, transition guards, hierarchical states, event history, and a tick-based update loop.

## Features

- **Fully generic** — `StateMachine<TContext, TStateId>` works with any context and state ID types
- **Synchronous lifecycle** — `onEnter` / `onExit` / `onUpdate` are all sync for deterministic state at every moment
- **Transition guards** — `canTransitionTo(target, ctx)` lets each state control allowed transitions
- **Tick-based updates** — `onUpdate(ctx, dt)` runs every frame/tick; return a state ID to auto-transition
- **Hierarchical states** — `HierarchicalState` embeds a nested state machine inside a parent state
- **Event system** — Subscribe to state changes with `on(listener)`, unsubscribe with the returned function
- **Bounded history** — Configurable history buffer for debugging and replay

## Quick start

```bash
npm install
npm run build
```

### Define states

```ts
import { BaseState } from "state-machine";

type MyStateId = "idle" | "loading" | "ready";

interface MyContext {
  data: string | null;
}

class IdleState extends BaseState<MyContext, MyStateId> {
  readonly id = "idle" as const;

  override onEnter(ctx: MyContext, prevState: MyStateId | null): void {
    console.log("Entered idle");
  }

  override onUpdate(ctx: MyContext, dt: number): MyStateId | undefined {
    return "loading"; // auto-transition on next tick
  }
}

class LoadingState extends BaseState<MyContext, MyStateId> {
  readonly id = "loading" as const;

  override onUpdate(): MyStateId | undefined {
    return "ready";
  }
}

class ReadyState extends BaseState<MyContext, MyStateId> {
  readonly id = "ready" as const;
}
```

### Create and run the machine

```ts
import { StateMachine } from "state-machine";

const sm = new StateMachine<MyContext, MyStateId>({
  states: [new IdleState(), new LoadingState(), new ReadyState()],
  initialState: "idle",
  context: { data: null },
  historySize: 50, // optional, defaults to 100
});

sm.start();            // enters "idle", calls onEnter
sm.update(0.016);      // calls onUpdate, may auto-transition
sm.transitionTo("ready"); // explicit transition
sm.stop();             // exits current state, calls onExit
```

### Transition guards

Override `canTransitionTo` to block transitions conditionally:

```ts
class IdleState extends BaseState<MyContext, MyStateId> {
  readonly id = "idle" as const;

  override canTransitionTo(target: MyStateId, ctx: MyContext): boolean {
    return ctx.data !== null; // only allow transitions when data is loaded
  }
}
```

Blocked transitions throw `TransitionDeniedError`.

### Events and history

```ts
const unsub = sm.on((event) => {
  console.log(`${event.from} -> ${event.to} at ${event.timestamp}`);
});

sm.getHistory(); // ReadonlyArray<StateChangeEvent<MyStateId>>
unsub();         // stop listening
```

### Async work as a state

The state machine is fully synchronous — `onEnter`, `onExit`, and `onUpdate` all return `void`. This ensures the machine is always in exactly one definite state at any moment, which is critical for game loops and real-time systems.

To handle async operations (API calls, loading, etc.), **model the async work as its own state** that polls for completion:

```ts
type MyStateId = "IDLE" | "LOADING" | "READY";

interface MyContext {
  loading: boolean;
  data: string | null;
  fetchData: () => Promise<string>;
}

class LoadingState extends BaseState<MyContext, MyStateId> {
  readonly id = "LOADING" as const;

  override onEnter(ctx: MyContext): void {
    ctx.loading = true;
    ctx.fetchData().then((data) => {
      ctx.data = data;
      ctx.loading = false;
    });
  }

  override onUpdate(ctx: MyContext): MyStateId | undefined {
    if (!ctx.loading) return "READY";
    return undefined;
  }
}
```

This pattern keeps the state machine synchronous while still supporting async operations. The state machine ticks on each frame/update, and the loading state simply polls until the async work completes.

## API

### `StateMachine<TContext, TStateId>`

| Method / Property | Description |
|---|---|
| `start(): void` | Enter the initial state. Idempotent. |
| `stop(): void` | Exit the current state and shut down. |
| `transitionTo(stateId): void` | Transition to a specific state (checks guard). |
| `update(dt): void` | Tick the current state; auto-transitions if `onUpdate` returns a state ID. |
| `on(listener)` | Subscribe to state changes. Returns unsubscribe function. |
| `getHistory()` | Get the bounded transition history. |
| `currentStateId` | The active state's ID. Throws if not started. |
| `isStarted` | Whether the machine is running. |
| `context` | The shared mutable context object. |

### `BaseState<TContext, TStateId>` (lifecycle hooks)

| Hook | Signature | Notes |
|---|---|---|
| `canTransitionTo` | `(target, ctx) => boolean` | Sync guard. Default: `true`. |
| `onEnter` | `(ctx, prevState) => void` | Called when entering. `prevState` is `null` on `start()`. |
| `onUpdate` | `(ctx, dt) => TStateId \| undefined` | Return a state ID to auto-transition. |
| `onExit` | `(ctx, nextState) => void` | Called when leaving. `nextState` is `null` on `stop()`. |

### `HierarchicalState<TContext, TParentId, TChildId>`

A composite state that runs a nested `StateMachine`. Override `createChildConfig(ctx)` to define the child machine. The child starts/stops automatically with the parent state.

### Errors

| Error | Thrown when |
|---|---|
| `StateNotFoundError` | Transitioning to an unknown state ID. |
| `MachineNotStartedError` | Calling `transitionTo`, `update`, or `currentStateId` before `start()`. |
| `TransitionDeniedError` | `canTransitionTo` returns `false`. |

## Demos

### Tower Defense

Three interlocking state machines (tower, enemy, wave) simulating a tower defense game loop.

```
Tower:  BUILDING -> IDLE -> TARGETING -> ATTACKING -> IDLE
Enemy:  SPAWNING -> MOVING -> ATTACKING -> DYING -> DEAD
Wave:   PREPARING -> WAVE_ACTIVE -> WAVE_COMPLETE -> ... -> GAME_OVER
```

```bash
npm run build && npm run demo
```

### Slot Machine

Demonstrates the "async work as a state" pattern — API calls (bet deduction, payout crediting) are modeled as dedicated states that poll for completion.

```
IDLE -> DEDUCTING_BET -> SPINNING -> STOPPING -> EVALUATING -> CREDITING_WIN -> IDLE
                                                     |
                                                     +--> IDLE (no win)
```

```bash
npm run build && npm run demo:slot
```

## Testing

```bash
npm test
```

67 tests covering the core library (construction, start/stop, transitions, guards, updates, events, history, hierarchical states) and both demos.

## Project structure

```
src/
  lib/                    # Core library
    State.ts              # BaseState abstract class
    StateMachine.ts       # StateMachine engine
    HierarchicalState.ts  # Composite state with nested machine
    StateEvent.ts         # Event emitter with bounded history
    interfaces.ts         # IState, IStateMachine, config types
    errors.ts             # StateNotFoundError, MachineNotStartedError, TransitionDeniedError
    index.ts              # Public exports
  demo/
    tower/                # Tower defense FSM (tower states)
    enemy/                # Tower defense FSM (enemy states)
    wave/                 # Tower defense FSM (wave management)
    slot/                 # Slot machine FSM
    main.ts               # Tower defense entry point
    slot-main.ts          # Slot machine entry point
    GameLoop.ts           # Tick-based game loop utility
tests/
  lib/                    # Core library tests
  demo/                   # Demo-specific tests
```

## License

ISC

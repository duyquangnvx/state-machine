# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
npm run build          # Build ESM + CJS bundles via tsup (src/lib only)
npm run build:demo     # Compile demo apps via tsc
npm test               # Run all Jest tests (ESM mode via ts-jest)
npx jest tests/lib/StateMachine.test.ts   # Run a single test file
npx jest -t "pattern"  # Run tests matching a name pattern
npm run demo           # Run tower defense demo (requires build first)
npm run demo:slot      # Run slot machine demo (requires build first)
npm run clean          # Remove dist/
```

## Architecture

### Core Library (`src/lib/`)

A fully generic, synchronous state machine: `StateMachine<TContext, TStateId>`.

- **StateMachine.ts** — Engine that manages state transitions, tick-based updates, event emission, and bounded history. Validates state configuration at construction time.
- **State.ts** — `BaseState<TContext, TStateId>` abstract class. Subclass it, override `id` as a const, and implement lifecycle hooks: `onEnter`, `onUpdate`, `onExit`, `canTransitionTo`.
- **HierarchicalState.ts** — Extends BaseState to embed a nested StateMachine, enabling composite state hierarchies. Override `createChildConfig()` to define the child machine.
- **StateEvent.ts** — Event emitter with circular bounded history buffer. `on()` returns an unsubscribe function.
- **interfaces.ts** — All type definitions (`IState`, `IStateMachine`, `StateMachineConfig`, `StateChangeEvent`).
- **errors.ts** — `StateNotFoundError`, `MachineNotStartedError`, `TransitionDeniedError`.

### Key Design Decisions

- **All hooks are synchronous.** Async work (API calls, timers) is modeled as dedicated states that poll a flag via `onUpdate`. See the slot machine demo's `DeductingBetState` and `CreditingWinState` for this pattern.
- **`onUpdate(ctx, dt)` drives auto-transitions.** Returning a `TStateId` from `onUpdate` triggers an immediate transition — this is the primary mechanism for timer-based and condition-based state changes.
- **`canTransitionTo(targetState, ctx)` acts as a guard.** Returning `false` throws `TransitionDeniedError`.
- **Context is shared mutable state.** All states receive the same context object and mutate it directly. Context often includes callback functions (e.g., `dealDamageToEnemy`, `deductBet`) for interacting with external systems.

### Demos (`src/demo/`)

Two demos exercise the library with realistic patterns:

1. **Tower Defense** — Three interlocking state machines (tower, enemy, wave) running in a shared game loop. Shows multi-FSM coordination.
2. **Slot Machine** — Demonstrates the async-as-state polling pattern with simulated API calls.

Both use `GameLoop.ts`, a setTimeout-based tick loop supporting sync and async callbacks.

### Tests (`tests/`)

Jest with ts-jest in ESM mode. Tests cover the core library (`tests/lib/`) and all demo FSMs (`tests/demo/`). Tests drive FSMs by calling `update(dt)` with controlled delta times and asserting state transitions and context mutations.

## Conventions

- **TypeScript strict mode** with `noUncheckedIndexedAccess` and `noImplicitOverride` enabled.
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- **State IDs** are string literal union types (e.g., `"IDLE" | "ATTACKING" | "DESTROYED"`).
- **State classes** are named `{Name}State` and placed in a `states/` subdirectory alongside their context and events files.
- **Dual output**: tsup builds both ESM (`index.js`) and CJS (`index.cjs`) with declarations.

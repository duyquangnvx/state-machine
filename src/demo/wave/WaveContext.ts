export interface WaveContext {
    currentWave: number;
    totalWaves: number;
    enemiesRemaining: number;
    enemiesPerWave: number;
    baseHp: number;
    score: number;

    // Timers
    prepTimer: number;
    prepDuration: number;

    // Injected callbacks
    spawnWaveEnemies: (wave: number, count: number) => void;
}

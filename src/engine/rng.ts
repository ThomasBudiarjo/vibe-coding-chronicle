export interface Rng {
  next(): number;
  int(min: number, maxInclusive: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
  getState(): number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  if (state === 0) state = 0x6d2b79f5;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min: number, maxInclusive: number): number {
      return min + Math.floor(next() * (maxInclusive - min + 1));
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(next() * items.length)];
    },
    chance(probability: number): boolean {
      return next() < probability;
    },
    getState(): number {
      return state >>> 0;
    }
  };
}

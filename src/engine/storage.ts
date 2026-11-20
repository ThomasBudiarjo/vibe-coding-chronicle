import {
  computeSpeedMultiplier,
  createInitialState,
  getAgentSlots,
  SAVE_VERSION
} from './simulation';
import type { GameState, OfflineSummary } from './types';

export const SAVE_STORAGE_KEY = 'vibe-factory-save-v1';
export const MAX_OFFLINE_SEC = 8 * 60 * 60;

export function serializeState(state: GameState, nowMs = Date.now()): string {
  const payload: GameState = {
    ...state,
    version: SAVE_VERSION,
    lastSavedAt: nowMs
  };
  return JSON.stringify(payload);
}

export function isValidSavedState(data: unknown): data is GameState {
  if (!data || typeof data !== 'object') return false;
  const s = data as Partial<GameState>;
  return (
    s.version === SAVE_VERSION &&
    typeof s.cash === 'number' &&
    Number.isFinite(s.cash) &&
    typeof s.xp === 'number' &&
    typeof s.era === 'number' &&
    s.setup !== undefined &&
    typeof s.setup.monitors === 'number' &&
    typeof s.setup.power === 'number' &&
    Array.isArray(s.skills) &&
    Array.isArray(s.inbox) &&
    Array.isArray(s.activeProjects)
  );
}

export function calculateOfflineProgress(
  state: GameState,
  nowMs = Date.now()
): { state: GameState; summary: OfflineSummary | null } {
  const rawElapsedSec = Math.max(0, (nowMs - state.lastSavedAt) / 1000);
  if (rawElapsedSec < 15) {
    return { state, summary: null };
  }

  const elapsedSec = Math.min(MAX_OFFLINE_SEC, rawElapsedSec);
  const next: GameState = JSON.parse(JSON.stringify(state)) as GameState;

  const agentSlots = getAgentSlots(next);
  const hasFactory = next.skills.includes('autonomous_saas');
  if (agentSlots === 0 && !hasFactory) {
    next.lastSavedAt = nowMs;
    return { state: next, summary: null };
  }

  const speed = computeSpeedMultiplier(next);
  const projectsPerSec =
    agentSlots > 0 && (next.botAutoIntake || next.activeProjects.length > 0)
      ? (agentSlots * 0.045 * Math.min(4, speed)) / Math.max(1, 3 + next.era * 0.4)
      : 0;

  const projectsShipped = Math.floor(projectsPerSec * elapsedSec);
  const avgPayout = Math.round(70 * Math.pow(1.62, next.era - 1) * next.prestigeMultiplier);
  const avgXp = Math.round(25 * Math.pow(1.4, next.era - 1) * next.prestigeMultiplier);

  const contractCash = projectsShipped * avgPayout;
  const saasEarned = hasFactory ? Math.round(next.saasRevenuePerSec * elapsedSec) : 0;
  const cashEarned = contractCash + saasEarned;
  const xpEarned =
    projectsShipped * avgXp +
    (hasFactory ? Math.round(1.5 * next.prestigeMultiplier * elapsedSec) : 0);

  if (cashEarned <= 0 && xpEarned <= 0) {
    next.lastSavedAt = nowMs;
    return { state: next, summary: null };
  }

  next.cash += cashEarned;
  next.totalCashEarned += cashEarned;
  next.xp += xpEarned;
  next.shippedCount += projectsShipped;
  next.lastSavedAt = nowMs;
  // Never retroactively trigger an MCB trip while offline
  next.mcbTripped = false;
  next.mcbCooldownSec = 0;

  return {
    state: next,
    summary: {
      elapsedSec: Math.round(elapsedSec),
      cashEarned,
      xpEarned,
      projectsShipped,
      saasEarned
    }
  };
}

export function deserializeState(
  raw: string | null,
  nowMs = Date.now()
): { state: GameState; summary: OfflineSummary | null; recoveredFromError: boolean } {
  if (!raw) {
    return { state: createInitialState(), summary: null, recoveredFromError: false };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSavedState(parsed)) {
      return { state: createInitialState(), summary: null, recoveredFromError: true };
    }
    const { state, summary } = calculateOfflineProgress(parsed, nowMs);
    return { state, summary, recoveredFromError: false };
  } catch {
    return { state: createInitialState(), summary: null, recoveredFromError: true };
  }
}

export function saveToStorage(state: GameState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SAVE_STORAGE_KEY, serializeState(state));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export function loadFromStorage(nowMs = Date.now()): {
  state: GameState;
  summary: OfflineSummary | null;
  recoveredFromError: boolean;
} {
  try {
    if (typeof localStorage === 'undefined') {
      return { state: createInitialState(), summary: null, recoveredFromError: false };
    }
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    return deserializeState(raw, nowMs);
  } catch {
    return { state: createInitialState(), summary: null, recoveredFromError: true };
  }
}

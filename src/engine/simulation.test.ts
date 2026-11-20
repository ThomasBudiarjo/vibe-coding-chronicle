import { describe, expect, it } from 'vitest';
import { computeHallucinationProbability } from './generators';
import { createRng } from './rng';
import {
  computePowerStatus,
  computeThermalStatus,
  createInitialState,
  reduceGame,
  tickGame
} from './simulation';
import { calculateOfflineProgress, deserializeState, serializeState } from './storage';

describe('Vibe Factory Engine', () => {
  it('completes the manual loop: email accept -> prompt -> diff accept/reject -> project ship', () => {
    const rng = createRng(42);
    let state = createInitialState(42);
    expect(state.inbox.length).toBeGreaterThanOrEqual(2);
    const initialCash = state.cash;

    const firstEmail = state.inbox[0];
    state = reduceGame(state, { type: 'ACCEPT_EMAIL', emailId: firstEmail.id }, rng).state;
    expect(state.activeProjects.length).toBe(1);

    let safety = 0;
    while (state.activeProjects.length > 0 && safety < 200) {
      safety += 1;
      const proj = state.activeProjects[0];
      if (!proj.currentDiff) {
        state = reduceGame(state, { type: 'PROMPT_STEP' }, rng).state;
      } else if (proj.currentDiff.risk === 'hallucination') {
        state = reduceGame(state, { type: 'REJECT_DIFF' }, rng).state;
      } else {
        state = reduceGame(state, { type: 'ACCEPT_DIFF' }, rng).state;
      }
    }

    expect(state.shippedCount).toBe(1);
    expect(state.cash).toBeGreaterThan(initialCash);
    expect(state.xp).toBeGreaterThan(0);
    expect(state.activeModal?.id).toBe('story_first_ship');
  });

  it('applies hallucination tech debt, and planning + review mitigate risk', () => {
    const rng = createRng(100);
    let state = createInitialState(100);
    state.skills.push('prompt_templates', 'plan_first', 'review_scanner', 'diff_linter');
    state.era = 3;

    const email = state.inbox[0];
    state = reduceGame(state, { type: 'ACCEPT_EMAIL', emailId: email.id }, rng).state;

    const unplannedChance = computeHallucinationProbability(state, state.activeProjects[0]);

    for (let i = 0; i < 4; i++) {
      state = reduceGame(state, { type: 'PLAN_PROJECT' }, rng).state;
    }
    expect(state.activeProjects[0].planned).toBe(true);
    const plannedChance = computeHallucinationProbability(state, state.activeProjects[0]);
    expect(plannedChance).toBeLessThan(unplannedChance);

    // Inject a hallucination diff and accept it -> +12 tech debt
    state.activeProjects[0].currentDiff = {
      id: 'test_hal',
      filePath: 'src/api/pay.ts',
      snippet: '+ const finalPrice = 0;',
      hint: 'Free money?',
      risk: 'hallucination',
      scannedBadge: 'hallucination',
      scanConfidence: 96
    };
    state = reduceGame(state, { type: 'ACCEPT_DIFF' }, rng).state;
    expect(state.techDebt).toBe(12);

    // Inject another hallucination diff and reject it -> lowers tech debt
    if (state.activeProjects[0]) {
      state.activeProjects[0].currentDiff = {
        id: 'test_hal_2',
        filePath: 'src/db/migrate.ts',
        snippet: '+ DROP TABLE orders;',
        hint: 'Danger',
        risk: 'hallucination',
        scannedBadge: 'hallucination',
        scanConfidence: 96
      };
      state = reduceGame(state, { type: 'REJECT_DIFF' }, rng).state;
      expect(state.techDebt).toBeLessThan(12);
    }
  });

  it('tracks power wattage, triggers MCB trip on overload, and restores after cooldown', () => {
    const rng = createRng(7);
    let state = createInitialState(7);
    // Keep 450 VA meter, add heavy compute & monitors to exceed 100% load
    state.setup.power = 1; // 450 VA
    state.setup.room = 4;
    state.setup.monitors = 4; // 340W
    state.setup.compute = 3; // 390W

    const power = computePowerStatus(state);
    expect(power.usedW).toBeGreaterThan(power.capacityVA);
    expect(power.state).toBe('overload');

    for (let i = 0; i < 40 && !state.mcbTripped; i++) {
      state = tickGame(state, 0.5, rng).state;
    }
    expect(state.mcbTripped).toBe(true);
    expect(state.mcbCooldownSec).toBeGreaterThan(0);

    // Dismiss first_mcb_trip modal if triggered
    if (state.activeModal) {
      state = reduceGame(state, { type: 'RESOLVE_MODAL', choiceId: 'continue' }, rng).state;
    }

    // Cannot flip before cooldown elapses
    state = reduceGame(state, { type: 'FLIP_MCB' }, rng).state;
    expect(state.mcbTripped).toBe(true);

    // Tick past 2s cooldown
    state = tickGame(state, 1.0, rng).state;
    state = tickGame(state, 1.0, rng).state;
    state = tickGame(state, 0.5, rng).state;
    expect(state.mcbCooldownSec).toBe(0);

    state = reduceGame(state, { type: 'FLIP_MCB' }, rng).state;
    expect(state.mcbTripped).toBe(false);
  });

  it('runs Hermes Bot auto-intake, Swarm concurrency, and Software Factory passive SaaS income', () => {
    const rng = createRng(999);
    let state = createInitialState(999);
    state.setup = { monitors: 5, power: 7, room: 5, cooling: 4, compute: 5 };
    state.skills = [
      'better_prompting',
      'git_stash',
      'prompt_templates',
      'plan_first',
      'context_hygiene',
      'task_breakdown',
      'review_scanner',
      'diff_linter',
      'security_audit',
      'project_rules',
      'hermes_bot',
      'safe_pipelines',
      'autonomous_agent',
      'persistent_memory',
      'bot_negotiation',
      'swarm_orchestrator',
      'auto_merge',
      'prompt_caching',
      'autonomous_saas',
      'self_healing_prod'
    ];
    state.era = 7;
    state.botAutoIntake = true;
    state.botAutoNegotiate = true;
    state.saasRevenuePerSec = 30;
    state.seenStoryIds = [
      'first_ship',
      'first_mcb_trip',
      'second_monitor',
      'hermes_connected',
      'first_agent',
      'five_monitors',
      'software_factory'
    ];
    state.nextRandomEventSec = 9999;

    const startCash = state.cash;
    const thermal = computeThermalStatus(state);
    expect(thermal.throttled).toBe(false);

    for (let i = 0; i < 120; i++) {
      state = tickGame(state, 0.5, rng).state;
    }

    expect(state.shippedCount).toBeGreaterThanOrEqual(2);
    expect(state.saasProductsBuilt).toBeGreaterThanOrEqual(2);
    expect(state.cash).toBeGreaterThan(startCash + 1000);
  });

  it('roundtrips saves, falls back on corrupt payloads, and caps offline earnings at 8 hours without MCB trip', () => {
    const state = createInitialState(123);
    state.skills.push('hermes_bot', 'autonomous_agent', 'autonomous_saas');
    state.botAutoIntake = true;
    state.saasRevenuePerSec = 10;
    state.mcbTripped = true;

    const t0 = 1_700_000_000_000;
    const raw = serializeState(state, t0);

    // 20 hours later -> capped at 8 hours (28,800s)
    const loaded = deserializeState(raw, t0 + 20 * 3600 * 1000);
    expect(loaded.recoveredFromError).toBe(false);
    expect(loaded.summary).not.toBeNull();
    expect(loaded.summary!.elapsedSec).toBe(8 * 3600);
    expect(loaded.summary!.saasEarned).toBe(10 * 8 * 3600);
    expect(loaded.state.mcbTripped).toBe(false);

    // Corrupt save gracefully falls back
    const corrupt = deserializeState('{not valid json!!!');
    expect(corrupt.recoveredFromError).toBe(true);
    expect(corrupt.state.era).toBe(1);

    // Short offline (<15s) produces no banner
    const quick = calculateOfflineProgress(state, state.lastSavedAt + 5000);
    expect(quick.summary).toBeNull();
  });
});

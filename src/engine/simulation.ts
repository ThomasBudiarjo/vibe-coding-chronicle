import { getNextSetupTier, getSetupTier, getSkillById, SKILLS } from './catalog';
import { buildStoryBeat, generateDiffCard, generateProjectContract, generateRandomEvent } from './generators';
import { createRng, type Rng } from './rng';
import type {
  ActionEffects,
  ActiveProject,
  GameAction,
  GameLogEntry,
  GameState,
  PowerStatus,
  ProjectContract,
  RenderSnapshot,
  SetupTrackId,
  ThermalStatus
} from './types';

export const SAVE_VERSION = 1;

function cloneState(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

export function createInitialState(seed = 20261120): GameState {
  const rng = createRng(seed);
  const state: GameState = {
    version: SAVE_VERSION,
    rngState: rng.getState(),
    timeSec: 0,
    lastSavedAt: Date.now(),

    cash: 25,
    totalCashEarned: 25,
    xp: 0,
    techDebt: 0,
    reputation: 0,
    shippedCount: 0,
    prestigeCount: 0,
    prestigeMultiplier: 1,

    era: 1,
    setup: {
      monitors: 1,
      power: 1,
      room: 1,
      cooling: 1,
      compute: 1
    },
    skills: [],

    mcbTripped: false,
    mcbCooldownSec: 0,
    mcbTripCount: 0,

    inbox: [],
    activeProjects: [],
    selectedProjectIndex: 0,

    botAutoIntake: false,
    botAutoNegotiate: false,
    workflowAutoAcceptClean: false,
    saasRevenuePerSec: 0,
    saasProductsBuilt: 0,

    activeBuffs: [],
    activeModal: null,
    seenStoryIds: [],
    nextRandomEventSec: 55,
    nextEmailSec: 12,
    nextSaasBuildSec: 25,

    lastActionAt: -10,
    botPulseAt: -10,
    shipFlashAt: -10,
    recentLogs: [
      {
        id: 'log_init',
        text: 'Welcome to Kamar Kos (450 VA). Open Inbox to grab your first client!',
        tone: 'info',
        time: 0
      }
    ]
  };

  state.inbox.push(generateProjectContract(state, rng));
  state.inbox.push(generateProjectContract(state, rng));
  state.rngState = rng.getState();
  return state;
}

export function getAgentSlots(state: GameState): number {
  if (!state.skills.includes('autonomous_agent')) return 0;
  let slots = 1;
  if (state.skills.includes('swarm_orchestrator')) {
    slots = Math.min(3, Math.max(1, state.setup.compute));
  }
  if (state.skills.includes('auto_merge')) {
    slots = Math.min(5, Math.min(state.setup.monitors, state.setup.compute));
  }
  return slots;
}

export function getMaxActiveProjects(state: GameState): number {
  return Math.max(1, getAgentSlots(state));
}

export function getMaxInboxSize(state: GameState): number {
  return 3 + state.setup.monitors;
}

export function computePowerStatus(state: GameState): PowerStatus {
  const mon = getSetupTier('monitors', state.setup.monitors).watts;
  const room = getSetupTier('room', state.setup.room).watts;
  const cool = getSetupTier('cooling', state.setup.cooling).watts;
  const comp = getSetupTier('compute', state.setup.compute).watts;
  const powerTier = getSetupTier('power', state.setup.power);
  const capacityVA = powerTier.capacityVA ?? 450;

  const botW = state.skills.includes('hermes_bot') && state.botAutoIntake ? 90 : 0;
  const agentSlots = getAgentSlots(state);
  const activeAgentCount = Math.min(agentSlots, state.activeProjects.length);
  const cacheDiscount = state.skills.includes('prompt_caching') ? 0.8 : 1;
  const agentW = Math.round(activeAgentCount * 220 * cacheDiscount);
  const factoryW = state.skills.includes('autonomous_saas') ? Math.round(450 * cacheDiscount) : 0;
  const activePromptSpike = state.timeSec - state.lastActionAt < 1.8 && state.activeProjects.length > 0 ? 55 : 0;

  const usedW = mon + room + cool + comp + botW + agentW + factoryW + activePromptSpike;
  const safeW = Math.round(capacityVA * 0.85);
  const loadRatio = capacityVA > 0 ? usedW / capacityVA : 0;

  let status: PowerStatus['state'] = 'normal';
  if (state.mcbTripped) {
    status = 'tripped';
  } else if (loadRatio >= 1.0) {
    status = 'overload';
  } else if (loadRatio >= 0.85) {
    status = 'warning';
  }

  return { usedW, capacityVA, safeW, loadRatio, state: status };
}

export function computeThermalStatus(state: GameState): ThermalStatus {
  const coolingCaps = [1.5, 3.2, 6.5, 14];
  const coolingCapacity = coolingCaps[Math.max(0, Math.min(coolingCaps.length - 1, state.setup.cooling - 1))];

  const activeAgents = Math.min(getAgentSlots(state), state.activeProjects.length);
  const heatLoad =
    0.4 +
    (state.setup.compute - 1) * 0.65 +
    (state.setup.monitors - 1) * 0.25 +
    activeAgents * 1.15 +
    (state.skills.includes('autonomous_saas') ? 1.8 : 0);

  const throttled = heatLoad > coolingCapacity;
  const baseBonus = state.setup.cooling >= 4 ? 1.15 : 1.0;
  const speedMult = throttled ? Math.max(0.45, coolingCapacity / heatLoad) : baseBonus;

  return {
    heatLoad: Number(heatLoad.toFixed(1)),
    coolingCapacity,
    throttled,
    speedMult
  };
}

export function computeEra(state: GameState): number {
  let era = 1;
  if (state.skills.includes('prompt_templates')) era = Math.max(era, 2);
  if (state.skills.includes('task_breakdown')) era = Math.max(era, 3);
  if (state.skills.includes('security_audit')) era = Math.max(era, 4);
  if (state.skills.includes('safe_pipelines')) era = Math.max(era, 5);
  if (state.skills.includes('bot_negotiation')) era = Math.max(era, 6);
  if (state.skills.includes('prompt_caching')) era = Math.max(era, 7);
  return era;
}

export function computeSpeedMultiplier(state: GameState): number {
  const computeMults = [1.0, 1.35, 1.85, 2.5, 3.6];
  const monitorMults = [1.0, 1.2, 1.45, 1.75, 2.15];
  let mult =
    computeMults[Math.min(computeMults.length - 1, state.setup.compute - 1)] *
    monitorMults[Math.min(monitorMults.length - 1, state.setup.monitors - 1)];

  if (state.skills.includes('better_prompting')) mult *= 1.35;
  if (state.skills.includes('prompt_caching')) mult *= 1.35;

  const thermal = computeThermalStatus(state);
  mult *= thermal.speedMult;

  for (const buff of state.activeBuffs) {
    if (buff.speedMult) mult *= buff.speedMult;
  }

  return mult;
}

export function canUnlockSkill(state: GameState, skillId: string): boolean {
  if (state.skills.includes(skillId)) return false;
  const def = getSkillById(skillId);
  if (!def) return false;
  if (state.xp < def.xpCost) return false;
  return def.prereqIds.every((p) => state.skills.includes(p));
}

export function canBuySetup(
  state: GameState,
  track: SetupTrackId
): { ok: boolean; reason?: string; cost: number } {
  const next = getNextSetupTier(track, state.setup[track]);
  if (!next) return { ok: false, reason: 'Max level', cost: 0 };
  if (next.requiredRoomLevel && state.setup.room < next.requiredRoomLevel) {
    return { ok: false, reason: `Needs Room Tier ${next.requiredRoomLevel}`, cost: next.cost };
  }
  if (state.cash < next.cost) {
    return { ok: false, reason: 'Not enough cash', cost: next.cost };
  }
  return { ok: true, cost: next.cost };
}

function pushLog(state: GameState, text: string, tone: GameLogEntry['tone'] = 'info'): void {
  state.recentLogs = [
    {
      id: `log_${Math.round(state.timeSec * 10)}_${state.recentLogs.length}`,
      text,
      tone,
      time: state.timeSec
    },
    ...state.recentLogs
  ].slice(0, 14);
}

function maybeTriggerStory(state: GameState, storyId: string, effects: ActionEffects): void {
  if (state.activeModal || state.seenStoryIds.includes(storyId)) return;
  const modal = buildStoryBeat(storyId);
  if (modal) {
    state.seenStoryIds.push(storyId);
    state.activeModal = modal;
    effects.sfx.push('story');
  }
}

function createActiveProject(contract: ProjectContract, assignedToAgent: boolean): ActiveProject {
  return {
    contract,
    planned: false,
    planProgress: 0,
    diffsCompleted: 0,
    diffsTotal: contract.totalDiffs,
    promptProgress: 0,
    currentDiff: null,
    hallucinationsAccepted: 0,
    smellsAccepted: 0,
    cleanAccepted: 0,
    assignedToAgent
  };
}

function completeProject(state: GameState, projectIndex: number, effects: ActionEffects): void {
  const project = state.activeProjects[projectIndex];
  if (!project) return;

  let cashMult = 1 + project.contract.negotiatedBonus;
  let xpMult = 1;

  if (project.planned) cashMult *= 1.2;
  if (state.skills.includes('diff_linter')) cashMult *= 1.25;
  if (state.setup.room >= 5) cashMult *= 1.25;
  if (state.skills.includes('prompt_templates')) xpMult *= 1.2;

  for (const buff of state.activeBuffs) {
    if (buff.payoutMult) cashMult *= buff.payoutMult;
  }

  if (project.contract.modifier?.id === 'generous_tip' && state.techDebt < 25) {
    cashMult *= 1.25;
    xpMult *= 1.25;
  }

  const maxDebtPenalty = state.skills.includes('security_audit') ? 0.175 : 0.35;
  const debtPenalty = (state.techDebt / 100) * maxDebtPenalty;
  cashMult *= 1 - debtPenalty;

  const earnedCash = Math.max(10, Math.round(project.contract.baseCash * cashMult));
  const earnedXp = Math.max(5, Math.round(project.contract.baseXp * xpMult));

  state.cash += earnedCash;
  state.totalCashEarned += earnedCash;
  state.xp += earnedXp;
  state.shippedCount += 1;
  state.reputation += project.hallucinationsAccepted === 0 ? 2 : 1;
  state.shipFlashAt = state.timeSec;

  state.activeProjects.splice(projectIndex, 1);
  if (state.selectedProjectIndex >= state.activeProjects.length) {
    state.selectedProjectIndex = Math.max(0, state.activeProjects.length - 1);
  }

  pushLog(
    state,
    `Shipped ${project.contract.projectType} for ${project.contract.clientName} (+$${earnedCash}, +${earnedXp} XP)`,
    'good'
  );
  effects.sfx.push('ship');

  if (state.shippedCount === 1) {
    maybeTriggerStory(state, 'first_ship', effects);
  }
}

function acceptProjectDiff(
  state: GameState,
  projectIndex: number,
  effects: ActionEffects
): void {
  const project = state.activeProjects[projectIndex];
  if (!project || !project.currentDiff) return;

  const diff = project.currentDiff;
  project.currentDiff = null;
  project.diffsCompleted += 1;
  project.promptProgress = 0;

  if (diff.risk === 'hallucination') {
    project.hallucinationsAccepted += 1;
    state.techDebt = Math.min(100, state.techDebt + 12);
    state.xp += 3;
    pushLog(state, `Accepted hallucination in ${diff.filePath} (+12 Debt)`, 'bad');
    effects.sfx.push('hallucination');
  } else if (diff.risk === 'smell') {
    project.smellsAccepted += 1;
    state.techDebt = Math.min(100, state.techDebt + 4);
    state.xp += 5;
    pushLog(state, `Accepted code smell in ${diff.filePath} (+4 Debt)`, 'warn');
    effects.sfx.push('accept');
  } else {
    project.cleanAccepted += 1;
    state.xp += 8;
    effects.sfx.push('accept');
  }

  if (project.diffsCompleted >= project.diffsTotal) {
    completeProject(state, projectIndex, effects);
  }
}

function rejectProjectDiff(
  state: GameState,
  projectIndex: number,
  effects: ActionEffects
): void {
  const project = state.activeProjects[projectIndex];
  if (!project || !project.currentDiff) return;

  const diff = project.currentDiff;
  project.currentDiff = null;
  project.promptProgress = state.skills.includes('git_stash') ? 0.45 : 0.2;

  if (diff.risk === 'hallucination') {
    const debtReduction = state.skills.includes('git_stash') ? 6 : 3;
    state.techDebt = Math.max(0, state.techDebt - debtReduction);
    state.xp += 12;
    pushLog(state, `Caught hallucination in ${diff.filePath}! (-${debtReduction} Debt, +12 XP)`, 'good');
  } else if (diff.risk === 'smell') {
    const debtReduction = state.skills.includes('git_stash') ? 4 : 2;
    state.techDebt = Math.max(0, state.techDebt - debtReduction);
    state.xp += 7;
  } else {
    state.xp += 2;
  }
  effects.sfx.push('reject');
}

function triggerMcbTrip(state: GameState, effects: ActionEffects): void {
  if (state.mcbTripped) return;
  state.mcbTripped = true;
  state.mcbCooldownSec = 2.0;
  state.mcbTripCount += 1;
  pushLog(state, 'MCB TRIPPED! Power out — flip the breaker up!', 'bad');
  effects.sfx.push('mcb_trip');
  if (state.mcbTripCount === 1) {
    maybeTriggerStory(state, 'first_mcb_trip', effects);
  }
}

export function reduceGame(
  prevState: GameState,
  action: GameAction,
  rngArg?: Rng
): { state: GameState; effects: ActionEffects } {
  const state: GameState = cloneState(prevState);
  const rng = rngArg ?? createRng(state.rngState);
  const effects: ActionEffects = { sfx: [] };

  switch (action.type) {
    case 'RESOLVE_MODAL': {
      if (!state.activeModal) break;
      const choice = state.activeModal.choices.find((c) => c.id === action.choiceId);
      if (!choice) break;

      if (choice.cashDelta) {
        state.cash = Math.max(0, state.cash + choice.cashDelta);
        if (choice.cashDelta > 0) state.totalCashEarned += choice.cashDelta;
      }
      if (choice.xpDelta) state.xp = Math.max(0, state.xp + choice.xpDelta);
      if (choice.debtDelta) {
        state.techDebt = Math.max(0, Math.min(100, state.techDebt + choice.debtDelta));
      }
      if (choice.reputationDelta) {
        state.reputation = Math.max(0, state.reputation + choice.reputationDelta);
      }
      if (choice.spawnEmails) {
        for (let i = 0; i < choice.spawnEmails; i++) {
          if (state.inbox.length < getMaxInboxSize(state) + 2) {
            state.inbox.push(generateProjectContract(state, rng));
          }
        }
        effects.sfx.push('email');
      }
      if (choice.buff) {
        state.activeBuffs = [
          ...state.activeBuffs.filter((b) => b.id !== choice.buff!.id),
          { ...choice.buff }
        ];
      }
      state.activeModal = null;
      effects.sfx.push('click');
      if (choice.triggerMcbTrip) {
        triggerMcbTrip(state, effects);
      }
      break;
    }

    case 'FLIP_MCB': {
      if (!state.mcbTripped || state.mcbCooldownSec > 0) break;
      state.mcbTripped = false;
      state.mcbCooldownSec = 0;
      pushLog(state, 'MCB flipped back UP. Power restored!', 'good');
      effects.sfx.push('mcb_restore');
      break;
    }

    case 'ACCEPT_EMAIL': {
      if (state.activeProjects.length >= getMaxActiveProjects(state)) break;
      const idx = state.inbox.findIndex((e) => e.id === action.emailId);
      if (idx === -1) break;
      const [contract] = state.inbox.splice(idx, 1);
      const assigned = getAgentSlots(state) > state.activeProjects.length;
      state.activeProjects.push(createActiveProject(contract, assigned));
      state.selectedProjectIndex = state.activeProjects.length - 1;
      pushLog(state, `Accepted ${contract.projectType} (${contract.clientName})`, 'info');
      effects.sfx.push('click');
      break;
    }

    case 'DISMISS_EMAIL': {
      state.inbox = state.inbox.filter((e) => e.id !== action.emailId);
      effects.sfx.push('click');
      break;
    }

    case 'SELECT_PROJECT': {
      if (action.index >= 0 && action.index < state.activeProjects.length) {
        state.selectedProjectIndex = action.index;
      }
      break;
    }

    case 'PLAN_PROJECT': {
      if (state.mcbTripped || !state.skills.includes('plan_first')) break;
      const project = state.activeProjects[state.selectedProjectIndex];
      if (!project || project.planned) break;

      const step = state.skills.includes('task_breakdown') ? 0.55 : 0.34;
      project.planProgress = Math.min(1, project.planProgress + step);
      state.lastActionAt = state.timeSec;
      effects.sfx.push('click');

      if (project.planProgress >= 1) {
        project.planned = true;
        if (project.contract.modifier?.id === 'vague_brief') {
          project.diffsTotal = Math.max(2, project.diffsTotal - 2);
        }
        if (state.skills.includes('context_hygiene')) {
          project.diffsTotal = Math.max(2, project.diffsTotal - 1);
        }
        state.xp += 10;
        pushLog(state, `Spec finalized for ${project.contract.projectType}! (-45% hallucinations)`, 'good');
      }
      break;
    }

    case 'PROMPT_STEP': {
      if (state.mcbTripped) break;
      const project = state.activeProjects[state.selectedProjectIndex];
      if (!project || project.currentDiff) break;

      const speed = computeSpeedMultiplier(state);
      const planBonus = project.planned && state.skills.includes('context_hygiene') ? 1.25 : 1;
      const increment = 0.28 * Math.min(3.5, speed) * planBonus;
      project.promptProgress = Math.min(1, project.promptProgress + increment);
      state.lastActionAt = state.timeSec;
      state.xp += 1;
      effects.sfx.push('click');

      if (project.promptProgress >= 1) {
        project.currentDiff = generateDiffCard(state, project, rng);
        if (
          state.skills.includes('project_rules') &&
          state.workflowAutoAcceptClean &&
          project.currentDiff.scannedBadge === 'clean' &&
          project.currentDiff.risk === 'clean'
        ) {
          acceptProjectDiff(state, state.selectedProjectIndex, effects);
        }
      }
      break;
    }

    case 'ACCEPT_DIFF': {
      if (state.mcbTripped) break;
      acceptProjectDiff(state, state.selectedProjectIndex, effects);
      state.lastActionAt = state.timeSec;
      break;
    }

    case 'REJECT_DIFF': {
      if (state.mcbTripped) break;
      rejectProjectDiff(state, state.selectedProjectIndex, effects);
      state.lastActionAt = state.timeSec;
      break;
    }

    case 'REFACTOR_DEBT': {
      if (state.mcbTripped || state.techDebt <= 0) break;
      const cost = Math.max(15, Math.round(20 * Math.pow(1.4, state.era - 1)));
      if (state.cash < cost) break;
      state.cash -= cost;
      state.techDebt = Math.max(0, state.techDebt - 20);
      state.xp += 8;
      pushLog(state, `Refactored codebase (-20 Tech Debt, -$${cost})`, 'good');
      effects.sfx.push('upgrade');
      break;
    }

    case 'BUY_SKILL': {
      if (!canUnlockSkill(state, action.skillId)) break;
      const def = getSkillById(action.skillId)!;
      state.xp -= def.xpCost;
      state.skills.push(def.id);
      state.era = computeEra(state);
      pushLog(state, `Unlocked Skill: ${def.name}`, 'good');
      effects.sfx.push('upgrade');

      if (def.id === 'project_rules') {
        state.workflowAutoAcceptClean = true;
      }
      if (def.id === 'hermes_bot') {
        state.botAutoIntake = true;
        maybeTriggerStory(state, 'hermes_connected', effects);
      }
      if (def.id === 'bot_negotiation') {
        state.botAutoNegotiate = true;
      }
      if (def.id === 'autonomous_agent') {
        maybeTriggerStory(state, 'first_agent', effects);
      }
      if (def.id === 'autonomous_saas') {
        state.saasRevenuePerSec = Math.max(state.saasRevenuePerSec, 15 * state.prestigeMultiplier);
        maybeTriggerStory(state, 'software_factory', effects);
      }
      if (def.id === 'self_healing_prod') {
        state.saasRevenuePerSec = Math.round(state.saasRevenuePerSec * 2);
      }
      break;
    }

    case 'BUY_SETUP': {
      const check = canBuySetup(state, action.track);
      if (!check.ok) break;
      state.cash -= check.cost;
      state.setup[action.track] += 1;
      const newTier = getSetupTier(action.track, state.setup[action.track]);
      pushLog(state, `Upgraded ${action.track}: ${newTier.name}`, 'good');
      effects.sfx.push('upgrade');

      if (action.track === 'monitors' && state.setup.monitors === 2) {
        maybeTriggerStory(state, 'second_monitor', effects);
      }
      if (action.track === 'monitors' && state.setup.monitors === 5) {
        maybeTriggerStory(state, 'five_monitors', effects);
      }
      break;
    }

    case 'TOGGLE_BOT_INTAKE': {
      if (!state.skills.includes('hermes_bot')) break;
      state.botAutoIntake = !state.botAutoIntake;
      effects.sfx.push('click');
      break;
    }

    case 'TOGGLE_BOT_NEGOTIATE': {
      if (!state.skills.includes('bot_negotiation')) break;
      state.botAutoNegotiate = !state.botAutoNegotiate;
      effects.sfx.push('click');
      break;
    }

    case 'TOGGLE_WORKFLOW_AUTO': {
      if (!state.skills.includes('project_rules')) break;
      state.workflowAutoAcceptClean = !state.workflowAutoAcceptClean;
      effects.sfx.push('click');
      break;
    }

    case 'PRESTIGE_EXIT': {
      if (!state.skills.includes('zero_touch_deploy')) break;
      const nextPrestigeCount = state.prestigeCount + 1;
      const nextMult = Number((1 + nextPrestigeCount * 0.5).toFixed(2));
      const fresh = createInitialState(rng.getState());
      fresh.prestigeCount = nextPrestigeCount;
      fresh.prestigeMultiplier = nextMult;
      fresh.seenStoryIds = [...state.seenStoryIds];
      fresh.cash = Math.round(50 * nextMult);
      fresh.totalCashEarned = state.totalCashEarned + fresh.cash;
      pushLog(
        fresh,
        `Studio Exit #${nextPrestigeCount}! Starting new venture with ${nextMult}× Cash & XP.`,
        'good'
      );
      effects.sfx.push('story');
      fresh.rngState = rng.getState();
      return { state: fresh, effects };
    }
  }

  state.rngState = rng.getState();
  return { state, effects };
}

export function tickGame(
  prevState: GameState,
  dt: number,
  rngArg?: Rng
): { state: GameState; effects: ActionEffects } {
  const clampedDt = Math.max(0, Math.min(dt, 1.0));
  const state: GameState = cloneState(prevState);
  const rng = rngArg ?? createRng(state.rngState);
  const effects: ActionEffects = { sfx: [] };

  state.timeSec += clampedDt;

  // Tick buffs
  if (state.activeBuffs.length > 0) {
    state.activeBuffs = state.activeBuffs
      .map((b) => ({ ...b, remainingSec: b.remainingSec - clampedDt }))
      .filter((b) => b.remainingSec > 0);
  }

  // MCB cooldown
  if (state.mcbTripped) {
    state.mcbCooldownSec = Math.max(0, state.mcbCooldownSec - clampedDt);
    state.rngState = rng.getState();
    return { state, effects };
  }

  // Pause simulation while modal is open (except clock already ticked gently)
  if (state.activeModal) {
    state.rngState = rng.getState();
    return { state, effects };
  }

  // Power load & MCB trip chance
  const power = computePowerStatus(state);
  if (power.state === 'overload') {
    const tripProbPerSec = 0.25 + (power.loadRatio - 1.0) * 0.9;
    if (rng.chance(Math.min(0.85, tripProbPerSec * clampedDt))) {
      triggerMcbTrip(state, effects);
      state.rngState = rng.getState();
      return { state, effects };
    }
  } else if (power.state === 'warning') {
    const tripProbPerSec = (power.loadRatio - 0.85) * 0.35;
    if (rng.chance(tripProbPerSec * clampedDt)) {
      triggerMcbTrip(state, effects);
      state.rngState = rng.getState();
      return { state, effects };
    }
  }

  // Incoming randomized client emails
  state.nextEmailSec -= clampedDt;
  if (state.nextEmailSec <= 0) {
    const maxInbox = getMaxInboxSize(state);
    if (state.inbox.length < maxInbox) {
      state.inbox.push(generateProjectContract(state, rng));
      effects.sfx.push('email');
    }
    const baseInterval = Math.max(4.5, 13 - state.era * 1.1);
    state.nextEmailSec = baseInterval * (0.75 + rng.next() * 0.5);
  }

  // Hermes / Grok Bot auto-intake & negotiation
  if (state.skills.includes('hermes_bot') && state.botAutoIntake) {
    const maxActive = getMaxActiveProjects(state);
    if (state.activeProjects.length < maxActive && state.inbox.length > 0) {
      // Pick highest value contract
      let bestIdx = 0;
      for (let i = 1; i < state.inbox.length; i++) {
        if (state.inbox[i].baseCash > state.inbox[bestIdx].baseCash) bestIdx = i;
      }
      const [picked] = state.inbox.splice(bestIdx, 1);
      if (state.skills.includes('bot_negotiation') && state.botAutoNegotiate) {
        picked.negotiatedBonus = Number((0.3 + rng.next() * 0.25).toFixed(2));
      }
      const assigned = getAgentSlots(state) > state.activeProjects.length;
      state.activeProjects.push(createActiveProject(picked, assigned));
      state.botPulseAt = state.timeSec;
      pushLog(
        state,
        `Hermes Bot grabbed ${picked.projectType}${
          picked.negotiatedBonus > 0 ? ` (+${Math.round(picked.negotiatedBonus * 100)}% rate)` : ''
        }`,
        'info'
      );
      effects.sfx.push('email');
    }
  }

  // Autonomous Agent / Swarm execution
  const agentsPaused = state.activeBuffs.some((b) => b.pauseAgents);
  const agentSlots = getAgentSlots(state);
  if (agentSlots > 0 && !agentsPaused) {
    const speed = computeSpeedMultiplier(state) * (state.skills.includes('persistent_memory') ? 1.45 : 1);
    const count = Math.min(agentSlots, state.activeProjects.length);

    for (let i = count - 1; i >= 0; i--) {
      const project = state.activeProjects[i];
      if (!project) continue;
      project.assignedToAgent = true;

      // Auto-plan if unlocked
      if (state.skills.includes('plan_first') && !project.planned) {
        project.planProgress = Math.min(1, project.planProgress + clampedDt * 0.75 * speed);
        if (project.planProgress >= 1) {
          project.planned = true;
          if (project.contract.modifier?.id === 'vague_brief') {
            project.diffsTotal = Math.max(2, project.diffsTotal - 2);
          }
          if (state.skills.includes('context_hygiene')) {
            project.diffsTotal = Math.max(2, project.diffsTotal - 1);
          }
        }
        continue;
      }

      if (!project.currentDiff) {
        project.promptProgress = Math.min(1, project.promptProgress + clampedDt * 0.36 * speed);
        if (project.promptProgress >= 1) {
          project.currentDiff = generateDiffCard(state, project, rng);
        }
      }

      if (project.currentDiff) {
        const diff = project.currentDiff;
        const rejectHallucinationChance = state.skills.includes('safe_pipelines')
          ? 0.82
          : state.skills.includes('review_scanner')
            ? 0.65
            : 0.3;
        if (diff.risk === 'hallucination' && rng.chance(rejectHallucinationChance)) {
          rejectProjectDiff(state, i, effects);
        } else {
          acceptProjectDiff(state, i, effects);
        }
      }
    }
  }

  // Passive tech debt scrubbing from Persistent Memory / Self-Healing Prod
  if (state.techDebt > 0) {
    let scrubRate = 0;
    if (state.skills.includes('persistent_memory')) scrubRate += 0.35;
    if (state.skills.includes('self_healing_prod')) scrubRate += 1.5;
    if (scrubRate > 0) {
      state.techDebt = Math.max(0, state.techDebt - scrubRate * clampedDt);
    }
  }

  // Era 7 Software Factory passive SaaS revenue & product spawning
  if (state.skills.includes('autonomous_saas')) {
    const rev = state.saasRevenuePerSec * clampedDt;
    state.cash += rev;
    state.totalCashEarned += rev;
    state.xp += 1.5 * state.prestigeMultiplier * clampedDt;

    state.nextSaasBuildSec -= clampedDt;
    if (state.nextSaasBuildSec <= 0) {
      state.saasProductsBuilt += 1;
      const mrrBoost = (state.skills.includes('self_healing_prod') ? 16 : 8) * state.prestigeMultiplier;
      state.saasRevenuePerSec += mrrBoost;
      state.nextSaasBuildSec = 25;
      pushLog(
        state,
        `Software Factory launched Micro-SaaS #${state.saasProductsBuilt} (+$${Math.round(mrrBoost)}/s)`,
        'good'
      );
      effects.sfx.push('ship');
    }
  }

  // Periodic random events (every 45–90s of active play)
  state.nextRandomEventSec -= clampedDt;
  if (state.nextRandomEventSec <= 0 && state.shippedCount >= 1 && !state.activeModal) {
    state.activeModal = generateRandomEvent(state, rng);
    state.nextRandomEventSec = 45 + rng.next() * 45;
    effects.sfx.push('story');
  }

  state.rngState = rng.getState();
  return { state, effects };
}

export function buildRenderSnapshot(state: GameState): RenderSnapshot {
  const power = computePowerStatus(state);
  const thermal = computeThermalStatus(state);
  const activeAgents = Math.min(getAgentSlots(state), state.activeProjects.length);
  const selected = state.activeProjects[state.selectedProjectIndex];

  return {
    timeSec: state.timeSec,
    era: state.era,
    monitors: state.setup.monitors,
    roomTier: state.setup.room,
    coolingTier: state.setup.cooling,
    computeTier: state.setup.compute,
    powerState: power.state,
    loadRatio: power.loadRatio,
    mcbTripped: state.mcbTripped,
    isTyping:
      !state.mcbTripped &&
      (state.timeSec - state.lastActionAt < 0.8 || activeAgents > 0),
    hasHallucinationDiff: Boolean(selected?.currentDiff?.risk === 'hallucination'),
    hasActiveProject: state.activeProjects.length > 0,
    activeAgents,
    botActive: state.skills.includes('hermes_bot') && state.botAutoIntake,
    botPulseRecent: state.timeSec - state.botPulseAt < 2.4,
    swarmActive: activeAgents >= 2,
    factoryActive: state.skills.includes('autonomous_saas'),
    shipFlashRecent: state.timeSec - state.shipFlashAt < 1.8,
    thermalThrottled: thermal.throttled
  };
}

export function countAffordableSkills(state: GameState): number {
  return SKILLS.filter((s) => canUnlockSkill(state, s.id)).length;
}

export function countAffordableSetup(state: GameState): number {
  const tracks: SetupTrackId[] = ['monitors', 'power', 'room', 'cooling', 'compute'];
  return tracks.filter((t) => canBuySetup(state, t).ok).length;
}

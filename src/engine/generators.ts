import {
  CLIENT_ARCHETYPES,
  DIFF_TEMPLATES,
  PROJECT_MODIFIERS,
  PROJECT_TYPES
} from './catalog';
import type { Rng } from './rng';
import type {
  ActiveProject,
  DiffCard,
  DiffRisk,
  GameEventModal,
  GameState,
  ProjectContract,
  ProjectModifier
} from './types';

let idCounter = 1;

function nextId(prefix: string, rng: Rng): string {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Math.floor(rng.next() * 1e6).toString(36)}`;
}

const SUBJECT_PREFIXES = [
  'Need',
  'Urgent:',
  'Quick build:',
  'Can you vibe-code a',
  'Looking for dev:',
  'Ship our'
] as const;

const BODY_SNIPPETS = [
  'Budget is ready, hoping we can launch before the weekend.',
  'Saw your threads online — can you build this clean and fast?',
  'Our previous freelancer vanished. Need someone who ships.',
  'Nothing fancy, just needs to work smoothly on mobile & desktop.',
  'Investors are asking for a demo link by Friday!'
] as const;

export function generateProjectContract(state: GameState, rng: Rng): ProjectContract {
  const availableClients = CLIENT_ARCHETYPES.filter((c) => c.minEra <= state.era);
  const clientGroup = rng.pick(availableClients);
  const clientName = rng.pick(clientGroup.names);

  const availableTypes = PROJECT_TYPES.filter((t) => t.minEra <= state.era);
  const projType = rng.pick(availableTypes);

  let modifier: ProjectModifier | null = null;
  if (rng.chance(state.era === 1 ? 0.45 : 0.68)) {
    modifier = rng.pick(PROJECT_MODIFIERS);
  }

  const eraMult = Math.pow(1.62, state.era - 1);
  const repMult = 1 + Math.min(2.5, state.reputation * 0.035);
  const prestigeMult = state.prestigeMultiplier;
  const jitter = 0.88 + rng.next() * 0.28;

  const modCash = modifier && modifier.id !== 'generous_tip' ? modifier.cashMult : 1;
  const baseCash = Math.max(
    25,
    Math.round(projType.baseCash * clientGroup.cashScale * eraMult * repMult * modCash * prestigeMult * jitter)
  );

  const baseXp = Math.max(
    10,
    Math.round(projType.baseXp * Math.pow(1.42, state.era - 1) * (1 + state.reputation * 0.015) * prestigeMult)
  );

  const totalDiffs = Math.max(
    2,
    projType.diffs + (state.era >= 5 ? 1 : 0) + (modifier ? modifier.extraDiffsIfUnplanned : 0)
  );

  const prefix = rng.pick(SUBJECT_PREFIXES);
  const subject = `${prefix} ${projType.name}`;
  const body = `${clientName} (${clientGroup.archetype}): ${rng.pick(BODY_SNIPPETS)}`;

  return {
    id: nextId('email', rng),
    clientArchetype: clientGroup.archetype,
    clientName,
    projectType: projType.name,
    subject,
    body,
    modifier,
    era: state.era,
    totalDiffs,
    baseCash,
    baseXp,
    negotiatedBonus: 0,
    receivedAt: state.timeSec
  };
}

export function computeHallucinationProbability(state: GameState, project: ActiveProject): number {
  let chance = 0.34;
  if (project.planned) {
    chance *= 0.55;
  }
  if (project.contract.modifier) {
    chance += project.contract.modifier.hallucinationDelta;
  }
  for (const buff of state.activeBuffs) {
    if (buff.hallucinationDelta) {
      chance += buff.hallucinationDelta;
    }
  }
  if (state.skills.includes('context_hygiene') && project.planned) {
    chance -= 0.05;
  }
  return Math.max(0.04, Math.min(0.75, chance));
}

export function generateDiffCard(
  state: GameState,
  project: ActiveProject,
  rng: Rng
): DiffCard {
  const hallucinationChance = computeHallucinationProbability(state, project);
  const smellChance = Math.max(0.12, 0.28 - (project.planned ? 0.08 : 0));

  const roll = rng.next();
  let risk: DiffRisk = 'clean';
  if (roll < hallucinationChance) {
    risk = 'hallucination';
  } else if (roll < hallucinationChance + smellChance) {
    risk = 'smell';
  }

  const candidates = DIFF_TEMPLATES.filter((t) => t.risk === risk);
  const template = rng.pick(candidates);

  let scannedBadge: DiffRisk | null = null;
  let scanConfidence = 0;

  if (state.skills.includes('review_scanner')) {
    const accuracy = state.skills.includes('diff_linter') ? 0.96 : 0.8;
    scanConfidence = Math.round(accuracy * 100);
    if (rng.chance(accuracy)) {
      scannedBadge = risk;
    } else {
      const otherRisks: DiffRisk[] = (['clean', 'smell', 'hallucination'] as DiffRisk[]).filter(
        (r) => r !== risk
      );
      scannedBadge = rng.pick(otherRisks);
    }
  }

  return {
    id: nextId('diff', rng),
    filePath: template.filePath,
    snippet: template.snippet,
    hint: template.hint,
    risk,
    scannedBadge,
    scanConfidence
  };
}

export function generateRandomEvent(state: GameState, rng: Rng): GameEventModal {
  const pool: Array<{ weight: number; build: () => GameEventModal }> = [
    {
      weight: 2,
      build: () => {
        const surgeCost = Math.max(30, Math.round(state.cash * 0.12 + state.era * 35));
        return {
          id: nextId('evt_rate', rng),
          kind: 'random',
          title: 'API Rate Limit Hit',
          subtitle: '429 Too Many Vibes',
          body: 'Your provider throttled your token bucket right in the middle of a sprint.',
          choices: [
            {
              id: 'throttle',
              label: 'Wait & throttle gently',
              detail: '0.6× speed for 25s, free',
              buff: {
                id: 'rate_throttle',
                label: 'Rate Throttled (0.6×)',
                remainingSec: 25,
                speedMult: 0.6
              }
            },
            {
              id: 'surge',
              label: `Pay surge credits (-$${surgeCost})`,
              detail: '+25% speed for 30s',
              cashDelta: -surgeCost,
              buff: {
                id: 'surge_tier',
                label: 'Priority API (1.25×)',
                remainingSec: 30,
                speedMult: 1.25
              }
            },
            {
              id: 'cheap_model',
              label: 'Switch to chaotic free model',
              detail: '1.35× speed, +20% hallucinations for 30s',
              buff: {
                id: 'chaotic_model',
                label: 'Chaotic Model',
                remainingSec: 30,
                speedMult: 1.35,
                hallucinationDelta: 0.2
              }
            }
          ]
        };
      }
    },
    {
      weight: 2,
      build: () => {
        const fee = Math.max(45, Math.round(65 * Math.pow(1.55, state.era - 1)));
        return {
          id: nextId('evt_button', rng),
          kind: 'random',
          title: 'Client: "Move This Button 2px"',
          subtitle: 'DM at 11:42 PM',
          body: 'A previous client messages you asking for "just one tiny tweak" plus dark mode.',
          choices: [
            {
              id: 'free_fix',
              label: 'Do it free for goodwill',
              detail: '+3 Reputation, +15 XP',
              reputationDelta: 3,
              xpDelta: 15
            },
            {
              id: 'charge_scope',
              label: `Bill scope-creep fee (+$${fee})`,
              detail: `+$${fee} Cash, -1 Reputation`,
              cashDelta: fee,
              reputationDelta: -1
            }
          ]
        };
      }
    },
    {
      weight: 2,
      build: () => ({
        id: nextId('evt_sota', rng),
        kind: 'random',
        title: 'New SOTA Model Dropped!',
        subtitle: 'Timeline is losing its mind',
        body: 'Benchmarks look unreal, though nobody knows if it deletes production tables yet.',
        choices: [
          {
            id: 'adopt_now',
            label: 'Adopt Day-1 Model',
            detail: '2.0× speed, +15% hallucination risk for 35s',
            xpDelta: 25,
            buff: {
              id: 'day1_sota',
              label: 'Day-1 SOTA (2×)',
              remainingSec: 35,
              speedMult: 2.0,
              hallucinationDelta: 0.15
            }
          },
          {
            id: 'stay_stable',
            label: 'Stick to pinned version',
            detail: '-10% hallucination risk & -5 Tech Debt',
            debtDelta: -5,
            buff: {
              id: 'stable_pin',
              label: 'Pinned Stable',
              remainingSec: 35,
              hallucinationDelta: -0.1
            }
          }
        ]
      })
    },
    {
      weight: 2,
      build: () => ({
        id: nextId('evt_pln', rng),
        kind: 'random',
        title: 'PLN Voltage Drop · Heavy Rain',
        subtitle: 'Lights dim across the neighborhood',
        body: 'Thunder rolls outside. Your MCB box hums nervously.',
        choices: [
          {
            id: 'pause_safe',
            label: 'Pause heavy load briefly',
            detail: 'Agents pause 12s, zero trip risk, +20 XP',
            xpDelta: 20,
            buff: {
              id: 'storm_safe',
              label: 'UPS Safe Mode',
              remainingSec: 12,
              pauseAgents: true
            }
          },
          {
            id: 'push_through',
            label: 'Push through the storm',
            detail: '+35% payout for 30s, risks MCB trip',
            triggerMcbTrip: rng.chance(0.45),
            buff: {
              id: 'storm_hustle',
              label: 'Storm Hustle (+35% $)',
              remainingSec: 30,
              payoutMult: 1.35
            }
          }
        ]
      })
    },
    {
      weight: 2,
      build: () => ({
        id: nextId('evt_viral', rng),
        kind: 'random',
        title: 'Your Build Thread Went Viral!',
        subtitle: '4.2K bookmarks in 2 hours',
        body: 'Founders and agencies are flooding your inbox asking to hire your setup.',
        choices: [
          {
            id: 'open_floodgates',
            label: 'Open Inbox Floodgates',
            detail: '+3 fresh contracts & +2 Reputation',
            spawnEmails: 3,
            reputationDelta: 2
          },
          {
            id: 'post_guide',
            label: 'Share workflow breakdown',
            detail: `+${Math.round(35 * Math.pow(1.35, state.era - 1))} XP & +1 contract`,
            xpDelta: Math.round(35 * Math.pow(1.35, state.era - 1)),
            spawnEmails: 1
          }
        ]
      })
    },
    {
      weight: state.techDebt >= 30 ? 4 : 1,
      build: () => {
        const hotfixFine = Math.max(40, Math.round(state.cash * 0.15 + 40));
        return {
          id: nextId('evt_prod', rng),
          kind: 'random',
          title: 'Prod Incident at 2:14 AM',
          subtitle: `Tech Debt: ${Math.round(state.techDebt)}/100`,
          body: 'Pager alert! An old AI diff silently broke webhook retries in production.',
          choices: [
            {
              id: 'proper_refactor',
              label: 'Write proper fix & tests',
              detail: '-18 Tech Debt, +35 XP, 0.7× speed for 20s',
              debtDelta: -18,
              xpDelta: 35,
              buff: {
                id: 'incident_recovery',
                label: 'Postmortem Cleanup',
                remainingSec: 20,
                speedMult: 0.7
              }
            },
            {
              id: 'duct_tape',
              label: `Refund SLA & restart (-$${hotfixFine})`,
              detail: `-$${hotfixFine} Cash, +5 Tech Debt, zero slowdown`,
              cashDelta: -hotfixFine,
              debtDelta: 5
            }
          ]
        };
      }
    }
  ];

  const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
  let pick = rng.next() * totalWeight;
  for (const item of pool) {
    pick -= item.weight;
    if (pick <= 0) return item.build();
  }
  return pool[0].build();
}

export function buildStoryBeat(storyId: string): GameEventModal | null {
  switch (storyId) {
    case 'first_ship':
      return {
        id: 'story_first_ship',
        kind: 'story',
        title: 'First Client Shipped!',
        subtitle: 'Kamar Kos Milestone',
        body: 'Payment just hit your account. The ceiling fan squeaks, your laptop is scorching hot, and you just realized vibe coding can actually pay rent.',
        choices: [
          {
            id: 'continue',
            label: 'Back to shipping (+20 XP)',
            detail: 'Check Skills & Setup tabs to grow your studio',
            xpDelta: 20
          }
        ]
      };
    case 'first_mcb_trip':
      return {
        id: 'story_first_mcb_trip',
        kind: 'story',
        title: 'CETEK! MCB Tripped!',
        subtitle: '450 VA Reality Check',
        body: 'The boarding room plunges into darkness. Too many watts on a 450 VA meter! Flip the breaker back up, and upgrade your PLN VA in Setup before adding more gear.',
        choices: [
          {
            id: 'continue',
            label: 'Got it, upgrade PLN VA (+15 XP)',
            detail: 'Keep load under 85% of VA capacity',
            xpDelta: 15
          }
        ]
      };
    case 'second_monitor':
      return {
        id: 'story_second_monitor',
        kind: 'story',
        title: 'Dual Monitor Awakening',
        subtitle: 'Setup Milestone',
        body: 'Docs on the left, editor on the right. No more Alt-Tabbing every three seconds. Your kos desk is starting to look like a real cockpit.',
        choices: [
          {
            id: 'continue',
            label: 'Nice! (+30 XP)',
            detail: 'Prompt speed & inbox capacity increased',
            xpDelta: 30
          }
        ]
      };
    case 'hermes_connected':
      return {
        id: 'story_hermes_connected',
        kind: 'story',
        title: 'Hermes / Grok Bot Online',
        subtitle: 'Era 4 Milestone',
        body: 'Your webhook is live. Hermes Agent & Grok Bot now monitor incoming client emails, screen specs, and feed your queue automatically.',
        choices: [
          {
            id: 'continue',
            label: 'Toggle Bot ON in Inbox (+60 XP)',
            detail: 'Watch the envelopes fly into your side monitor',
            xpDelta: 60
          }
        ]
      };
    case 'first_agent':
      return {
        id: 'story_first_agent',
        kind: 'story',
        title: 'First Autonomous Agent Deployed',
        subtitle: 'Era 5 Milestone',
        body: 'You lean back with a kopi susu while your background coding agent plans, prompts, reviews, and ships a contract on its own.',
        choices: [
          {
            id: 'continue',
            label: 'Scale to Swarm next (+120 XP)',
            detail: 'Watch wattage & cooling as agents multiply',
            xpDelta: 120
          }
        ]
      };
    case 'five_monitors':
      return {
        id: 'story_five_monitors',
        kind: 'story',
        title: '5-Monitor Command Arc Complete',
        subtitle: 'Hardware Milestone',
        body: 'Five glowing displays wrap around your chair: code, terminal, agent telemetry, inbox stream, and prod metrics. Peak indie engineering.',
        choices: [
          {
            id: 'continue',
            label: 'Behold the glow (+250 XP)',
            detail: 'Max parallel visibility unlocked',
            xpDelta: 250
          }
        ]
      };
    case 'software_factory':
      return {
        id: 'story_software_factory',
        kind: 'story',
        title: 'The Software Factory Awakens',
        subtitle: 'Era 7 Milestone',
        body: 'From a 450 VA kamar kos to a self-healing autonomous Software Factory. Your swarm now launches micro-SaaS products around the clock.',
        choices: [
          {
            id: 'continue',
            label: 'Print passive MRR (+500 XP)',
            detail: 'Unlock Zero-Touch Exit for prestige or play endlessly',
            xpDelta: 500
          }
        ]
      };
    default:
      return null;
  }
}

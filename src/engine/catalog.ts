import type {
  DiffRisk,
  ProjectModifier,
  SetupTierDef,
  SetupTrackId,
  SkillDef
} from './types';

export interface EraDef {
  era: number;
  name: string;
  shortName: string;
  tagline: string;
}

export const ERAS: readonly EraDef[] = [
  {
    era: 1,
    name: 'Kamar Kos & Manual Diff',
    shortName: 'Era 1 · Kos',
    tagline: '450 VA meter, one laptop, manual prompts & diff roulette.'
  },
  {
    era: 2,
    name: 'Belajar Planning',
    shortName: 'Era 2 · Plan',
    tagline: 'Write specs before prompting to slash hallucinations.'
  },
  {
    era: 3,
    name: 'Belajar Code Review',
    shortName: 'Era 3 · Review',
    tagline: 'Lint, scan, and catch cursed diffs before they hit prod.'
  },
  {
    era: 4,
    name: 'Workflow & Bot Intake',
    shortName: 'Era 4 · Workflow',
    tagline: 'Auto-accept clean diffs and wire Hermes / Grok Bot to Inbox.'
  },
  {
    era: 5,
    name: 'Single Autonomous Agent',
    shortName: 'Era 5 · Agent',
    tagline: 'One background coding agent ships contracts end-to-end.'
  },
  {
    era: 6,
    name: 'Swarm of Agents',
    shortName: 'Era 6 · Swarm',
    tagline: 'Parallel Planner, Coder, Reviewer & Ops agents across 5 screens.'
  },
  {
    era: 7,
    name: 'Software Factory',
    shortName: 'Era 7 · Factory',
    tagline: 'Autonomous SaaS factory minting passive MRR around the clock.'
  }
];

export const SKILLS: readonly SkillDef[] = [
  // Era 1
  {
    id: 'better_prompting',
    era: 1,
    name: 'Better Prompting',
    description: '+35% manual prompt progress per tap/Space.',
    xpCost: 15,
    prereqIds: [],
    tag: 'Prompt'
  },
  {
    id: 'git_stash',
    era: 1,
    name: 'Git Stash & Rollback',
    description: 'Rejecting bad diffs reduces extra Tech Debt (-4) and speeds recovery.',
    xpCost: 30,
    prereqIds: ['better_prompting'],
    tag: 'Safety'
  },
  {
    id: 'prompt_templates',
    era: 1,
    name: 'Prompt Templates',
    description: '+20% XP gain and unlocks Era 2 Planning track.',
    xpCost: 50,
    prereqIds: ['better_prompting'],
    tag: 'Era 2'
  },

  // Era 2: Planning
  {
    id: 'plan_first',
    era: 2,
    name: 'Spec Writing (Plan First)',
    description: 'Unlocks Plan First button: cuts hallucinations by 45% and adds +20% cash.',
    xpCost: 85,
    prereqIds: ['prompt_templates'],
    tag: 'Plan'
  },
  {
    id: 'context_hygiene',
    era: 2,
    name: 'Context Hygiene',
    description: 'Planned projects need 1 fewer diff and build +25% faster.',
    xpCost: 130,
    prereqIds: ['plan_first'],
    tag: 'Plan'
  },
  {
    id: 'task_breakdown',
    era: 2,
    name: 'Task Breakdown',
    description: 'Cuts Plan phase effort in half and unlocks Era 3 Code Review.',
    xpCost: 180,
    prereqIds: ['plan_first'],
    tag: 'Era 3'
  },

  // Era 3: Code Review
  {
    id: 'review_scanner',
    era: 3,
    name: 'Review Scanner',
    description: 'Reveals SAFE / SUSPECT / HALLUCINATION badges on diffs (~80% accuracy).',
    xpCost: 240,
    prereqIds: ['task_breakdown'],
    tag: 'Review'
  },
  {
    id: 'diff_linter',
    era: 3,
    name: 'Diff Linter & Test Gen',
    description: 'Boosts scanner accuracy to 96% and adds +25% client payout.',
    xpCost: 330,
    prereqIds: ['review_scanner'],
    tag: 'Review'
  },
  {
    id: 'security_audit',
    era: 3,
    name: 'Security Audit Gate',
    description: 'Halves Tech Debt penalty on payout and unlocks Era 4 Workflow.',
    xpCost: 440,
    prereqIds: ['diff_linter'],
    tag: 'Era 4'
  },

  // Era 4: Workflow & Bot Intake
  {
    id: 'project_rules',
    era: 4,
    name: 'Project Rules & Auto-Accept',
    description: 'Unlocks Workflow toggle: auto-accepts verified SAFE diffs immediately.',
    xpCost: 580,
    prereqIds: ['security_audit'],
    tag: 'Workflow'
  },
  {
    id: 'hermes_bot',
    era: 4,
    name: 'Hermes / Grok Bot Intake',
    description: 'Connects Bot to Inbox to auto-screen & accept contracts (+90W draw when ON).',
    xpCost: 720,
    prereqIds: ['project_rules'],
    tag: 'Bot'
  },
  {
    id: 'safe_pipelines',
    era: 4,
    name: 'CI Auto-Fix Pipeline',
    description: 'Automatically rejects 50% of hallucinations and unlocks Era 5 Autonomous Agent.',
    xpCost: 920,
    prereqIds: ['hermes_bot'],
    tag: 'Era 5'
  },

  // Era 5: Single Autonomous Agent
  {
    id: 'autonomous_agent',
    era: 5,
    name: 'Single Autonomous Agent',
    description: 'Deploys 1 background coding agent that plans, prompts, and ships contracts (+220W).',
    xpCost: 1200,
    prereqIds: ['safe_pipelines'],
    tag: 'Agent'
  },
  {
    id: 'persistent_memory',
    era: 5,
    name: 'Persistent Agent Memory',
    description: 'Autonomous agents work +45% faster and gradually scrub Tech Debt.',
    xpCost: 1600,
    prereqIds: ['autonomous_agent'],
    tag: 'Agent'
  },
  {
    id: 'bot_negotiation',
    era: 5,
    name: 'Bot Rate Negotiation',
    description: 'Hermes/Grok Bot negotiates +30% to +55% higher rates and unlocks Era 6 Swarm.',
    xpCost: 2100,
    prereqIds: ['autonomous_agent'],
    tag: 'Era 6'
  },

  // Era 6: Swarm of Agents
  {
    id: 'swarm_orchestrator',
    era: 6,
    name: 'Swarm Orchestrator',
    description: 'Runs up to 3 parallel autonomous agents (Planner, Coder, Reviewer). Watch cooling & PLN VA!',
    xpCost: 2900,
    prereqIds: ['bot_negotiation'],
    tag: 'Swarm'
  },
  {
    id: 'auto_merge',
    era: 6,
    name: 'Auto Merge Resolver',
    description: 'Expands Swarm capacity up to 5 concurrent projects when Compute & Room allow.',
    xpCost: 4000,
    prereqIds: ['swarm_orchestrator'],
    tag: 'Swarm'
  },
  {
    id: 'prompt_caching',
    era: 6,
    name: 'Prompt Caching Cluster',
    description: 'Cuts agent power draw by 20%, boosts swarm speed +35%, and unlocks Era 7 Factory.',
    xpCost: 5400,
    prereqIds: ['auto_merge'],
    tag: 'Era 7'
  },

  // Era 7: Software Factory
  {
    id: 'autonomous_saas',
    era: 7,
    name: 'Autonomous SaaS Loop',
    description: 'Software Factory ships recurring micro-SaaS products passively every 25s for permanent MRR.',
    xpCost: 7500,
    prereqIds: ['prompt_caching'],
    tag: 'Factory'
  },
  {
    id: 'self_healing_prod',
    era: 7,
    name: 'Self-Healing Production',
    description: 'Continuously auto-refactors Tech Debt and doubles passive SaaS MRR.',
    xpCost: 10500,
    prereqIds: ['autonomous_saas'],
    tag: 'Factory'
  },
  {
    id: 'zero_touch_deploy',
    era: 7,
    name: 'Zero-Touch Studio Exit',
    description: 'Unlocks Studio Exit prestige loop (+50% permanent Cash & XP per exit) + Endless Mode.',
    xpCost: 14000,
    prereqIds: ['self_healing_prod'],
    tag: 'Prestige'
  }
];

export const SETUP_TRACKS: Record<SetupTrackId, readonly SetupTierDef[]> = {
  monitors: [
    {
      level: 1,
      name: '1 Monitor · Old Laptop',
      description: 'Cracked 14" screen. One tab at a time.',
      cost: 0,
      watts: 45
    },
    {
      level: 2,
      name: '2 Monitors · Side Display',
      description: '+20% prompt speed, clearer diff inspection, +1 inbox slot.',
      cost: 120,
      watts: 110
    },
    {
      level: 3,
      name: '3 Monitors · Triple Wraparound',
      description: '+45% prompt speed, dedicated terminal + docs screens, +2 inbox slots.',
      cost: 650,
      watts: 210,
      requiredRoomLevel: 2
    },
    {
      level: 4,
      name: '4 Monitors · Overhead Dashboard',
      description: '+75% prompt speed, live agent telemetry HUD, supports 3 parallel projects.',
      cost: 2800,
      watts: 340,
      requiredRoomLevel: 3
    },
    {
      level: 5,
      name: '5 Monitors · Command Arc',
      description: '+115% prompt speed, full 5-screen software factory cockpit (up to 5 parallel projects).',
      cost: 11000,
      watts: 490,
      requiredRoomLevel: 4
    }
  ],
  power: [
    {
      level: 1,
      name: '450 VA · Kos Subsidi',
      description: 'Safe ceiling ~382 W. Plug in a fan + monitor and pray.',
      cost: 0,
      watts: 0,
      capacityVA: 450
    },
    {
      level: 2,
      name: '900 VA · Token PLN',
      description: 'Safe ceiling ~765 W. Handles dual screens & mid-range PC.',
      cost: 90,
      watts: 0,
      capacityVA: 900
    },
    {
      level: 3,
      name: '1300 VA · Kontrakan',
      description: 'Safe ceiling ~1105 W. Ready for triple screens & bot intake.',
      cost: 320,
      watts: 0,
      capacityVA: 1300
    },
    {
      level: 4,
      name: '2200 VA · Studio Line',
      description: 'Safe ceiling ~1870 W. Stable for AC + autonomous agent.',
      cost: 1100,
      watts: 0,
      capacityVA: 2200
    },
    {
      level: 5,
      name: '3500 VA · Dedicated MCB',
      description: 'Safe ceiling ~2975 W. Powers workstation & early swarm.',
      cost: 3400,
      watts: 0,
      capacityVA: 3500
    },
    {
      level: 6,
      name: '5500 VA · 3-Phase Feed',
      description: 'Safe ceiling ~4675 W. Handles 5 monitors, AC, and Swarm.',
      cost: 9500,
      watts: 0,
      capacityVA: 5500
    },
    {
      level: 7,
      name: '10,000 VA · Factory Bus',
      description: 'Safe ceiling ~8500 W. Full local rack cluster stability.',
      cost: 26000,
      watts: 0,
      capacityVA: 10000
    },
    {
      level: 8,
      name: '16,500 VA · Mini Substation',
      description: 'Safe ceiling ~14,025 W. Zero-trip industrial vibe grid.',
      cost: 68000,
      watts: 0,
      capacityVA: 16500
    }
  ],
  room: [
    {
      level: 1,
      name: 'Kamar Kos 3×3',
      description: 'Floor mattress, cramped desk, max 2 monitors.',
      cost: 0,
      watts: 25
    },
    {
      level: 2,
      name: 'Kontrakan Sederhana',
      description: 'Wider wooden desk, potted plant, unlocks 3 monitors.',
      cost: 420,
      watts: 60
    },
    {
      level: 3,
      name: 'Home Studio',
      description: 'Acoustic foam walls, LED mood strip, unlocks 4 monitors.',
      cost: 2200,
      watts: 130
    },
    {
      level: 4,
      name: 'Mini Server Studio',
      description: 'Dedicated rack corner, glass shelf, unlocks 5 monitors.',
      cost: 8800,
      watts: 240
    },
    {
      level: 5,
      name: 'Software Factory HQ',
      description: 'Command center glass bay, twin server racks, +25% global payout.',
      cost: 32000,
      watts: 420
    }
  ],
  cooling: [
    {
      level: 1,
      name: 'Kipas Kecil',
      description: 'Handles up to 1.5 heat units (basic laptop/PC).',
      cost: 0,
      watts: 35
    },
    {
      level: 2,
      name: 'Standing Fan Turbo',
      description: 'Handles up to 3.2 heat units (keeps 1 autonomous agent cool).',
      cost: 260,
      watts: 75
    },
    {
      level: 3,
      name: 'AC 1/2 PK Inverter',
      description: 'Handles up to 6.5 heat units (prevents Swarm thermal throttling).',
      cost: 1900,
      watts: 420
    },
    {
      level: 4,
      name: 'Dedicated Rack Cooling',
      description: 'Handles up to 14 heat units + 15% agent speed boost.',
      cost: 12500,
      watts: 980
    }
  ],
  compute: [
    {
      level: 1,
      name: 'Laptop Kentang',
      description: '1.0× speed. Fan sounds like a jet engine.',
      cost: 0,
      watts: 65
    },
    {
      level: 2,
      name: 'PC Mid-Range',
      description: '1.35× prompt & agent speed.',
      cost: 380,
      watts: 190
    },
    {
      level: 3,
      name: 'Workstation 64GB',
      description: '1.85× speed, supports up to 3 concurrent projects.',
      cost: 2400,
      watts: 390
    },
    {
      level: 4,
      name: 'Home Mini-Server',
      description: '2.5× speed, supports up to 4 concurrent Swarm slots.',
      cost: 9800,
      watts: 760
    },
    {
      level: 5,
      name: 'Local Rack Cluster',
      description: '3.6× speed, unlocks full 5-slot Software Factory concurrency.',
      cost: 36000,
      watts: 1650
    }
  ]
};

export const PROJECT_MODIFIERS: readonly ProjectModifier[] = [
  {
    id: 'rush_deadline',
    label: 'Rush Deadline',
    description: '+40% cash, higher hallucination risk',
    cashMult: 1.4,
    xpMult: 1.1,
    hallucinationDelta: 0.14,
    extraDiffsIfUnplanned: 0
  },
  {
    id: 'vague_brief',
    label: 'Vague Brief',
    description: '+30% cash, +2 diffs unless Planned',
    cashMult: 1.3,
    xpMult: 1.15,
    hallucinationDelta: 0.06,
    extraDiffsIfUnplanned: 2
  },
  {
    id: 'clean_spec',
    label: 'Clean Spec',
    description: '-30% hallucination chance',
    cashMult: 1.05,
    xpMult: 1.1,
    hallucinationDelta: -0.15,
    extraDiffsIfUnplanned: 0
  },
  {
    id: 'generous_tip',
    label: 'Generous Tip',
    description: '+25% cash & XP if shipped with <25 debt',
    cashMult: 1.25,
    xpMult: 1.25,
    hallucinationDelta: 0,
    extraDiffsIfUnplanned: 0
  }
];

export const CLIENT_ARCHETYPES = [
  {
    archetype: 'Warung / UMKM',
    names: ['Warung Kopi Senja', 'Bakso Mas Eko', 'Laundry Kilat 24J', 'Toko Kue Bu Sari'],
    minEra: 1,
    cashScale: 1.0
  },
  {
    archetype: 'Indie Founder',
    names: ['Raka (IndieHacks)', 'Nadia Ships', 'Budi MicroSaaS', 'Dina SoloDev'],
    minEra: 1,
    cashScale: 1.2
  },
  {
    archetype: 'Creative Agency',
    names: ['Studio Piksel', 'Karya Digital', 'Kopi & Pixel Co.', 'VisualLab ID'],
    minEra: 2,
    cashScale: 1.45
  },
  {
    archetype: 'Seed Startup',
    names: ['KopiChain Labs', 'TaniFlow AI', 'DompetCepat', 'LogistikPro'],
    minEra: 3,
    cashScale: 1.8
  },
  {
    archetype: 'Crypto / AI Bros',
    names: ['0xVibeDAO', 'HyperAgent.xyz', 'MoonPrompt Capital', 'DeFi Noodle'],
    minEra: 4,
    cashScale: 2.25
  },
  {
    archetype: 'Enterprise Corp',
    names: ['PT Nusantara Global', 'MegaBank Digital', 'IndoCloud Logistics', 'Apex FinTech'],
    minEra: 5,
    cashScale: 2.9
  }
] as const;

export const PROJECT_TYPES = [
  { name: 'Landing Page', diffs: 3, baseCash: 42, baseXp: 16, minEra: 1 },
  { name: 'WhatsApp / Telegram Bot', diffs: 4, baseCash: 64, baseXp: 24, minEra: 1 },
  { name: 'Admin Dashboard', diffs: 5, baseCash: 95, baseXp: 36, minEra: 2 },
  { name: 'AI Wrapper App', diffs: 5, baseCash: 135, baseXp: 48, minEra: 2 },
  { name: 'SaaS MVP', diffs: 6, baseCash: 210, baseXp: 72, minEra: 3 },
  { name: 'Legacy Refactor', diffs: 7, baseCash: 295, baseXp: 95, minEra: 4 }
] as const;

export interface DiffTemplate {
  filePath: string;
  snippet: string;
  hint: string;
  risk: DiffRisk;
}

export const DIFF_TEMPLATES: readonly DiffTemplate[] = [
  // Clean diffs
  {
    filePath: 'src/routes/checkout.ts',
    snippet: '+ const total = items.reduce((s, i) => s + i.price * i.qty, 0);',
    hint: 'Typed reducer with zero side effects.',
    risk: 'clean'
  },
  {
    filePath: 'src/lib/validation.ts',
    snippet: '+ export const emailSchema = z.string().email().max(120);',
    hint: 'Clean schema guard on user input.',
    risk: 'clean'
  },
  {
    filePath: 'src/components/OrderRow.svelte',
    snippet: '+ <span class="badge">{formatRupiah(order.amount)}</span>',
    hint: 'Escaped template binding, pure formatter.',
    risk: 'clean'
  },
  {
    filePath: 'tests/billing.test.ts',
    snippet: '+ expect(calcTax(100_000, 0.11)).toBe(11_000);',
    hint: 'Unit test covers edge rounding cleanly.',
    risk: 'clean'
  },
  {
    filePath: 'src/api/webhook.ts',
    snippet: '+ if (!verifyHmac(sig, rawBody, secret)) return 401;',
    hint: 'Constant-time signature verification added.',
    risk: 'clean'
  },
  {
    filePath: 'src/db/queries.ts',
    snippet: '+ return db.query("SELECT id, name FROM users WHERE id = $1", [id]);',
    hint: 'Parameterized query with explicit columns.',
    risk: 'clean'
  },

  // Smell diffs
  {
    filePath: 'src/auth/session.ts',
    snippet: '+ // TODO: fix token expiry later, trust me bro\n+ const TTL = 99999999;',
    hint: 'Comment looks suspiciously optimistic...',
    risk: 'smell'
  },
  {
    filePath: 'src/styles/layout.css',
    snippet: '+ .modal { z-index: 9999999 !important; margin-left: -3px; }',
    hint: 'Magic pixel offset with nuclear z-index.',
    risk: 'smell'
  },
  {
    filePath: 'src/utils/retry.ts',
    snippet: '+ catch (e) { console.log("it is fine"); return null as any; }',
    hint: 'Swallows error and casts to any.',
    risk: 'smell'
  },
  {
    filePath: 'package.json',
    snippet: '+ "left-pad-ai-pro": "^0.0.1-alpha", "is-even-llm": "^2.4.0"',
    hint: 'Adds questionable micro-dependencies.',
    risk: 'smell'
  },
  {
    filePath: 'src/hooks/usePoll.ts',
    snippet: '+ setInterval(() => fetchAllUsers(), 100); // snappy!',
    hint: '100ms polling interval on full table.',
    risk: 'smell'
  },

  // Hallucination diffs
  {
    filePath: 'src/api/pay.ts',
    snippet: '+ const finalPrice = 0; // discount bug fixed!\n+ await chargeCard(user, finalPrice);',
    hint: 'Wait... did it just make everything free?!',
    risk: 'hallucination'
  },
  {
    filePath: 'src/db/migrate.ts',
    snippet: '+ await sql`DROP TABLE IF EXISTS orders CASCADE;`; // fresh start',
    hint: 'Destructive DROP TABLE inside hotfix.',
    risk: 'hallucination'
  },
  {
    filePath: 'src/lib/quantumAuth.ts',
    snippet: '+ import { verifySoul } from "react-magic-2099";\n+ return verifySoul(req);',
    hint: 'Imports a package that does not exist.',
    risk: 'hallucination'
  },
  {
    filePath: 'src/server/cache.ts',
    snippet: '+ while (true) { cache.push(Buffer.alloc(64_000_000)); }',
    hint: 'Infinite loop allocating 64MB buffers.',
    risk: 'hallucination'
  },
  {
    filePath: 'src/config/keys.ts',
    snippet: '+ export const ADMIN_BYPASS = req.query.please === "1";',
    hint: 'Backdoor auth bypass on query param.',
    risk: 'hallucination'
  }
];

export function getSkillById(id: string): SkillDef | undefined {
  return SKILLS.find((s) => s.id === id);
}

export function getSetupTier(track: SetupTrackId, level: number): SetupTierDef {
  const tiers = SETUP_TRACKS[track];
  return tiers[Math.max(0, Math.min(tiers.length - 1, level - 1))];
}

export function getNextSetupTier(track: SetupTrackId, level: number): SetupTierDef | null {
  const tiers = SETUP_TRACKS[track];
  return level < tiers.length ? tiers[level] : null;
}

export function getEraDef(era: number): EraDef {
  return ERAS[Math.max(0, Math.min(ERAS.length - 1, era - 1))];
}

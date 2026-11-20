export type TabId = 'work' | 'inbox' | 'skills' | 'setup';

export type DiffRisk = 'clean' | 'smell' | 'hallucination';

export type ProjectModifierId =
  | 'rush_deadline'
  | 'vague_brief'
  | 'clean_spec'
  | 'generous_tip';

export interface ProjectModifier {
  id: ProjectModifierId;
  label: string;
  description: string;
  cashMult: number;
  xpMult: number;
  hallucinationDelta: number;
  extraDiffsIfUnplanned: number;
}

export interface DiffCard {
  id: string;
  filePath: string;
  snippet: string;
  hint: string;
  risk: DiffRisk;
  scannedBadge: DiffRisk | null;
  scanConfidence: number;
}

export interface ProjectContract {
  id: string;
  clientArchetype: string;
  clientName: string;
  projectType: string;
  subject: string;
  body: string;
  modifier: ProjectModifier | null;
  era: number;
  totalDiffs: number;
  baseCash: number;
  baseXp: number;
  negotiatedBonus: number;
  receivedAt: number;
}

export interface ActiveProject {
  contract: ProjectContract;
  planned: boolean;
  planProgress: number;
  diffsCompleted: number;
  diffsTotal: number;
  promptProgress: number;
  currentDiff: DiffCard | null;
  hallucinationsAccepted: number;
  smellsAccepted: number;
  cleanAccepted: number;
  assignedToAgent: boolean;
}

export interface SkillDef {
  id: string;
  era: number;
  name: string;
  description: string;
  xpCost: number;
  prereqIds: string[];
  tag: string;
}

export type SetupTrackId = 'monitors' | 'power' | 'room' | 'cooling' | 'compute';

export interface SetupTierDef {
  level: number;
  name: string;
  description: string;
  cost: number;
  watts: number;
  capacityVA?: number;
  requiredRoomLevel?: number;
  requiredEra?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  detail: string;
  cashDelta?: number;
  xpDelta?: number;
  debtDelta?: number;
  reputationDelta?: number;
  spawnEmails?: number;
  triggerMcbTrip?: boolean;
  buff?: ActiveBuff;
}

export interface ActiveBuff {
  id: string;
  label: string;
  remainingSec: number;
  speedMult?: number;
  hallucinationDelta?: number;
  payoutMult?: number;
  pauseAgents?: boolean;
}

export interface GameEventModal {
  id: string;
  kind: 'story' | 'random';
  title: string;
  subtitle: string;
  body: string;
  choices: EventChoice[];
}

export interface OfflineSummary {
  elapsedSec: number;
  cashEarned: number;
  xpEarned: number;
  projectsShipped: number;
  saasEarned: number;
}

export interface SetupLevels {
  monitors: number;
  power: number;
  room: number;
  cooling: number;
  compute: number;
}

export interface PowerStatus {
  usedW: number;
  capacityVA: number;
  safeW: number;
  loadRatio: number;
  state: 'normal' | 'warning' | 'overload' | 'tripped';
}

export interface ThermalStatus {
  heatLoad: number;
  coolingCapacity: number;
  throttled: boolean;
  speedMult: number;
}

export interface GameLogEntry {
  id: string;
  text: string;
  tone: 'info' | 'good' | 'warn' | 'bad';
  time: number;
}

export interface GameState {
  version: number;
  rngState: number;
  timeSec: number;
  lastSavedAt: number;

  cash: number;
  totalCashEarned: number;
  xp: number;
  techDebt: number;
  reputation: number;
  shippedCount: number;
  prestigeCount: number;
  prestigeMultiplier: number;

  era: number;
  setup: SetupLevels;
  skills: string[];

  mcbTripped: boolean;
  mcbCooldownSec: number;
  mcbTripCount: number;

  inbox: ProjectContract[];
  activeProjects: ActiveProject[];
  selectedProjectIndex: number;

  botAutoIntake: boolean;
  botAutoNegotiate: boolean;
  workflowAutoAcceptClean: boolean;
  saasRevenuePerSec: number;
  saasProductsBuilt: number;

  activeBuffs: ActiveBuff[];
  activeModal: GameEventModal | null;
  seenStoryIds: string[];
  nextRandomEventSec: number;
  nextEmailSec: number;
  nextSaasBuildSec: number;

  lastActionAt: number;
  botPulseAt: number;
  shipFlashAt: number;
  recentLogs: GameLogEntry[];
}

export type GameAction =
  | { type: 'ACCEPT_EMAIL'; emailId: string }
  | { type: 'DISMISS_EMAIL'; emailId: string }
  | { type: 'SELECT_PROJECT'; index: number }
  | { type: 'PLAN_PROJECT' }
  | { type: 'PROMPT_STEP' }
  | { type: 'ACCEPT_DIFF' }
  | { type: 'REJECT_DIFF' }
  | { type: 'REFACTOR_DEBT' }
  | { type: 'FLIP_MCB' }
  | { type: 'BUY_SKILL'; skillId: string }
  | { type: 'BUY_SETUP'; track: SetupTrackId }
  | { type: 'TOGGLE_BOT_INTAKE' }
  | { type: 'TOGGLE_BOT_NEGOTIATE' }
  | { type: 'TOGGLE_WORKFLOW_AUTO' }
  | { type: 'RESOLVE_MODAL'; choiceId: string }
  | { type: 'PRESTIGE_EXIT' };

export interface ActionEffects {
  sfx: Array<
    | 'click'
    | 'accept'
    | 'reject'
    | 'hallucination'
    | 'ship'
    | 'mcb_trip'
    | 'mcb_restore'
    | 'upgrade'
    | 'email'
    | 'story'
  >;
}

export interface RenderSnapshot {
  timeSec: number;
  era: number;
  monitors: number;
  roomTier: number;
  coolingTier: number;
  computeTier: number;
  powerState: PowerStatus['state'];
  loadRatio: number;
  mcbTripped: boolean;
  isTyping: boolean;
  hasHallucinationDiff: boolean;
  hasActiveProject: boolean;
  activeAgents: number;
  botActive: boolean;
  botPulseRecent: boolean;
  swarmActive: boolean;
  factoryActive: boolean;
  shipFlashRecent: boolean;
  thermalThrottled: boolean;
}

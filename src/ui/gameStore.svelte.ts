import { sfx } from '../audio/sfx';
import {
  buildRenderSnapshot,
  computePowerStatus,
  computeSpeedMultiplier,
  computeThermalStatus,
  countAffordableSetup,
  countAffordableSkills,
  createInitialState,
  getAgentSlots,
  getMaxActiveProjects,
  reduceGame,
  tickGame
} from '../engine/simulation';
import {
  deserializeState,
  loadFromStorage,
  saveToStorage,
  serializeState
} from '../engine/storage';
import type {
  ActionEffects,
  GameAction,
  GameState,
  OfflineSummary,
  TabId
} from '../engine/types';

export type SimSpeed = 1 | 2 | 5;

class GameStore {
  state = $state.raw<GameState>(createInitialState());
  activeTab = $state<TabId>('work');
  muted = $state<boolean>(false);
  settingsOpen = $state<boolean>(false);
  offlineSummary = $state<OfflineSummary | null>(null);
  listFocusIndex = $state<number>(0);
  simSpeed = $state<SimSpeed>(1);

  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private saveHandle: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  power = $derived(computePowerStatus(this.state));
  thermal = $derived(computeThermalStatus(this.state));
  speedMult = $derived(computeSpeedMultiplier(this.state));
  agentSlots = $derived(getAgentSlots(this.state));
  maxActiveProjects = $derived(getMaxActiveProjects(this.state));
  affordableSkills = $derived(countAffordableSkills(this.state));
  affordableSetup = $derived(countAffordableSetup(this.state));
  renderSnapshot = $derived(buildRenderSnapshot(this.state));

  start(): () => void {
    if (!this.initialized) {
      const loaded = loadFromStorage();
      this.state = loaded.state;
      this.offlineSummary = loaded.summary;
      this.initialized = true;
    }

    if (this.tickHandle) clearInterval(this.tickHandle);
    this.tickHandle = setInterval(() => {
      const steps = this.simSpeed;
      for (let i = 0; i < steps; i++) {
        const { state, effects } = tickGame(this.state, 0.1);
        this.state = state;
        this.playEffects(effects);
        if (state.activeModal || state.mcbTripped) break;
      }
    }, 100);

    if (this.saveHandle) clearInterval(this.saveHandle);
    this.saveHandle = setInterval(() => {
      saveToStorage(this.state);
    }, 10000);

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        saveToStorage(this.state);
      }
    };
    const onBeforeUnload = () => {
      saveToStorage(this.state);
    };

    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      if (this.tickHandle) clearInterval(this.tickHandle);
      if (this.saveHandle) clearInterval(this.saveHandle);
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      saveToStorage(this.state);
    };
  }

  dispatch(action: GameAction): void {
    const { state, effects } = reduceGame(this.state, action);
    this.state = state;
    this.playEffects(effects);
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
    this.listFocusIndex = 0;
  }

  cycleTab(delta: number): void {
    const tabs: TabId[] = ['work', 'inbox', 'skills', 'setup'];
    const idx = tabs.indexOf(this.activeTab);
    const next = (idx + delta + tabs.length) % tabs.length;
    this.setTab(tabs[next]);
  }

  toggleMute(): void {
    this.muted = sfx.toggleMute();
  }

  cycleSimSpeed(): void {
    const order: SimSpeed[] = [1, 2, 5];
    const next = order[(order.indexOf(this.simSpeed) + 1) % order.length];
    this.simSpeed = next;
    sfx.play('click');
  }

  setSimSpeed(speed: SimSpeed): void {
    this.simSpeed = speed;
  }

  dismissOfflineSummary(): void {
    this.offlineSummary = null;
  }

  exportSave(): string {
    return serializeState(this.state);
  }

  importSave(raw: string): boolean {
    const res = deserializeState(raw);
    if (res.recoveredFromError) return false;
    this.state = res.state;
    this.offlineSummary = null;
    saveToStorage(this.state);
    return true;
  }

  resetSave(): void {
    this.state = createInitialState();
    this.offlineSummary = null;
    this.activeTab = 'work';
    saveToStorage(this.state);
  }

  private playEffects(effects: ActionEffects): void {
    for (const s of effects.sfx) {
      sfx.play(s);
    }
  }
}

export const gameStore = new GameStore();

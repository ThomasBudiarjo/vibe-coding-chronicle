<script lang="ts">
  import { getEraDef } from '../../engine/catalog';
  import { gameStore } from '../gameStore.svelte';

  const eraDef = $derived(getEraDef(gameStore.state.era));
  const loadPct = $derived(Math.min(130, Math.round(gameStore.power.loadRatio * 100)));

  function fmtNum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
    return Math.floor(n).toLocaleString();
  }
</script>

<header class="topbar">
  <div class="row-top">
    <div class="era-pill" title={eraDef.tagline}>
      <span class="era-dot"></span>
      <span>{eraDef.shortName}</span>
      {#if gameStore.state.prestigeCount > 0}
        <span class="prestige-tag">×{gameStore.state.prestigeMultiplier}</span>
      {/if}
    </div>

    <div class="top-actions">
      <button
        type="button"
        class="icon-btn"
        title="Toggle Audio (M)"
        aria-label="Toggle audio mute"
        onclick={() => gameStore.toggleMute()}
      >
        {gameStore.muted ? '🔇' : '🔊'}
      </button>
      <button
        type="button"
        class="icon-btn"
        title="Settings & Save"
        aria-label="Open settings"
        onclick={() => (gameStore.settingsOpen = true)}
      >
        ⚙
      </button>
    </div>
  </div>

  <div class="metrics">
    <div class="metric">
      <span class="label">CASH</span>
      <span class="val cash">${fmtNum(gameStore.state.cash)}</span>
    </div>

    <div class="metric">
      <span class="label">VIBE XP</span>
      <span class="val xp">{fmtNum(gameStore.state.xp)}</span>
    </div>

    <div class="metric power-metric">
      <div class="power-head">
        <span class="label">POWER</span>
        <span class="val power-val" data-state={gameStore.power.state}>
          {#if gameStore.power.state === 'tripped'}
            TRIPPED!
          {:else}
            {gameStore.power.usedW}W / {gameStore.power.capacityVA}VA
          {/if}
        </span>
      </div>
      <div class="power-bar">
        <div
          class="power-fill"
          data-state={gameStore.power.state}
          style:width={`${Math.min(100, loadPct)}%`}
        ></div>
      </div>
    </div>

    <div class="metric">
      <span class="label">DEBT</span>
      <span
        class="val debt"
        class:debt-high={gameStore.state.techDebt >= 50}
        class:debt-med={gameStore.state.techDebt >= 20 && gameStore.state.techDebt < 50}
      >
        {Math.round(gameStore.state.techDebt)}%
      </span>
    </div>
  </div>
</header>

<style>
  .topbar {
    padding: 8px 10px 6px;
    background: linear-gradient(180deg, #131a2b 0%, #0d1220 100%);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .row-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .era-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: #e2e8f0;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.28);
    padding: 3px 9px;
    border-radius: 999px;
  }

  .era-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-cyan);
    box-shadow: 0 0 8px var(--accent-cyan);
  }

  .prestige-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--accent-amber);
    margin-left: 2px;
  }

  .top-actions {
    display: flex;
    gap: 6px;
  }

  .icon-btn {
    width: 28px;
    height: 26px;
    border-radius: 7px;
    border: 1px solid var(--border-subtle);
    background: rgba(30, 41, 59, 0.7);
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover {
    background: rgba(51, 65, 85, 0.85);
  }

  .metrics {
    display: grid;
    grid-template-columns: 1fr 0.9fr 1.6fr 0.72fr;
    gap: 6px;
    align-items: center;
  }

  .metric {
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-dim);
  }

  .val {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cash {
    color: var(--accent-emerald);
  }

  .xp {
    color: var(--accent-violet);
  }

  .debt {
    color: var(--text-main);
  }

  .debt-med {
    color: var(--accent-amber);
  }

  .debt-high {
    color: var(--accent-rose);
  }

  .power-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px;
  }

  .power-val {
    font-size: 10px;
  }

  .power-val[data-state='normal'] {
    color: var(--accent-emerald);
  }

  .power-val[data-state='warning'] {
    color: var(--accent-amber);
  }

  .power-val[data-state='overload'],
  .power-val[data-state='tripped'] {
    color: var(--accent-rose);
  }

  .power-bar {
    height: 4px;
    margin-top: 3px;
    background: rgba(148, 163, 184, 0.16);
    border-radius: 999px;
    overflow: hidden;
  }

  .power-fill {
    height: 100%;
    transition: width 120ms linear;
  }

  .power-fill[data-state='normal'] {
    background: var(--accent-emerald);
  }

  .power-fill[data-state='warning'] {
    background: var(--accent-amber);
  }

  .power-fill[data-state='overload'],
  .power-fill[data-state='tripped'] {
    background: var(--accent-rose);
  }
</style>

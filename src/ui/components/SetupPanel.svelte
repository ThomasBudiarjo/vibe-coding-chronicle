<script lang="ts">
  import { getNextSetupTier, getSetupTier, SETUP_TRACKS } from '../../engine/catalog';
  import { canBuySetup } from '../../engine/simulation';
  import type { SetupTrackId } from '../../engine/types';
  import { gameStore } from '../gameStore.svelte';

  const TRACK_META: Array<{ id: SetupTrackId; label: string; icon: string }> = [
    { id: 'monitors', label: 'Monitors', icon: '🖥' },
    { id: 'power', label: 'Daya Listrik (PLN VA)', icon: '⚡' },
    { id: 'room', label: 'Room Tier', icon: '🏠' },
    { id: 'cooling', label: 'Cooling', icon: '❄' },
    { id: 'compute', label: 'Compute Rig', icon: '💻' }
  ];
</script>

<div class="setup-panel scroll-thin">
  <div class="panel-head">
    <div>
      <h3>Physical Setup</h3>
      <span class="sub">
        Power {gameStore.power.usedW}W / Safe {gameStore.power.safeW}W · Heat {gameStore.thermal.heatLoad}/{gameStore.thermal.coolingCapacity}
      </span>
    </div>
    <span class="kbd">↑/↓ + Enter</span>
  </div>

  <div class="track-list">
    {#each TRACK_META as meta, idx (meta.id)}
      {@const level = gameStore.state.setup[meta.id]}
      {@const maxLevel = SETUP_TRACKS[meta.id].length}
      {@const current = getSetupTier(meta.id, level)}
      {@const next = getNextSetupTier(meta.id, level)}
      {@const check = canBuySetup(gameStore.state, meta.id)}

      <div class="track-card" class:focused={idx === gameStore.listFocusIndex}>
        <div class="track-top">
          <div class="track-title">
            <span>{meta.icon}</span>
            <strong>{meta.label}</strong>
            <span class="lvl-pill">Lv {level}/{maxLevel}</span>
          </div>
          {#if meta.id === 'power'}
            <span class="watt-pill">{current.capacityVA} VA</span>
          {:else}
            <span class="watt-pill">{current.watts}W</span>
          {/if}
        </div>

        <div class="current-name">{current.name}</div>

        {#if next}
          <div class="next-box">
            <div class="next-info">
              <div class="next-name">
                Next: <strong>{next.name}</strong>
                {#if meta.id !== 'power'}
                  <span class="delta-w">(+{next.watts - current.watts}W)</span>
                {/if}
              </div>
              <p class="next-desc">{next.description}</p>
            </div>
            <button
              type="button"
              class="upgrade-btn"
              disabled={!check.ok}
              title={check.reason ?? ''}
              onclick={() => gameStore.dispatch({ type: 'BUY_SETUP', track: meta.id })}
            >
              {#if check.reason && check.reason.startsWith('Needs')}
                {check.reason}
              {:else}
                ${next.cost.toLocaleString()}
              {/if}
            </button>
          </div>
        {:else}
          <div class="maxed-line">MAX TIER REACHED</div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .setup-panel {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-head h3 {
    margin: 0;
    font-size: 14px;
  }

  .sub {
    font-size: 11px;
    color: var(--text-muted);
  }

  .track-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .track-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 9px 11px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .track-card.focused {
    border-color: var(--accent-cyan);
  }

  .track-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }

  .track-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .lvl-pill {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 5px;
    background: rgba(148, 163, 184, 0.14);
    color: #cbd5e1;
  }

  .watt-pill {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--accent-amber);
  }

  .current-name {
    font-size: 11px;
    color: var(--accent-cyan);
    font-weight: 600;
  }

  .next-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid rgba(148, 163, 184, 0.12);
  }

  .next-info {
    min-width: 0;
  }

  .next-name {
    font-size: 11px;
    color: #e2e8f0;
  }

  .delta-w {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--accent-amber);
    margin-left: 3px;
  }

  .next-desc {
    margin: 2px 0 0;
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.35;
  }

  .upgrade-btn {
    padding: 6px 11px;
    border-radius: 8px;
    border: 1px solid rgba(52, 211, 153, 0.45);
    background: #059669;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
  }

  .maxed-line {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: var(--accent-emerald);
    padding-top: 3px;
  }
</style>

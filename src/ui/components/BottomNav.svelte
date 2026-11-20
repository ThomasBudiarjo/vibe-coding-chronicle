<script lang="ts">
  import type { TabId } from '../../engine/types';
  import { gameStore } from '../gameStore.svelte';

  const TABS: Array<{ id: TabId; label: string; key: string; icon: string }> = [
    { id: 'work', label: 'Work', key: '1', icon: '⌨' },
    { id: 'inbox', label: 'Inbox', key: '2', icon: '✉' },
    { id: 'skills', label: 'Skills', key: '3', icon: '✦' },
    { id: 'setup', label: 'Setup', key: '4', icon: '🖥' }
  ];

  function getBadge(id: TabId): number {
    if (id === 'inbox') return gameStore.state.inbox.length;
    if (id === 'skills') return gameStore.affordableSkills;
    if (id === 'setup') return gameStore.affordableSetup;
    if (id === 'work' && gameStore.state.mcbTripped) return 1;
    return 0;
  }
</script>

<nav class="bottom-nav" aria-label="Primary tabs">
  {#each TABS as tab (tab.id)}
    {@const badge = getBadge(tab.id)}
    <button
      type="button"
      class="nav-btn"
      class:active={gameStore.activeTab === tab.id}
      onclick={() => gameStore.setTab(tab.id)}
    >
      <span class="nav-icon">{tab.icon}</span>
      <span class="nav-label">
        {tab.label}
        <span class="kbd">{tab.key}</span>
      </span>
      {#if badge > 0}
        <span
          class="nav-badge"
          class:alert={tab.id === 'work' && gameStore.state.mcbTripped}
        >
          {badge}
        </span>
      {/if}
    </button>
  {/each}
</nav>

<style>
  .bottom-nav {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    padding: 7px 8px calc(7px + env(safe-area-inset-bottom, 0px));
    background: #0d1220;
    border-top: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  .nav-btn {
    position: relative;
    padding: 7px 4px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: rgba(15, 23, 42, 0.55);
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
  }

  .nav-btn.active {
    background: rgba(56, 189, 248, 0.16);
    border-color: rgba(56, 189, 248, 0.45);
    color: #f8fafc;
  }

  .nav-icon {
    font-size: 14px;
    line-height: 1;
  }

  .nav-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .nav-badge {
    position: absolute;
    top: 3px;
    right: 5px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--accent-cyan);
    color: #050811;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .nav-badge.alert {
    background: var(--accent-rose);
    color: #fff;
  }
</style>

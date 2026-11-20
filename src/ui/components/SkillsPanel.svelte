<script lang="ts">
  import { ERAS, SKILLS } from '../../engine/catalog';
  import { canUnlockSkill } from '../../engine/simulation';
  import { gameStore } from '../gameStore.svelte';

  const visibleSkills = $derived(
    SKILLS.filter((s) => s.era <= Math.min(7, gameStore.state.era + 1))
  );

  function prereqsMet(prereqIds: string[]): boolean {
    return prereqIds.every((id) => gameStore.state.skills.includes(id));
  }
</script>

<div class="skills-panel scroll-thin">
  <div class="panel-head">
    <div>
      <h3>Engineering Skills</h3>
      <span class="sub">
        {gameStore.state.skills.length}/{SKILLS.length} unlocked · {Math.floor(gameStore.state.xp)} XP available
      </span>
    </div>
    <span class="kbd">↑/↓ + Enter</span>
  </div>

  <div class="skill-list">
    {#each visibleSkills as skill, idx (skill.id)}
      {@const owned = gameStore.state.skills.includes(skill.id)}
      {@const unlocked = prereqsMet(skill.prereqIds)}
      {@const affordable = canUnlockSkill(gameStore.state, skill.id)}
      {@const eraLabel = ERAS[skill.era - 1]?.shortName ?? `Era ${skill.era}`}

      <div
        class="skill-card"
        class:owned
        class:locked={!unlocked && !owned}
        class:focused={idx === gameStore.listFocusIndex}
      >
        <div class="skill-top">
          <div class="skill-title">
            <span class="era-tag">{eraLabel}</span>
            <strong>{skill.name}</strong>
          </div>
          <span class="tag-chip">{skill.tag}</span>
        </div>

        <p class="skill-desc">{skill.description}</p>

        <div class="skill-foot">
          {#if owned}
            <span class="owned-badge">UNLOCKED</span>
          {:else if !unlocked}
            <span class="locked-note">Requires previous skill</span>
          {:else}
            <button
              type="button"
              class="buy-btn"
              disabled={!affordable}
              onclick={() => gameStore.dispatch({ type: 'BUY_SKILL', skillId: skill.id })}
            >
              Unlock · {skill.xpCost} XP
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .skills-panel {
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

  .skill-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .skill-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 9px 11px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .skill-card.owned {
    border-color: rgba(52, 211, 153, 0.35);
    background: rgba(16, 185, 129, 0.08);
  }

  .skill-card.locked {
    opacity: 0.58;
  }

  .skill-card.focused {
    border-color: var(--accent-violet);
  }

  .skill-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }

  .skill-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .era-tag {
    font-family: var(--font-mono);
    font-size: 9px;
    padding: 2px 5px;
    border-radius: 4px;
    background: rgba(56, 189, 248, 0.14);
    color: #7dd3fc;
    white-space: nowrap;
  }

  .tag-chip {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--accent-violet);
  }

  .skill-desc {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.38;
  }

  .skill-foot {
    display: flex;
    justify-content: flex-end;
    margin-top: 2px;
  }

  .owned-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: var(--accent-emerald);
  }

  .locked-note {
    font-size: 10px;
    color: var(--text-dim);
  }

  .buy-btn {
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid rgba(167, 139, 250, 0.5);
    background: #6d28d9;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
  }
</style>

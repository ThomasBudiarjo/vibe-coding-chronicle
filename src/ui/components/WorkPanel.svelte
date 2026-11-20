<script lang="ts">
  import { gameStore } from '../gameStore.svelte';

  const activeList = $derived(gameStore.state.activeProjects);
  const project = $derived(activeList[gameStore.state.selectedProjectIndex] ?? null);
  const canPlan = $derived(
    Boolean(project && !project.planned && gameStore.state.skills.includes('plan_first'))
  );
  const refactorCost = $derived(
    Math.max(15, Math.round(20 * Math.pow(1.4, gameStore.state.era - 1)))
  );
  const canPrestige = $derived(gameStore.state.skills.includes('zero_touch_deploy'));

  let touchStartX = $state<number | null>(null);

  function onDiffTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) touchStartX = e.touches[0].clientX;
  }

  function onDiffTouchEnd(e: TouchEvent): void {
    if (touchStartX === null || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 48) return;
    if (dx > 0) {
      gameStore.dispatch({ type: 'ACCEPT_DIFF' });
    } else {
      gameStore.dispatch({ type: 'REJECT_DIFF' });
    }
  }

  function badgeLabel(risk: 'clean' | 'smell' | 'hallucination'): string {
    if (risk === 'clean') return 'SAFE';
    if (risk === 'smell') return 'SUSPECT';
    return 'HALLUCINATION';
  }
</script>

<div class="work-panel scroll-thin">
  {#if gameStore.state.activeBuffs.length > 0}
    <div class="buff-row">
      {#each gameStore.state.activeBuffs as buff (buff.id)}
        <span class="buff-pill">{buff.label} · {Math.ceil(buff.remainingSec)}s</span>
      {/each}
    </div>
  {/if}

  {#if gameStore.state.mcbTripped}
    <div class="mcb-panel">
      <div class="mcb-icon">⚡</div>
      <h3>MCB BREAKER TRIPPED</h3>
      <p>
        Load exceeded your PLN VA ceiling. Flip the wall breaker back up, then upgrade PLN VA in
        Setup.
      </p>
      <button
        type="button"
        class="primary-btn danger-btn"
        disabled={gameStore.state.mcbCooldownSec > 0}
        onclick={() => gameStore.dispatch({ type: 'FLIP_MCB' })}
      >
        {#if gameStore.state.mcbCooldownSec > 0}
          Cooling Breaker ({gameStore.state.mcbCooldownSec.toFixed(1)}s)...
        {:else}
          Flip MCB Breaker Up <span class="kbd">Space</span>
        {/if}
      </button>
    </div>
  {:else if !project}
    <div class="empty-work">
      <h3>No Active Project</h3>
      <p>
        {#if gameStore.state.inbox.length > 0}
          You have <strong>{gameStore.state.inbox.length}</strong> client email{gameStore.state
            .inbox.length > 1
            ? 's'
            : ''} waiting in Inbox.
        {:else}
          Waiting for fresh client emails...
        {/if}
      </p>
      <button type="button" class="primary-btn" onclick={() => gameStore.setTab('inbox')}>
        Open Inbox <span class="kbd">2</span>
      </button>

      {#if gameStore.state.techDebt >= 10}
        <button
          type="button"
          class="secondary-btn"
          disabled={gameStore.state.cash < refactorCost}
          onclick={() => gameStore.dispatch({ type: 'REFACTOR_DEBT' })}
        >
          Refactor Tech Debt (-20% Debt · ${refactorCost})
        </button>
      {/if}
    </div>
  {:else}
    {#if activeList.length > 1}
      <div class="slot-tabs">
        {#each activeList as item, idx (item.contract.id)}
          <button
            type="button"
            class="slot-chip"
            class:active={idx === gameStore.state.selectedProjectIndex}
            onclick={() => gameStore.dispatch({ type: 'SELECT_PROJECT', index: idx })}
          >
            #{idx + 1} {item.contract.projectType.split(' ')[0]} ({item.diffsCompleted}/{item.diffsTotal})
          </button>
        {/each}
      </div>
    {/if}

    <div class="project-card">
      <div class="project-head">
        <div>
          <div class="client-line">
            {project.contract.clientName} · <span class="muted">{project.contract.clientArchetype}</span>
          </div>
          <h3 class="proj-title">{project.contract.projectType}</h3>
        </div>
        <div class="payout-tag">
          ~${Math.round(project.contract.baseCash * (1 + project.contract.negotiatedBonus))}
        </div>
      </div>

      <div class="proj-meta">
        <span>Diffs {project.diffsCompleted}/{project.diffsTotal}</span>
        {#if project.planned}
          <span class="tag-good">PLANNED (-45% risk)</span>
        {/if}
        {#if project.contract.modifier}
          <span class="tag-mod">{project.contract.modifier.label}</span>
        {/if}
        {#if project.assignedToAgent}
          <span class="tag-agent">AUTO AGENT</span>
        {/if}
      </div>

      <div class="progress-track">
        <div
          class="progress-fill"
          style:width={`${Math.round((project.diffsCompleted / Math.max(1, project.diffsTotal)) * 100)}%`}
        ></div>
      </div>
    </div>

    {#if project.currentDiff}
      <div
        class="diff-card"
        role="region"
        aria-label="Code diff review card"
        ontouchstart={onDiffTouchStart}
        ontouchend={onDiffTouchEnd}
      >
        <div class="diff-head">
          <span class="diff-file">{project.currentDiff.filePath}</span>
          {#if project.currentDiff.scannedBadge}
            <span class="scan-badge" data-risk={project.currentDiff.scannedBadge}>
              {badgeLabel(project.currentDiff.scannedBadge)} ({project.currentDiff.scanConfidence}%)
            </span>
          {:else}
            <span class="scan-badge unknown">UNSCANNED</span>
          {/if}
        </div>

        <pre class="diff-code">{project.currentDiff.snippet}</pre>
        <p class="diff-hint">Clue: {project.currentDiff.hint}</p>

        <div class="diff-actions">
          <button
            type="button"
            class="secondary-btn reject-btn"
            onclick={() => gameStore.dispatch({ type: 'REJECT_DIFF' })}
          >
            Reject & Fix <span class="kbd">←</span>
          </button>
          <button
            type="button"
            class="primary-btn accept-btn"
            onclick={() => gameStore.dispatch({ type: 'ACCEPT_DIFF' })}
          >
            Accept Diff <span class="kbd">Space</span>
          </button>
        </div>
      </div>
    {:else}
      <div class="prompt-zone">
        {#if canPlan}
          <div class="sub-bar">
            <span>Spec Plan: {Math.round(project.planProgress * 100)}%</span>
            <div class="mini-track">
              <div class="mini-fill plan-fill" style:width={`${Math.round(project.planProgress * 100)}%`}></div>
            </div>
          </div>
        {/if}

        <div class="sub-bar">
          <span>Prompt Stream: {Math.round(project.promptProgress * 100)}%</span>
          <span class="speed-note">{gameStore.speedMult.toFixed(2)}×</span>
        </div>
        <div class="mini-track">
          <div class="mini-fill" style:width={`${Math.round(project.promptProgress * 100)}%`}></div>
        </div>

        <div class="action-row">
          {#if canPlan}
            <button
              type="button"
              class="secondary-btn plan-btn"
              onclick={() => gameStore.dispatch({ type: 'PLAN_PROJECT' })}
            >
              Plan First <span class="kbd">P</span>
            </button>
          {/if}
          <button
            type="button"
            class="primary-btn prompt-btn"
            onclick={() => gameStore.dispatch({ type: 'PROMPT_STEP' })}
          >
            Prompt AI <span class="kbd">Space</span>
          </button>
        </div>
      </div>
    {/if}

    <div class="utility-row">
      {#if gameStore.state.skills.includes('project_rules')}
        <button
          type="button"
          class="util-pill"
          class:util-on={gameStore.state.workflowAutoAcceptClean}
          onclick={() => gameStore.dispatch({ type: 'TOGGLE_WORKFLOW_AUTO' })}
        >
          Auto-Accept SAFE: {gameStore.state.workflowAutoAcceptClean ? 'ON' : 'OFF'}
        </button>
      {/if}
      {#if gameStore.state.techDebt >= 10}
        <button
          type="button"
          class="util-pill"
          disabled={gameStore.state.cash < refactorCost}
          onclick={() => gameStore.dispatch({ type: 'REFACTOR_DEBT' })}
        >
          Refactor -20% Debt (${refactorCost})
        </button>
      {/if}
    </div>
  {/if}

  {#if canPrestige}
    <div class="prestige-card">
      <div>
        <strong>Studio Exit & New Venture</strong>
        <p>Reset studio for permanent +50% Cash & XP multiplier (next: ×{(1 + (gameStore.state.prestigeCount + 1) * 0.5).toFixed(1)}).</p>
      </div>
      <button
        type="button"
        class="prestige-btn"
        onclick={() => gameStore.dispatch({ type: 'PRESTIGE_EXIT' })}
      >
        Exit Studio
      </button>
    </div>
  {/if}

  {#if gameStore.state.recentLogs.length > 0}
    <div class="log-strip">
      {#each gameStore.state.recentLogs.slice(0, 3) as entry (entry.id)}
        <div class="log-line" data-tone={entry.tone}>{entry.text}</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .work-panel {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
  }

  .buff-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .buff-pill {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.16);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #bae6fd;
  }

  .mcb-panel,
  .empty-work {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 16px 14px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .mcb-panel {
    border-color: rgba(251, 113, 133, 0.5);
    background: linear-gradient(180deg, rgba(127, 29, 29, 0.25), var(--bg-card));
  }

  .mcb-icon {
    font-size: 26px;
  }

  .mcb-panel h3,
  .empty-work h3 {
    margin: 0;
    font-size: 15px;
  }

  .mcb-panel p,
  .empty-work p {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.45;
  }

  .slot-tabs {
    display: flex;
    gap: 5px;
    overflow-x: auto;
  }

  .slot-chip {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 7px;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    white-space: nowrap;
  }

  .slot-chip.active {
    border-color: var(--accent-cyan);
    color: var(--text-main);
    background: rgba(56, 189, 248, 0.14);
  }

  .project-card,
  .diff-card,
  .prompt-zone {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .project-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .client-line {
    font-size: 11px;
    color: #cbd5e1;
  }

  .muted {
    color: var(--text-dim);
  }

  .proj-title {
    margin: 2px 0 0;
    font-size: 14px;
    font-weight: 700;
  }

  .payout-tag {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--accent-emerald);
    background: rgba(52, 211, 153, 0.12);
    border: 1px solid rgba(52, 211, 153, 0.3);
    padding: 3px 8px;
    border-radius: 7px;
  }

  .proj-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 11px;
    color: var(--text-muted);
  }

  .tag-good,
  .tag-mod,
  .tag-agent {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 5px;
  }

  .tag-good {
    background: rgba(52, 211, 153, 0.15);
    color: #6ee7b7;
  }

  .tag-mod {
    background: rgba(251, 191, 36, 0.16);
    color: #fde68a;
  }

  .tag-agent {
    background: rgba(167, 139, 250, 0.2);
    color: #ddd6fe;
  }

  .progress-track,
  .mini-track {
    height: 6px;
    background: rgba(15, 23, 42, 0.9);
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #38bdf8, #34d399);
    transition: width 150ms ease;
  }

  .mini-fill {
    height: 100%;
    background: linear-gradient(90deg, #818cf8, #38bdf8);
    transition: width 90ms linear;
  }

  .plan-fill {
    background: linear-gradient(90deg, #fbbf24, #34d399);
  }

  .diff-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }

  .diff-file {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent-cyan);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scan-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 5px;
  }

  .scan-badge.unknown {
    background: rgba(148, 163, 184, 0.16);
    color: #cbd5e1;
  }

  .scan-badge[data-risk='clean'] {
    background: rgba(52, 211, 153, 0.2);
    color: #6ee7b7;
  }

  .scan-badge[data-risk='smell'] {
    background: rgba(251, 191, 36, 0.2);
    color: #fde68a;
  }

  .scan-badge[data-risk='hallucination'] {
    background: rgba(251, 113, 133, 0.25);
    color: #fecdd3;
  }

  .diff-code {
    margin: 0;
    padding: 8px 9px;
    border-radius: 8px;
    background: #090d17;
    border: 1px solid rgba(148, 163, 184, 0.14);
    font-family: var(--font-mono);
    font-size: 11px;
    color: #a7f3d0;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.4;
  }

  .diff-hint {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
  }

  .diff-actions,
  .action-row {
    display: grid;
    grid-template-columns: 1fr 1.35fr;
    gap: 8px;
    margin-top: 2px;
  }

  .action-row:has(> :only-child) {
    grid-template-columns: 1fr;
  }

  .primary-btn,
  .secondary-btn {
    border-radius: 10px;
    padding: 11px 12px;
    font-size: 13px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: transform 60ms ease, filter 120ms ease;
  }

  .primary-btn:active,
  .secondary-btn:active {
    transform: scale(0.98);
  }

  .primary-btn {
    background: linear-gradient(135deg, #2563eb, #0ea5e9);
    border: 1px solid rgba(125, 211, 252, 0.45);
    color: #fff;
    box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);
  }

  .accept-btn {
    background: linear-gradient(135deg, #059669, #10b981);
    border-color: rgba(110, 231, 183, 0.45);
  }

  .danger-btn {
    background: linear-gradient(135deg, #dc2626, #f43f5e);
    border-color: rgba(254, 205, 211, 0.45);
    width: 100%;
  }

  .secondary-btn {
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid var(--border-strong);
    color: #e2e8f0;
  }

  .reject-btn {
    border-color: rgba(251, 113, 133, 0.45);
    color: #fecdd3;
  }

  .sub-bar {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-muted);
    align-items: center;
    gap: 8px;
  }

  .speed-note {
    font-family: var(--font-mono);
    color: var(--accent-cyan);
  }

  .utility-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .util-pill {
    font-size: 11px;
    padding: 5px 9px;
    border-radius: 8px;
    border: 1px solid var(--border-subtle);
    background: rgba(15, 23, 42, 0.7);
    color: var(--text-muted);
  }

  .util-pill.util-on {
    border-color: rgba(52, 211, 153, 0.45);
    color: #6ee7b7;
  }

  .prestige-card {
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(14, 165, 233, 0.16));
    border: 1px solid rgba(167, 139, 250, 0.45);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .prestige-card p {
    margin: 2px 0 0;
    font-size: 11px;
    color: var(--text-muted);
  }

  .prestige-btn {
    padding: 8px 11px;
    border-radius: 9px;
    border: 1px solid #c4b5fd;
    background: #6d28d9;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .log-strip {
    margin-top: auto;
    padding-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .log-line {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .log-line[data-tone='good'] {
    color: #6ee7b7;
  }

  .log-line[data-tone='warn'] {
    color: #fde68a;
  }

  .log-line[data-tone='bad'] {
    color: #fda4af;
  }
</style>

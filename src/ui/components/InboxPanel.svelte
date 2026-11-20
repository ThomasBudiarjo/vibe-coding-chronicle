<script lang="ts">
  import { gameStore } from '../gameStore.svelte';

  const hasBot = $derived(gameStore.state.skills.includes('hermes_bot'));
  const hasNegotiate = $derived(gameStore.state.skills.includes('bot_negotiation'));
  const queueFull = $derived(
    gameStore.state.activeProjects.length >= gameStore.maxActiveProjects
  );
</script>

<div class="inbox-panel scroll-thin">
  <div class="panel-head">
    <div>
      <h3>Client Inbox</h3>
      <span class="sub">
        Queue {gameStore.state.activeProjects.length}/{gameStore.maxActiveProjects} active
      </span>
    </div>
    <span class="kbd">↑/↓ + Enter</span>
  </div>

  {#if hasBot}
    <div class="bot-card">
      <div class="bot-title">
        <strong>Hermes Agent / Grok Bot</strong>
        <span class="watt-note">+90W when ON</span>
      </div>
      <div class="bot-toggles">
        <button
          type="button"
          class="toggle-btn"
          class:on={gameStore.state.botAutoIntake}
          onclick={() => gameStore.dispatch({ type: 'TOGGLE_BOT_INTAKE' })}
        >
          Auto-Intake: {gameStore.state.botAutoIntake ? 'ON' : 'OFF'}
        </button>
        {#if hasNegotiate}
          <button
            type="button"
            class="toggle-btn"
            class:on={gameStore.state.botAutoNegotiate}
            onclick={() => gameStore.dispatch({ type: 'TOGGLE_BOT_NEGOTIATE' })}
          >
            Auto-Negotiate: {gameStore.state.botAutoNegotiate ? 'ON' : 'OFF'}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  {#if gameStore.state.inbox.length === 0}
    <div class="empty-box">
      No new emails right now. Clients reach out every few seconds!
    </div>
  {:else}
    <div class="email-list">
      {#each gameStore.state.inbox as email, idx (email.id)}
        <div
          class="email-card"
          class:focused={idx === gameStore.listFocusIndex}
        >
          <div class="email-top">
            <div class="sender">
              <strong>{email.clientName}</strong>
              <span class="archetype">{email.clientArchetype}</span>
            </div>
            <span class="reward">${email.baseCash} · {email.baseXp} XP</span>
          </div>

          <div class="subject">{email.subject}</div>
          <p class="body">{email.body}</p>

          <div class="email-foot">
            <div class="tags">
              <span class="pill">{email.totalDiffs} diffs</span>
              {#if email.modifier}
                <span class="pill mod" title={email.modifier.description}>
                  {email.modifier.label}
                </span>
              {/if}
            </div>
            <div class="email-btns">
              <button
                type="button"
                class="dismiss-btn"
                onclick={() => gameStore.dispatch({ type: 'DISMISS_EMAIL', emailId: email.id })}
              >
                Skip
              </button>
              <button
                type="button"
                class="accept-btn"
                disabled={queueFull}
                onclick={() => {
                  gameStore.dispatch({ type: 'ACCEPT_EMAIL', emailId: email.id });
                  gameStore.setTab('work');
                }}
              >
                {queueFull ? 'Queue Full' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .inbox-panel {
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

  .bot-card {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(30, 41, 59, 0.8));
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: var(--radius-md);
    padding: 9px 10px;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .bot-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }

  .watt-note {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--accent-amber);
  }

  .bot-toggles {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .toggle-btn {
    font-size: 11px;
    font-weight: 700;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid var(--border-strong);
    background: rgba(15, 23, 42, 0.8);
    color: var(--text-muted);
  }

  .toggle-btn.on {
    background: rgba(14, 165, 233, 0.24);
    border-color: var(--accent-cyan);
    color: #e0f2fe;
  }

  .empty-box {
    background: var(--bg-card);
    border: 1px dashed var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
  }

  .email-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .email-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 9px 11px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .email-card.focused {
    border-color: var(--accent-cyan);
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.25);
  }

  .email-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 6px;
  }

  .sender {
    display: flex;
    align-items: baseline;
    gap: 5px;
    font-size: 12px;
  }

  .archetype {
    font-size: 10px;
    color: var(--text-dim);
  }

  .reward {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--accent-emerald);
    white-space: nowrap;
  }

  .subject {
    font-size: 13px;
    font-weight: 700;
    color: #f8fafc;
  }

  .body {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.35;
  }

  .email-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-top: 3px;
  }

  .tags {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .pill {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 5px;
    background: rgba(15, 23, 42, 0.8);
    color: #cbd5e1;
  }

  .pill.mod {
    background: rgba(251, 191, 36, 0.16);
    color: #fde68a;
  }

  .email-btns {
    display: flex;
    gap: 6px;
  }

  .dismiss-btn {
    padding: 5px 9px;
    border-radius: 7px;
    border: 1px solid var(--border-subtle);
    background: transparent;
    font-size: 11px;
    color: var(--text-muted);
  }

  .accept-btn {
    padding: 5px 11px;
    border-radius: 7px;
    border: 1px solid rgba(52, 211, 153, 0.45);
    background: #059669;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
  }
</style>

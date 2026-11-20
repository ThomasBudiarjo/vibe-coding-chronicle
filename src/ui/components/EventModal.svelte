<script lang="ts">
  import { gameStore } from '../gameStore.svelte';

  const modal = $derived(gameStore.state.activeModal);
  let selectedIdx = $state(0);

  $effect(() => {
    if (modal) {
      selectedIdx = 0;
    }
  });
</script>

{#if modal}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <div class="modal-card" data-kind={modal.kind}>
      <div class="modal-tag">
        {modal.kind === 'story' ? 'STORY MILESTONE' : 'RANDOM EVENT'} · {modal.subtitle}
      </div>
      <h2 id="event-modal-title">{modal.title}</h2>
      <p class="modal-body">{modal.body}</p>

      <div class="choices">
        {#each modal.choices as choice, idx (choice.id)}
          <button
            type="button"
            class="choice-btn"
            class:selected={idx === selectedIdx}
            onclick={() => gameStore.dispatch({ type: 'RESOLVE_MODAL', choiceId: choice.id })}
          >
            <div class="choice-top">
              <span class="kbd">{idx + 1}</span>
              <strong>{choice.label}</strong>
            </div>
            <span class="choice-detail">{choice.detail}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(3, 6, 15, 0.78);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 40;
  }

  .modal-card {
    width: 100%;
    max-width: 400px;
    background: #131b2e;
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: var(--radius-lg);
    padding: 16px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .modal-card[data-kind='story'] {
    border-color: rgba(167, 139, 250, 0.55);
  }

  .modal-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--accent-cyan);
  }

  .modal-card[data-kind='story'] .modal-tag {
    color: var(--accent-violet);
  }

  h2 {
    margin: 0;
    font-size: 17px;
  }

  .modal-body {
    margin: 0;
    font-size: 13px;
    color: #cbd5e1;
    line-height: 1.48;
  }

  .choices {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }

  .choice-btn {
    text-align: left;
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .choice-btn:hover,
  .choice-btn.selected {
    border-color: var(--accent-cyan);
    background: rgba(14, 165, 233, 0.16);
  }

  .choice-top {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .choice-detail {
    font-size: 11px;
    color: var(--text-muted);
    padding-left: 24px;
  }
</style>

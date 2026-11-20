<script lang="ts">
  import { gameStore } from '../gameStore.svelte';

  let importText = $state('');
  let statusMsg = $state('');
  let confirmReset = $state(false);

  function handleExport(): void {
    importText = gameStore.exportSave();
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(importText).catch(() => {});
    }
    statusMsg = 'Save JSON exported (and copied if clipboard allowed).';
  }

  function handleImport(): void {
    if (!importText.trim()) {
      statusMsg = 'Paste a valid save JSON payload first.';
      return;
    }
    const ok = gameStore.importSave(importText.trim());
    statusMsg = ok ? 'Save imported successfully!' : 'Invalid or incompatible save JSON.';
  }

  function handleReset(): void {
    if (!confirmReset) {
      confirmReset = true;
      statusMsg = 'Click Confirm Reset to wipe progress.';
      return;
    }
    gameStore.resetSave();
    confirmReset = false;
    statusMsg = 'Progress reset to Era 1 Kamar Kos.';
    gameStore.settingsOpen = false;
  }

  function fmtDuration(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${Math.max(1, m)}m`;
  }
</script>

{#if gameStore.offlineSummary}
  <div class="offline-banner">
    <div class="offline-text">
      <strong>Welcome back ({fmtDuration(gameStore.offlineSummary.elapsedSec)} away)</strong>
      <span>
        Earned +${gameStore.offlineSummary.cashEarned.toLocaleString()}, +{gameStore.offlineSummary.xpEarned.toLocaleString()} XP
        {#if gameStore.offlineSummary.projectsShipped > 0}
          · {gameStore.offlineSummary.projectsShipped} shipped
        {/if}
      </span>
    </div>
    <button
      type="button"
      class="offline-close"
      onclick={() => gameStore.dismissOfflineSummary()}
    >
      OK
    </button>
  </div>
{/if}

{#if gameStore.settingsOpen}
  <div class="settings-backdrop" role="dialog" aria-modal="true" aria-label="Settings and Save Management">
    <div class="settings-card">
      <div class="settings-head">
        <h3>Settings & Save</h3>
        <button
          type="button"
          class="close-btn"
          onclick={() => {
            gameStore.settingsOpen = false;
            confirmReset = false;
            statusMsg = '';
          }}
        >
          ✕
        </button>
      </div>

      <div class="shortcuts-box">
        <strong>Keyboard Controls</strong>
        <div class="shortcut-grid">
          <span><span class="kbd">1-4</span> / <span class="kbd">Q/E</span> Tabs</span>
          <span><span class="kbd">Space</span> / <span class="kbd">→</span> Prompt / Accept</span>
          <span><span class="kbd">←</span> / <span class="kbd">P</span> Reject / Plan</span>
          <span><span class="kbd">↑/↓</span> + <span class="kbd">Enter</span> Lists</span>
          <span><span class="kbd">1-3</span> Modal Choice</span>
          <span><span class="kbd">M</span> Mute · <span class="kbd">F</span> 1×/2×/5×</span>
        </div>
      </div>

      <div class="io-box">
        <label for="save-json">Save JSON (Export / Import)</label>
        <textarea
          id="save-json"
          rows="4"
          bind:value={importText}
          placeholder="Click Export or paste save JSON here..."
        ></textarea>
        <div class="io-actions">
          <button type="button" class="btn-sec" onclick={handleExport}>Export</button>
          <button type="button" class="btn-sec" onclick={handleImport}>Import</button>
          <button type="button" class="btn-danger" onclick={handleReset}>
            {confirmReset ? 'Confirm Reset' : 'Reset Save'}
          </button>
        </div>
        {#if statusMsg}
          <div class="status-msg">{statusMsg}</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .offline-banner {
    position: absolute;
    top: 76px;
    left: 10px;
    right: 10px;
    z-index: 30;
    background: rgba(15, 23, 42, 0.96);
    border: 1px solid rgba(52, 211, 153, 0.55);
    border-radius: 10px;
    padding: 8px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  }

  .offline-text {
    display: flex;
    flex-direction: column;
    font-size: 11px;
    gap: 2px;
  }

  .offline-text span {
    color: #6ee7b7;
    font-family: var(--font-mono);
    font-size: 10px;
  }

  .offline-close {
    padding: 5px 10px;
    border-radius: 7px;
    border: 1px solid rgba(52, 211, 153, 0.5);
    background: #059669;
    font-size: 11px;
    font-weight: 700;
  }

  .settings-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(3, 6, 15, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 50;
  }

  .settings-card {
    width: 100%;
    max-width: 400px;
    background: #131b2e;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .settings-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .settings-head h3 {
    margin: 0;
    font-size: 15px;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1px solid var(--border-subtle);
    background: rgba(30, 41, 59, 0.8);
  }

  .shortcuts-box {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    padding: 9px 10px;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .shortcut-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
    color: var(--text-muted);
    font-size: 10px;
  }

  .io-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 11px;
    color: var(--text-muted);
  }

  textarea {
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--border-subtle);
    background: #090d17;
    color: #e2e8f0;
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 7px;
    resize: vertical;
  }

  .io-actions {
    display: flex;
    gap: 6px;
  }

  .btn-sec,
  .btn-danger {
    flex: 1;
    padding: 7px 8px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
  }

  .btn-sec {
    background: rgba(30, 41, 59, 0.9);
    border: 1px solid var(--border-strong);
  }

  .btn-danger {
    background: rgba(185, 28, 28, 0.35);
    border: 1px solid rgba(251, 113, 133, 0.5);
    color: #fecdd3;
  }

  .status-msg {
    font-size: 11px;
    color: var(--accent-cyan);
  }
</style>

<script lang="ts">
  import { SKILLS } from '../engine/catalog';
  import type { SetupTrackId } from '../engine/types';
  import BottomNav from './components/BottomNav.svelte';
  import EventModal from './components/EventModal.svelte';
  import InboxPanel from './components/InboxPanel.svelte';
  import IsoRoomCanvas from './components/IsoRoomCanvas.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import SetupPanel from './components/SetupPanel.svelte';
  import SkillsPanel from './components/SkillsPanel.svelte';
  import TopBar from './components/TopBar.svelte';
  import WorkPanel from './components/WorkPanel.svelte';
  import { gameStore } from './gameStore.svelte';

  const SETUP_ORDER: SetupTrackId[] = ['monitors', 'power', 'room', 'cooling', 'compute'];

  $effect(() => {
    return gameStore.start();
  });

  function getListLength(): number {
    if (gameStore.activeTab === 'inbox') return gameStore.state.inbox.length;
    if (gameStore.activeTab === 'skills') {
      return SKILLS.filter((s) => s.era <= Math.min(7, gameStore.state.era + 1)).length;
    }
    if (gameStore.activeTab === 'setup') return SETUP_ORDER.length;
    return 0;
  }

  function triggerFocusedListItem(): void {
    const idx = gameStore.listFocusIndex;
    if (gameStore.activeTab === 'inbox') {
      const email = gameStore.state.inbox[idx];
      if (email) {
        gameStore.dispatch({ type: 'ACCEPT_EMAIL', emailId: email.id });
        gameStore.setTab('work');
      }
      return;
    }
    if (gameStore.activeTab === 'skills') {
      const visible = SKILLS.filter((s) => s.era <= Math.min(7, gameStore.state.era + 1));
      const skill = visible[idx];
      if (skill) {
        gameStore.dispatch({ type: 'BUY_SKILL', skillId: skill.id });
      }
      return;
    }
    if (gameStore.activeTab === 'setup') {
      const track = SETUP_ORDER[idx];
      if (track) {
        gameStore.dispatch({ type: 'BUY_SETUP', track });
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
      return;
    }

    if (e.key === 'Escape' && gameStore.settingsOpen) {
      gameStore.settingsOpen = false;
      return;
    }
    if (gameStore.settingsOpen) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key.toLowerCase();

    if (key === 'm') {
      e.preventDefault();
      gameStore.toggleMute();
      return;
    }

    if (key === 'f' && !gameStore.state.activeModal) {
      e.preventDefault();
      gameStore.cycleSimSpeed();
      return;
    }

    // Modal priority: suspend global tab hotkeys so 1/2/3 exclusively select modal choices
    const modal = gameStore.state.activeModal;
    if (modal) {
      if (key === '1' || key === '2' || key === '3') {
        const idx = Number(key) - 1;
        const choice = modal.choices[idx];
        if (choice) {
          e.preventDefault();
          gameStore.dispatch({ type: 'RESOLVE_MODAL', choiceId: choice.id });
        }
      } else if (key === 'enter' || e.code === 'Space') {
        const first = modal.choices[0];
        if (first) {
          e.preventDefault();
          gameStore.dispatch({ type: 'RESOLVE_MODAL', choiceId: first.id });
        }
      }
      return;
    }

    // Tab switching
    if (key === '1') {
      e.preventDefault();
      gameStore.setTab('work');
      return;
    }
    if (key === '2') {
      e.preventDefault();
      gameStore.setTab('inbox');
      return;
    }
    if (key === '3') {
      e.preventDefault();
      gameStore.setTab('skills');
      return;
    }
    if (key === '4') {
      e.preventDefault();
      gameStore.setTab('setup');
      return;
    }
    if (key === 'q') {
      e.preventDefault();
      gameStore.cycleTab(-1);
      return;
    }
    if (key === 'e') {
      e.preventDefault();
      gameStore.cycleTab(1);
      return;
    }

    // List navigation on Inbox / Skills / Setup
    if (gameStore.activeTab !== 'work') {
      const len = getListLength();
      if ((e.key === 'ArrowDown' || key === 's') && len > 0) {
        e.preventDefault();
        gameStore.listFocusIndex = (gameStore.listFocusIndex + 1) % len;
        return;
      }
      if ((e.key === 'ArrowUp' || key === 'w') && len > 0) {
        e.preventDefault();
        gameStore.listFocusIndex = (gameStore.listFocusIndex - 1 + len) % len;
        return;
      }
      if (e.key === 'Enter' && len > 0) {
        e.preventDefault();
        triggerFocusedListItem();
        return;
      }
    }

    // Primary & secondary actions on Work tab (or global MCB recovery)
    if (e.code === 'Space' || e.key === 'ArrowRight' || key === 'd') {
      e.preventDefault();
      if (gameStore.state.mcbTripped) {
        gameStore.dispatch({ type: 'FLIP_MCB' });
        return;
      }
      if (gameStore.activeTab !== 'work') {
        gameStore.setTab('work');
      }
      const proj = gameStore.state.activeProjects[gameStore.state.selectedProjectIndex];
      if (!proj) {
        if (gameStore.state.inbox.length > 0) {
          gameStore.dispatch({ type: 'ACCEPT_EMAIL', emailId: gameStore.state.inbox[0].id });
        }
      } else if (proj.currentDiff) {
        gameStore.dispatch({ type: 'ACCEPT_DIFF' });
      } else {
        gameStore.dispatch({ type: 'PROMPT_STEP' });
      }
      return;
    }

    if (e.key === 'ArrowLeft' || key === 'a' || e.key === 'Backspace' || key === 'p') {
      e.preventDefault();
      const proj = gameStore.state.activeProjects[gameStore.state.selectedProjectIndex];
      if (!proj) return;
      if (proj.currentDiff) {
        gameStore.dispatch({ type: 'REJECT_DIFF' });
      } else if (gameStore.state.skills.includes('plan_first') && !proj.planned) {
        gameStore.dispatch({ type: 'PLAN_PROJECT' });
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="viewport">
  <main class="cabinet">
    <TopBar />
    <IsoRoomCanvas />
    <section class="workspace" aria-label="Active workspace">
      {#if gameStore.activeTab === 'work'}
        <WorkPanel />
      {:else if gameStore.activeTab === 'inbox'}
        <InboxPanel />
      {:else if gameStore.activeTab === 'skills'}
        <SkillsPanel />
      {:else}
        <SetupPanel />
      {/if}
    </section>
    <BottomNav />
    <EventModal />
    <SettingsModal />
  </main>
</div>

<style>
  .viewport {
    width: 100%;
    height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cabinet {
    position: relative;
    width: 100%;
    max-width: 460px;
    height: 100dvh;
    background: var(--bg-cabinet);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.14), 0 28px 80px rgba(0, 0, 0, 0.75);
  }

  .workspace {
    flex: 1 1 auto;
    min-height: 0;
    background: var(--bg-panel);
    overflow: hidden;
  }

  @media (min-width: 520px) {
    .cabinet {
      height: min(100dvh, 880px);
      border-radius: 18px;
    }
  }
</style>

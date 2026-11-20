<script lang="ts">
  import { getSetupTier } from '../../engine/catalog';
  import { CANVAS_H, CANVAS_W } from '../../renderer/iso';
  import { renderIsoRoom } from '../../renderer/roomRenderer';
  import { gameStore } from '../gameStore.svelte';

  let canvas = $state<HTMLCanvasElement | null>(null);
  const roomDef = $derived(getSetupTier('room', gameStore.state.setup.room));

  $effect(() => {
    const el = canvas;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const draw = () => {
      renderIsoRoom(ctx, gameStore.renderSnapshot);
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafId);
  });
</script>

<section class="room-stage" aria-label="Isometric pixel art studio">
  <canvas
    bind:this={canvas}
    width={CANVAS_W}
    height={CANVAS_H}
    class="iso-canvas"
  ></canvas>

  <div class="overlay-top">
    <span class="room-chip">{roomDef.name}</span>
    <span class="room-chip">
      {gameStore.state.setup.monitors} Monitor{gameStore.state.setup.monitors > 1 ? 's' : ''}
    </span>
  </div>

  <div class="overlay-bottom">
    <div class="badges">
      {#if gameStore.state.skills.includes('hermes_bot') && gameStore.state.botAutoIntake}
        <span class="status-pill bot">HERMES BOT ON</span>
      {/if}
      {#if gameStore.agentSlots > 0}
        <span class="status-pill agent">
          {gameStore.agentSlots > 1 ? `SWARM ×${gameStore.agentSlots}` : 'AGENT ×1'}
        </span>
      {/if}
      {#if gameStore.state.skills.includes('autonomous_saas')}
        <span class="status-pill factory">
          +${Math.round(gameStore.state.saasRevenuePerSec)}/s SaaS
        </span>
      {/if}
      {#if gameStore.thermal.throttled}
        <span class="status-pill warn">THERMAL THROTTLE</span>
      {/if}
    </div>
    <span class="shipped-tag">Shipped: {gameStore.state.shippedCount}</span>
  </div>

  {#if gameStore.state.mcbTripped}
    <div class="blackout-badge">MCB TRIPPED · POWER OUT</div>
  {/if}
</section>

<style>
  .room-stage {
    position: relative;
    width: 100%;
    aspect-ratio: 240 / 150;
    max-height: 36dvh;
    background: #060912;
    border-bottom: 1px solid var(--border-subtle);
    overflow: hidden;
    flex-shrink: 0;
  }

  .iso-canvas {
    width: 100%;
    height: 100%;
    display: block;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }

  .overlay-top,
  .overlay-bottom {
    position: absolute;
    left: 8px;
    right: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    gap: 6px;
  }

  .overlay-top {
    top: 7px;
  }

  .overlay-bottom {
    bottom: 7px;
  }

  .room-chip,
  .shipped-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    color: #cbd5e1;
    background: rgba(6, 10, 20, 0.72);
    border: 1px solid rgba(148, 163, 184, 0.22);
    padding: 2px 7px;
    border-radius: 6px;
  }

  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .status-pill {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 5px;
    letter-spacing: 0.03em;
  }

  .status-pill.bot {
    background: rgba(56, 189, 248, 0.2);
    border: 1px solid rgba(56, 189, 248, 0.5);
    color: #7dd3fc;
  }

  .status-pill.agent {
    background: rgba(167, 139, 250, 0.2);
    border: 1px solid rgba(167, 139, 250, 0.5);
    color: #ddd6fe;
  }

  .status-pill.factory {
    background: rgba(52, 211, 153, 0.2);
    border: 1px solid rgba(52, 211, 153, 0.5);
    color: #6ee7b7;
  }

  .status-pill.warn {
    background: rgba(251, 191, 36, 0.22);
    border: 1px solid rgba(251, 191, 36, 0.6);
    color: #fde68a;
  }

  .blackout-badge {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 5px 12px;
    border-radius: 8px;
    background: rgba(127, 29, 29, 0.9);
    border: 1px solid #f87171;
    color: #fecaca;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    pointer-events: none;
    animation: blink 0.9s infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.45;
    }
  }
</style>

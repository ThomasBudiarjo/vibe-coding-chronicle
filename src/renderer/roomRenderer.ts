import type { RenderSnapshot } from '../engine/types';
import { CANVAS_H, CANVAS_W, getRoomPalette } from './iso';
import {
  drawDeskAndMonitors,
  drawLiveEffects,
  drawRoomProps,
  drawRoomShell,
  drawVibeCoder,
  drawWallMcbBox
} from './sprites';

export function renderIsoRoom(
  ctx: CanvasRenderingContext2D,
  snap: RenderSnapshot
): void {
  ctx.imageSmoothingEnabled = false;
  const pal = getRoomPalette(snap.roomTier, snap.mcbTripped);

  // Clear backdrop
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle ambient glow behind monitors when powered
  if (!snap.mcbTripped) {
    const grad = ctx.createRadialGradient(118, 72, 6, 118, 72, 78);
    grad.addColorStop(0, `${pal.accent}28`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Painter's algorithm draw order (back -> front)
  drawRoomShell(ctx, snap, pal);
  drawWallMcbBox(ctx, snap);
  drawRoomProps(ctx, snap);
  drawDeskAndMonitors(ctx, snap, pal);
  drawVibeCoder(ctx, snap);
  drawLiveEffects(ctx, snap);
}

import type { RenderSnapshot } from '../engine/types';
import {
  drawIsoBox,
  fillPoly,
  isoProject,
  pxRect,
  type RoomPalette
} from './iso';

export function drawRoomShell(
  ctx: CanvasRenderingContext2D,
  snap: RenderSnapshot,
  pal: RoomPalette
): void {
  const size = snap.roomTier >= 4 ? 5.2 : snap.roomTier >= 2 ? 4.8 : 4.4;
  const wallH = 4.6;

  // Back-left wall (y = 0, x from 0..size)
  const bl0 = isoProject(0, 0, 0);
  const bl1 = isoProject(size, 0, 0);
  const bl2 = isoProject(size, 0, wallH);
  const bl3 = isoProject(0, 0, wallH);
  fillPoly(ctx, [bl0, bl1, bl2, bl3], pal.wallRight);

  // Back-right wall (x = 0, y from 0..size)
  const br0 = isoProject(0, 0, 0);
  const br1 = isoProject(0, size, 0);
  const br2 = isoProject(0, size, wallH);
  const br3 = isoProject(0, 0, wallH);
  fillPoly(ctx, [br0, br1, br2, br3], pal.wallLeft);

  // Top wall trim
  fillPoly(
    ctx,
    [
      isoProject(0, 0, wallH),
      isoProject(size, 0, wallH),
      isoProject(size, 0, wallH + 0.18),
      isoProject(0, 0, wallH + 0.18)
    ],
    pal.wallTrim
  );
  fillPoly(
    ctx,
    [
      isoProject(0, 0, wallH),
      isoProject(0, size, wallH),
      isoProject(0, size, wallH + 0.18),
      isoProject(0, 0, wallH + 0.18)
    ],
    pal.wallTrim
  );

  // Checkered isometric floor tiles
  const tiles = Math.floor(size);
  for (let gx = 0; gx < tiles; gx++) {
    for (let gy = 0; gy < tiles; gy++) {
      const p0 = isoProject(gx, gy, 0);
      const p1 = isoProject(gx + 1, gy, 0);
      const p2 = isoProject(gx + 1, gy + 1, 0);
      const p3 = isoProject(gx, gy + 1, 0);
      const c = (gx + gy) % 2 === 0 ? pal.floorA : pal.floorB;
      fillPoly(ctx, [p0, p1, p2, p3], c);
    }
  }

  // Night dusk window on back-left wall (x=0, y=1.3..3.1)
  const w0 = isoProject(0.02, 1.3, 1.8);
  const w1 = isoProject(0.02, 3.1, 1.8);
  const w2 = isoProject(0.02, 3.1, 3.6);
  const w3 = isoProject(0.02, 1.3, 3.6);
  fillPoly(ctx, [w0, w1, w2, w3], snap.mcbTripped ? '#0c1226' : '#182b52');

  // Window frame & city skyline glow
  if (!snap.mcbTripped) {
    const skyMid0 = isoProject(0.03, 1.4, 1.95);
    const skyMid1 = isoProject(0.03, 3.0, 1.95);
    const skyMid2 = isoProject(0.03, 3.0, 2.55);
    const skyMid3 = isoProject(0.03, 1.4, 2.55);
    fillPoly(ctx, [skyMid0, skyMid1, skyMid2, skyMid3], '#3b2d63');
    // Distant pixel stars / skyline dots
    const starA = isoProject(0.04, 1.7, 3.2);
    const starB = isoProject(0.04, 2.4, 3.3);
    const starC = isoProject(0.04, 2.7, 2.8);
    pxRect(ctx, starA.x, starA.y, 1, 1, '#fef08a');
    pxRect(ctx, starB.x, starB.y, 1, 1, '#bae6fd');
    pxRect(ctx, starC.x, starC.y, 2, 1, '#f472b6');
  }

  // Room Tier 3+: LED mood strip along top wall
  if (snap.roomTier >= 3 && !snap.mcbTripped) {
    const l0 = isoProject(0.2, 0.04, 4.15);
    const l1 = isoProject(size - 0.3, 0.04, 4.15);
    const l2 = isoProject(size - 0.3, 0.04, 4.28);
    const l3 = isoProject(0.2, 0.04, 4.28);
    fillPoly(ctx, [l0, l1, l2, l3], pal.accent);
  }

  // Room Tier 3+: Acoustic foam panels on right wall
  if (snap.roomTier >= 3) {
    for (let i = 0; i < 3; i++) {
      const ax = 1.6 + i * 0.72;
      const a0 = isoProject(ax, 0.03, 2.5);
      const a1 = isoProject(ax + 0.5, 0.03, 2.5);
      const a2 = isoProject(ax + 0.5, 0.03, 3.4);
      const a3 = isoProject(ax, 0.03, 3.4);
      fillPoly(ctx, [a0, a1, a2, a3], snap.mcbTripped ? '#141724' : '#31385c');
    }
  }
}

export function drawWallMcbBox(
  ctx: CanvasRenderingContext2D,
  snap: RenderSnapshot
): void {
  // Mounted on right back wall (y=0.05, x=3.4..4.0)
  const p = isoProject(3.55, 0.08, 2.5);
  pxRect(ctx, p.x - 5, p.y - 7, 10, 14, snap.mcbTripped ? '#232736' : '#64748b');
  pxRect(ctx, p.x - 4, p.y - 6, 8, 12, snap.mcbTripped ? '#151822' : '#94a3b8');

  // Breaker switch lever (down when tripped, up when on)
  const leverY = snap.mcbTripped ? p.y + 1 : p.y - 2;
  pxRect(ctx, p.x - 1, leverY, 3, 3, snap.mcbTripped ? '#ef4444' : '#0f172a');

  // Status LED on MCB box
  const blinkOn = Math.floor(snap.timeSec * 5) % 2 === 0;
  if (snap.mcbTripped) {
    if (blinkOn) {
      pxRect(ctx, p.x - 2, p.y - 5, 4, 2, '#ff2e4c');
      // Subtle red glow halo
      ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
      ctx.fillRect(p.x - 6, p.y - 9, 12, 10);
    }
  } else if (snap.powerState === 'overload' || snap.powerState === 'warning') {
    pxRect(ctx, p.x - 1, p.y - 5, 3, 2, blinkOn ? '#f59e0b' : '#78350f');
  } else {
    pxRect(ctx, p.x - 1, p.y - 5, 3, 2, '#22c55e');
  }
}

export function drawRoomProps(
  ctx: CanvasRenderingContext2D,
  snap: RenderSnapshot
): void {
  const dark = snap.mcbTripped;

  // Era 1-2: Floor mattress (kasur kos) in back corner
  if (snap.roomTier <= 2) {
    drawIsoBox(
      ctx,
      0.25,
      2.65,
      0,
      1.35,
      1.6,
      0.32,
      dark ? '#171c2b' : '#4f6d9a',
      dark ? '#101420' : '#3a5278',
      dark ? '#0c101a' : '#2f4363'
    );
    // Pillow
    drawIsoBox(
      ctx,
      0.35,
      2.8,
      0.32,
      0.45,
      0.9,
      0.16,
      dark ? '#1d2230' : '#cbd5e1',
      dark ? '#141824' : '#94a3b8',
      dark ? '#10141f' : '#64748b'
    );
  } else {
    // Tier 3+: Potted plant + gear shelf
    drawIsoBox(
      ctx,
      0.3,
      3.3,
      0,
      0.55,
      0.55,
      0.45,
      dark ? '#1f1714' : '#9a5837',
      dark ? '#16110e' : '#7c4327',
      dark ? '#110d0b' : '#63351e'
    );
    const plantTop = isoProject(0.57, 3.57, 0.55);
    pxRect(ctx, plantTop.x - 3, plantTop.y - 6, 6, 5, dark ? '#0d261b' : '#22c55e');
    pxRect(ctx, plantTop.x - 2, plantTop.y - 9, 4, 4, dark ? '#113324' : '#4ade80');
  }

  // Cooling unit visual
  if (snap.coolingTier === 1) {
    // Kipas Kecil on floor/corner
    const fan = isoProject(3.5, 3.1, 0.2);
    pxRect(ctx, fan.x - 2, fan.y + 1, 5, 2, dark ? '#1a202c' : '#475569');
    pxRect(ctx, fan.x - 3, fan.y - 5, 7, 6, dark ? '#1e2433' : '#94a3b8');
    const spin = Math.floor(snap.timeSec * 12) % 2;
    if (!dark) {
      pxRect(ctx, fan.x - 1 + spin, fan.y - 3, 2, 2, '#38bdf8');
    }
  } else if (snap.coolingTier === 2) {
    // Standing Fan Turbo
    const fan = isoProject(3.7, 2.9, 0.1);
    pxRect(ctx, fan.x - 3, fan.y + 1, 7, 2, dark ? '#181e29' : '#334155');
    pxRect(ctx, fan.x, fan.y - 10, 2, 11, dark ? '#202636' : '#64748b');
    pxRect(ctx, fan.x - 4, fan.y - 17, 9, 8, dark ? '#1d2536' : '#cbd5e1');
    if (!dark) {
      const spin = Math.floor(snap.timeSec * 15) % 2;
      pxRect(ctx, fan.x - 2 + spin, fan.y - 14, 4, 2, '#38bdf8');
    }
  } else {
    // AC 1/2 PK or Dedicated Rack Cooling mounted high on left wall
    const ac0 = isoProject(0.1, 0.25, 3.4);
    pxRect(ctx, ac0.x - 12, ac0.y - 4, 22, 8, dark ? '#1c2230' : '#e2e8f0');
    pxRect(ctx, ac0.x - 11, ac0.y + 1, 20, 2, dark ? '#10141f' : '#475569');
    if (!dark) {
      pxRect(ctx, ac0.x + 6, ac0.y - 2, 2, 2, snap.coolingTier >= 4 ? '#22d3ee' : '#22c55e');
      // Subtle cool air streaks
      const drift = Math.floor(snap.timeSec * 6) % 4;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(ac0.x - 6, ac0.y + 4 + drift, 10, 1);
    }
  }

  // Server rack(s) for Compute Tier >= 4 or Room Tier >= 4
  if (snap.computeTier >= 4 || snap.roomTier >= 4) {
    drawServerRack(ctx, 3.25, 0.35, snap, dark);
  }
  if (snap.roomTier >= 5 || snap.computeTier >= 5) {
    drawServerRack(ctx, 3.85, 0.95, snap, dark);
  }
}

function drawServerRack(
  ctx: CanvasRenderingContext2D,
  wx: number,
  wy: number,
  snap: RenderSnapshot,
  dark: boolean
): void {
  drawIsoBox(
    ctx,
    wx,
    wy,
    0,
    0.7,
    0.65,
    2.4,
    dark ? '#111621' : '#334155',
    dark ? '#0b0e17' : '#1e293b',
    dark ? '#080b12' : '#0f172a'
  );
  if (!dark) {
    for (let row = 0; row < 5; row++) {
      const led = isoProject(wx + 0.18, wy + 0.68, 0.4 + row * 0.4);
      const on = (Math.floor(snap.timeSec * 6) + row) % 3 !== 0;
      pxRect(ctx, led.x, led.y, 2, 1, on ? '#22d3ee' : '#1e3a5f');
      pxRect(ctx, led.x + 3, led.y + 1, 2, 1, snap.factoryActive ? '#34d399' : '#818cf8');
    }
  }
}

export function drawDeskAndMonitors(
  ctx: CanvasRenderingContext2D,
  snap: RenderSnapshot,
  pal: RoomPalette
): void {
  const dark = snap.mcbTripped;
  const deskWidth = snap.roomTier >= 3 ? 2.5 : snap.roomTier >= 2 ? 2.1 : 1.75;
  const deskX = 1.05;
  const deskY = 0.55;

  // Desk legs
  drawIsoBox(ctx, deskX, deskY, 0, 0.14, 0.14, 0.95, pal.deskLeft, pal.deskLeft, pal.deskRight);
  drawIsoBox(
    ctx,
    deskX + deskWidth - 0.14,
    deskY,
    0,
    0.14,
    0.14,
    0.95,
    pal.deskLeft,
    pal.deskLeft,
    pal.deskRight
  );
  drawIsoBox(ctx, deskX, deskY + 0.9, 0, 0.14, 0.14, 0.95, pal.deskLeft, pal.deskLeft, pal.deskRight);
  drawIsoBox(
    ctx,
    deskX + deskWidth - 0.14,
    deskY + 0.9,
    0,
    0.14,
    0.14,
    0.95,
    pal.deskLeft,
    pal.deskLeft,
    pal.deskRight
  );

  // Desk surface
  drawIsoBox(
    ctx,
    deskX,
    deskY,
    0.95,
    deskWidth,
    1.05,
    0.16,
    pal.deskTop,
    pal.deskLeft,
    pal.deskRight
  );

  // PC tower under desk for Compute Tier 2-3
  if (snap.computeTier >= 2 && snap.computeTier <= 3) {
    drawIsoBox(
      ctx,
      deskX + deskWidth - 0.45,
      deskY + 0.2,
      0,
      0.38,
      0.6,
      0.75,
      dark ? '#141824' : '#334155',
      dark ? '#0f131c' : '#1e293b',
      dark ? '#0a0d14' : '#0f172a'
    );
    if (!dark) {
      const rgb = isoProject(deskX + deskWidth - 0.35, deskY + 0.82, 0.45);
      pxRect(ctx, rgb.x, rgb.y, 2, 4, snap.computeTier >= 3 ? '#c084fc' : '#38bdf8');
    }
  }

  // Coffee mug on desk
  const mug = isoProject(deskX + deskWidth - 0.3, deskY + 0.85, 1.15);
  pxRect(ctx, mug.x - 1, mug.y - 3, 3, 3, dark ? '#242938' : '#f8fafc');
  if (!dark && Math.floor(snap.timeSec * 3) % 2 === 0) {
    pxRect(ctx, mug.x, mug.y - 5, 1, 2, 'rgba(226, 232, 240, 0.5)');
  }

  // Monitors 1 -> 5
  const centerX = deskX + deskWidth * 0.48;
  const monY = deskY + 0.22;

  // Monitor 1: Center laptop / main coding display
  drawMonitorScreen(
    ctx,
    isoProject(centerX, monY, 1.48),
    15,
    10,
    dark,
    '#34d399',
    snap.timeSec,
    snap.isTyping,
    snap.hasHallucinationDiff ? '#ef4444' : '#22c55e'
  );

  // Monitor 2: Left vertical / side display (Inbox / Bot / Docs)
  if (snap.monitors >= 2) {
    drawMonitorScreen(
      ctx,
      isoProject(centerX - 0.65, monY + 0.18, 1.54),
      11,
      12,
      dark,
      snap.botActive ? '#38bdf8' : '#60a5fa',
      snap.timeSec + 1.3,
      snap.isTyping || snap.botActive,
      '#38bdf8'
    );
  }

  // Monitor 3: Right terminal / logs display
  if (snap.monitors >= 3) {
    drawMonitorScreen(
      ctx,
      isoProject(centerX + 0.68, monY - 0.05, 1.5),
      13,
      10,
      dark,
      '#fbbf24',
      snap.timeSec + 2.7,
      snap.isTyping || snap.activeAgents > 0,
      '#f59e0b'
    );
  }

  // Monitor 4: Top-left overhead dashboard (Swarm graph)
  if (snap.monitors >= 4) {
    drawMonitorScreen(
      ctx,
      isoProject(centerX - 0.42, monY + 0.06, 2.55),
      14,
      9,
      dark,
      '#c084fc',
      snap.timeSec + 0.7,
      snap.activeAgents > 0 || snap.isTyping,
      '#a855f7'
    );
  }

  // Monitor 5: Top-right overhead factory telemetry
  if (snap.monitors >= 5) {
    drawMonitorScreen(
      ctx,
      isoProject(centerX + 0.48, monY - 0.04, 2.52),
      14,
      9,
      dark,
      '#2dd4bf',
      snap.timeSec + 3.4,
      snap.factoryActive || snap.swarmActive || snap.isTyping,
      '#14b8a6'
    );
  }
}

function drawMonitorScreen(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  w: number,
  h: number,
  dark: boolean,
  lineColor: string,
  t: number,
  animated: boolean,
  glowColor: string
): void {
  const x = Math.round(center.x - w / 2);
  const y = Math.round(center.y - h / 2);

  // Stand
  pxRect(ctx, center.x - 1, y + h, 2, 3, '#1e293b');
  pxRect(ctx, center.x - 3, y + h + 2, 6, 1, '#334155');

  // Bezel
  pxRect(ctx, x - 1, y - 1, w + 2, h + 2, '#0f172a');
  // Screen backdrop
  pxRect(ctx, x, y, w, h, dark ? '#080b12' : '#091526');

  if (dark) return;

  // Ambient screen glow
  ctx.fillStyle = `${glowColor}22`;
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);

  // Scrolling code/telemetry pixel lines
  const scrollOffset = animated ? Math.floor(t * 7) : 0;
  for (let row = 0; row < Math.floor((h - 2) / 2); row++) {
    const seed = (row + scrollOffset) * 17;
    const lineW = Math.max(3, Math.min(w - 3, 4 + (seed % (w - 4))));
    const indent = (seed % 3 === 0) ? 2 : 0;
    pxRect(ctx, x + 1 + indent, y + 1 + row * 2, Math.min(lineW, w - 2 - indent), 1, lineColor);
  }
}

export function drawVibeCoder(
  ctx: CanvasRenderingContext2D,
  snap: RenderSnapshot
): void {
  const dark = snap.mcbTripped;
  const deskWidth = snap.roomTier >= 3 ? 2.5 : snap.roomTier >= 2 ? 2.1 : 1.75;
  const cx = 1.05 + deskWidth * 0.48;
  const cy = 1.88;

  // Office / kos chair
  drawIsoBox(
    ctx,
    cx - 0.25,
    cy - 0.15,
    0,
    0.55,
    0.55,
    0.55,
    dark ? '#181c28' : '#334155',
    dark ? '#10131c' : '#1e293b',
    dark ? '#0c0f17' : '#0f172a'
  );

  const pos = isoProject(cx, cy, 0.72);
  const bob = snap.isTyping && Math.floor(snap.timeSec * 8) % 2 === 0 ? -1 : 0;

  // Hoodie torso
  pxRect(ctx, pos.x - 4, pos.y - 7 + bob, 9, 8, dark ? '#1f2538' : '#6366f1');
  pxRect(ctx, pos.x - 3, pos.y - 6 + bob, 7, 6, dark ? '#262d42' : '#818cf8');

  // Head
  pxRect(ctx, pos.x - 3, pos.y - 13 + bob, 7, 6, dark ? '#4d3a30' : '#f1c29b');
  // Hair / headphones
  pxRect(ctx, pos.x - 3, pos.y - 14 + bob, 7, 2, dark ? '#0e1118' : '#1e293b');
  pxRect(ctx, pos.x - 4, pos.y - 12 + bob, 1, 3, dark ? '#1d2436' : '#38bdf8');
  pxRect(ctx, pos.x + 4, pos.y - 12 + bob, 1, 3, dark ? '#1d2436' : '#38bdf8');

  // Typing arms
  const handOffset = snap.isTyping ? (Math.floor(snap.timeSec * 12) % 2) : 0;
  pxRect(ctx, pos.x - 5, pos.y - 5 + handOffset, 2, 3, dark ? '#4d3a30' : '#f1c29b');
  pxRect(ctx, pos.x + 4, pos.y - 5 + (1 - handOffset), 2, 3, dark ? '#4d3a30' : '#f1c29b');

  // Emotion / status indicator above head
  if (snap.mcbTripped) {
    // Startled "!" on MCB trip
    pxRect(ctx, pos.x, pos.y - 22, 2, 5, '#ef4444');
    pxRect(ctx, pos.x, pos.y - 16, 2, 2, '#ef4444');
  } else if (snap.hasHallucinationDiff) {
    // Question / head-scratch indicator on hallucination diff
    const pulse = Math.floor(snap.timeSec * 4) % 2;
    pxRect(ctx, pos.x - 1, pos.y - 21 - pulse, 3, 2, '#f59e0b');
    pxRect(ctx, pos.x + 1, pos.y - 19 - pulse, 1, 2, '#f59e0b');
    pxRect(ctx, pos.x, pos.y - 16 - pulse, 1, 1, '#f59e0b');
  } else if (snap.shipFlashRecent) {
    // Shipped celebration sparkles
    pxRect(ctx, pos.x - 5, pos.y - 20, 2, 2, '#34d399');
    pxRect(ctx, pos.x + 4, pos.y - 22, 2, 2, '#fbbf24');
    pxRect(ctx, pos.x, pos.y - 24, 2, 2, '#38bdf8');
  }
}

export function drawLiveEffects(
  ctx: CanvasRenderingContext2D,
  snap: RenderSnapshot
): void {
  if (snap.mcbTripped) {
    // Dark blackout tint
    ctx.fillStyle = 'rgba(2, 4, 10, 0.56)';
    ctx.fillRect(0, 0, 240, 150);
    // Re-draw blinking red MCB glow over darkness
    drawWallMcbBox(ctx, snap);
    return;
  }

  // Power warning flicker (>85% load)
  if (snap.powerState === 'warning' || snap.powerState === 'overload') {
    const flicker = Math.sin(snap.timeSec * 22) > 0.35;
    if (flicker) {
      ctx.fillStyle =
        snap.powerState === 'overload'
          ? 'rgba(239, 68, 68, 0.14)'
          : 'rgba(245, 158, 11, 0.1)';
      ctx.fillRect(0, 0, 240, 150);
    }
  }

  // Hermes / Grok Bot floating pixel envelopes flying to side monitor
  if (snap.botActive) {
    const t = (snap.timeSec * 0.9) % 1;
    const start = isoProject(0.4, 2.2, 2.7);
    const target = isoProject(1.5, 0.8, 1.55);
    const ex = Math.round(start.x + (target.x - start.x) * t);
    const ey = Math.round(start.y + (target.y - start.y) * t - Math.sin(t * Math.PI) * 12);
    pxRect(ctx, ex - 3, ey - 2, 6, 4, '#f8fafc');
    pxRect(ctx, ex - 2, ey - 1, 4, 1, '#38bdf8');
    if (snap.botPulseRecent) {
      pxRect(ctx, target.x - 1, target.y - 6, 3, 3, '#38bdf8');
    }
  }

  // Swarm / Software Factory glowing data packets pulsing between desk & server rack
  if (snap.swarmActive || snap.factoryActive) {
    const packetCount = snap.factoryActive ? 4 : 2;
    const a = isoProject(2.1, 0.85, 1.7);
    const b = isoProject(3.55, 0.65, 1.6);
    for (let i = 0; i < packetCount; i++) {
      const p = (snap.timeSec * 1.1 + i / packetCount) % 1;
      const px = Math.round(a.x + (b.x - a.x) * p);
      const py = Math.round(a.y + (b.y - a.y) * p - Math.sin(p * Math.PI) * 9);
      const col = i % 2 === 0 ? '#34d399' : '#c084fc';
      pxRect(ctx, px, py, 2, 2, col);
    }
  }
}

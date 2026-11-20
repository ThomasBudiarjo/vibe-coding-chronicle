export const CANVAS_W = 240;
export const CANVAS_H = 150;

export const ORIGIN_X = 120;
export const ORIGIN_Y = 58;
export const TILE_W = 26;
export const TILE_H = 13;
export const Z_SCALE = 9.5;

export interface Pt {
  x: number;
  y: number;
}

export function isoProject(wx: number, wy: number, wz = 0): Pt {
  return {
    x: Math.round(ORIGIN_X + (wx - wy) * (TILE_W / 2)),
    y: Math.round(ORIGIN_Y + (wx + wy) * (TILE_H / 2) - wz * Z_SCALE)
  };
}

export function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: readonly Pt[],
  color: string
): void {
  if (pts.length < 3) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  ctx.fill();
}

export function strokePoly(
  ctx: CanvasRenderingContext2D,
  pts: readonly Pt[],
  color: string
): void {
  if (pts.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts[0].x + 0.5, pts[0].y + 0.5);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x + 0.5, pts[i].y + 0.5);
  }
  ctx.closePath();
  ctx.stroke();
}

export function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number,
  dx: number,
  dy: number,
  dz: number,
  topColor: string,
  leftColor: string,
  rightColor: string
): void {
  const p000 = isoProject(x, y, z);
  const p100 = isoProject(x + dx, y, z);
  const p110 = isoProject(x + dx, y + dy, z);
  const p010 = isoProject(x, y + dy, z);

  const p001 = isoProject(x, y, z + dz);
  const p101 = isoProject(x + dx, y, z + dz);
  const p111 = isoProject(x + dx, y + dy, z + dz);
  const p011 = isoProject(x, y + dy, z + dz);

  // Left visible face (y + dy)
  fillPoly(ctx, [p010, p110, p111, p011], leftColor);
  // Right visible face (x + dx)
  fillPoly(ctx, [p100, p110, p111, p101], rightColor);
  // Top face (z + dz)
  fillPoly(ctx, [p001, p101, p111, p011], topColor);
  void p000;
}

export function pxRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export interface RoomPalette {
  bg: string;
  wallLeft: string;
  wallRight: string;
  wallTrim: string;
  floorA: string;
  floorB: string;
  deskTop: string;
  deskLeft: string;
  deskRight: string;
  accent: string;
}

export function getRoomPalette(roomTier: number, blackout: boolean): RoomPalette {
  if (blackout) {
    return {
      bg: '#040509',
      wallLeft: '#0e111a',
      wallRight: '#090b12',
      wallTrim: '#151926',
      floorA: '#0b0d14',
      floorB: '#080a10',
      deskTop: '#161a24',
      deskLeft: '#10131c',
      deskRight: '#0b0e16',
      accent: '#ef4444'
    };
  }

  switch (roomTier) {
    case 1:
      // Kamar Kos 3x3 — warm aged plaster & tiled kos floor
      return {
        bg: '#0a0d16',
        wallLeft: '#2c3142',
        wallRight: '#212636',
        wallTrim: '#3d445c',
        floorA: '#363b4d',
        floorB: '#2f3445',
        deskTop: '#7a5438',
        deskLeft: '#5e3f29',
        deskRight: '#4a3120',
        accent: '#f59e0b'
      };
    case 2:
      // Kontrakan Sederhana
      return {
        bg: '#090e18',
        wallLeft: '#2b394a',
        wallRight: '#202c3b',
        wallTrim: '#3d5169',
        floorA: '#3a4654',
        floorB: '#323d4a',
        deskTop: '#8f6343',
        deskLeft: '#6e4b32',
        deskRight: '#573a26',
        accent: '#38bdf8'
      };
    case 3:
      // Home Studio
      return {
        bg: '#090b17',
        wallLeft: '#262947',
        wallRight: '#1c1f38',
        wallTrim: '#404673',
        floorA: '#2e334d',
        floorB: '#272c42',
        deskTop: '#3e455c',
        deskLeft: '#2d3347',
        deskRight: '#222738',
        accent: '#818cf8'
      };
    case 4:
      // Mini Server Studio
      return {
        bg: '#070b14',
        wallLeft: '#1e2c3d',
        wallRight: '#162230',
        wallTrim: '#2d455e',
        floorA: '#233142',
        floorB: '#1d2938',
        deskTop: '#324154',
        deskLeft: '#253140',
        deskRight: '#1c2530',
        accent: '#22d3ee'
      };
    default:
      // Software Factory HQ
      return {
        bg: '#060812',
        wallLeft: '#1a2338',
        wallRight: '#12192b',
        wallTrim: '#32466e',
        floorA: '#1e2840',
        floorB: '#182036',
        deskTop: '#2c3a57',
        deskLeft: '#1f2b42',
        deskRight: '#161f33',
        accent: '#34d399'
      };
  }
}

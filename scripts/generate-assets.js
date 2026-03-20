#!/usr/bin/env node
/**
 * generate-assets.js
 *
 * Generates app icon, splash screen, Android foreground icon, and favicon as PNG.
 * Zero external dependencies — uses only Node.js built-in zlib and fs.
 *
 * Design:
 *   - Visual motif: 3×3 block puzzle grid (two interlocking L-shapes)
 *   - Icon:   1024×1024  dark warm background  (#2C2A26)
 *   - Splash: 1024×1024  warm off-white bg      (#F5F0E8)  + grid shifted slightly above center
 *   - Android foreground: 1024×1024  light bg, grid in safe-zone
 *   - Favicon: 32×32     dark bg, 2×2 mini grid
 *
 * Run:  node scripts/generate-assets.js
 */

'use strict';

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ============================================================================
// Minimal PNG encoder (CRC32 + chunk format + RGB)
// ============================================================================

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function u32be(n) {
  return Buffer.from([(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF]);
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  return Buffer.concat([u32be(data.length), tb, data, u32be(crc32(Buffer.concat([tb, data])))]);
}

function writePNG(width, height, rgba) {
  // Scanlines: 1 filter byte (0 = None) + 3 bytes RGB per pixel
  const stride = 1 + width * 3;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      const d = y * stride + 1 + x * 3;
      raw[d] = rgba[s]; raw[d + 1] = rgba[s + 1]; raw[d + 2] = rgba[s + 2];
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', Buffer.concat([u32be(width), u32be(height), Buffer.from([8, 2, 0, 0, 0])])),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ============================================================================
// Canvas (RGBA pixel buffer + drawing primitives)
// ============================================================================

function createCanvas(width, height, bgR, bgG, bgB) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = bgR; rgba[i * 4 + 1] = bgG; rgba[i * 4 + 2] = bgB; rgba[i * 4 + 3] = 255;
  }

  function setPixel(x, y, r, g, b) {
    const xi = x | 0, yi = y | 0;
    if (xi < 0 || xi >= width || yi < 0 || yi >= height) return;
    const i = (yi * width + xi) * 4;
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255;
  }

  /**
   * Signed-distance function for a rounded rectangle.
   * Returns ≤ 0 if inside, > 0 if outside.
   * cx/cy = center, hw/hh = half-width/height, r = corner radius
   */
  function sdfRR(px, py, cx, cy, hw, hh, r) {
    const ax = Math.abs(px - cx) - (hw - r);
    const ay = Math.abs(py - cy) - (hh - r);
    return Math.sqrt(Math.max(ax, 0) ** 2 + Math.max(ay, 0) ** 2)
         + Math.min(Math.max(ax, ay), 0)
         - r;
  }

  function fillRoundRect(x, y, w, h, r, R, G, B) {
    const cx = x + w / 2, cy = y + h / 2, hw = w / 2, hh = h / 2;
    for (let py = Math.floor(y); py < Math.ceil(y + h); py++)
      for (let px = Math.floor(x); px < Math.ceil(x + w); px++)
        if (sdfRR(px, py, cx, cy, hw, hh, r) <= 0)
          setPixel(px, py, R, G, B);
  }

  /**
   * Draw a block with:
   *   - top 22%: +28 lighter (highlight)
   *   - middle 60%: base colour
   *   - bottom 18%: -22 darker (shadow)
   */
  function drawBlock(x, y, w, h, r, R, G, B) {
    const cx = x + w / 2, cy = y + h / 2, hw = w / 2, hh = h / 2;
    const hlLine = y + h * 0.22;
    const shLine = y + h * 0.82;
    const hlR = Math.min(255, R + 28), hlG = Math.min(255, G + 28), hlB = Math.min(255, B + 28);
    const shR = Math.max(0,   R - 22), shG = Math.max(0,   G - 22), shB = Math.max(0,   B - 22);

    for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
      for (let px = Math.floor(x); px < Math.ceil(x + w); px++) {
        if (sdfRR(px, py, cx, cy, hw, hh, r) > 0) continue;
        if (py < hlLine)      setPixel(px, py, hlR, hlG, hlB);
        else if (py >= shLine) setPixel(px, py, shR, shG, shB);
        else                   setPixel(px, py, R,   G,   B);
      }
    }
  }

  return {
    width, height, rgba,
    setPixel, fillRoundRect, drawBlock,
    toPNG: () => writePNG(width, height, rgba),
  };
}

// ============================================================================
// Color palette (matches src/theme/index.ts)
// ============================================================================

const C = {
  DARK_BG:    [44,  42,  38 ],   // #2C2A26
  LIGHT_BG:   [245, 240, 232],   // #F5F0E8
  EMPTY_DARK: [64,  61,  56 ],   // empty cell on dark bg
  EMPTY_LITE: [218, 211, 197],   // empty cell on light bg
  BLUE:       [107, 143, 171],   // #6B8FAB slate blue
  GREEN:      [123, 169, 156],   // #7BA99C sage green
  TERRA:      [201, 123, 106],   // #C97B6A terracotta
};

// 3×3 puzzle grid: null = empty cell
// Pattern: blue L-shape (top-left) + green L-shape (bottom-right) + terracotta dot
const GRID_3x3 = [
  [C.BLUE,  C.BLUE,  null    ],
  [C.BLUE,  C.GREEN, C.GREEN ],
  [null,    C.GREEN, C.TERRA ],
];

// ============================================================================
// Grid drawing
// ============================================================================

function drawGrid3x3(canvas, startX, startY, cellSize, gap, darkMode) {
  const r = Math.round(cellSize * 0.14);
  const empty = darkMode ? C.EMPTY_DARK : C.EMPTY_LITE;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = startX + col * (cellSize + gap);
      const y = startY + row * (cellSize + gap);
      const color = GRID_3x3[row][col];
      if (color === null) {
        canvas.fillRoundRect(x, y, cellSize, cellSize, r, ...empty);
      } else {
        canvas.drawBlock(x, y, cellSize, cellSize, r, ...color);
      }
    }
  }
}

function gridLayout(canvasSize, fraction) {
  const totalGrid = Math.round(canvasSize * fraction);
  const gap       = Math.round(canvasSize * 0.023);
  const cellSize  = Math.round((totalGrid - gap * 2) / 3);
  const gridW     = cellSize * 3 + gap * 2;
  const startX    = Math.round((canvasSize - gridW) / 2);
  return { cellSize, gap, startX, gridW };
}

// ============================================================================
// Asset generators
// ============================================================================

/** App icon — 1024×1024, dark warm background */
function generateIcon(size) {
  const canvas = createCanvas(size, size, ...C.DARK_BG);
  const { cellSize, gap, startX, gridW } = gridLayout(size, 0.575);
  const startY = Math.round((size - gridW) / 2);
  drawGrid3x3(canvas, startX, startY, cellSize, gap, true);
  return canvas.toPNG();
}

/** Splash screen — 1024×1024, warm light background, grid shifted slightly above centre */
function generateSplash(size) {
  const canvas = createCanvas(size, size, ...C.LIGHT_BG);
  const { cellSize, gap, startX, gridW } = gridLayout(size, 0.60);
  const startY = Math.round((size - gridW) / 2) - Math.round(size * 0.04);
  drawGrid3x3(canvas, startX, startY, cellSize, gap, false);
  return canvas.toPNG();
}

/** Android adaptive icon foreground — 1024×1024, light bg, grid in safe zone (~67%) */
function generateAndroidFg(size) {
  const canvas = createCanvas(size, size, ...C.LIGHT_BG);
  const safeZone = Math.round(size * 0.67);
  const totalGrid = Math.round(safeZone * 0.84);
  const gap       = Math.round(size * 0.022);
  const cellSize  = Math.round((totalGrid - gap * 2) / 3);
  const gridW     = cellSize * 3 + gap * 2;
  const startX    = Math.round((size - gridW) / 2);
  const startY    = Math.round((size - gridW) / 2);
  drawGrid3x3(canvas, startX, startY, cellSize, gap, false);
  return canvas.toPNG();
}

/** Favicon — 32×32, dark bg, 2×2 simplified grid */
function generateFavicon() {
  const size = 32;
  const canvas = createCanvas(size, size, ...C.DARK_BG);
  const cell = 11, gap = 2, r = 2;
  const sx = 4, sy = 4;
  const cells = [
    { x: sx,            y: sy,            color: C.BLUE  },
    { x: sx + cell+gap, y: sy,            color: C.GREEN },
    { x: sx,            y: sy + cell+gap, color: C.BLUE  },
    { x: sx + cell+gap, y: sy + cell+gap, color: C.TERRA },
  ];
  for (const { x, y, color } of cells) {
    canvas.drawBlock(x, y, cell, cell, r, ...color);
  }
  return canvas.toPNG();
}

// ============================================================================
// Main
// ============================================================================

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const jobs = [
  { name: 'icon.png',                    gen: () => generateIcon(1024)    },
  { name: 'splash-icon.png',             gen: () => generateSplash(1024)  },
  { name: 'android-icon-foreground.png', gen: () => generateAndroidFg(1024) },
  { name: 'favicon.png',                 gen: () => generateFavicon()     },
];

console.log('Generating assets...\n');
for (const { name, gen } of jobs) {
  const data = gen();
  fs.writeFileSync(path.join(ASSETS_DIR, name), data);
  console.log(`  ✓  ${name.padEnd(32)}  ${(data.length / 1024).toFixed(0).padStart(5)} KB`);
}
console.log('\nDone.');

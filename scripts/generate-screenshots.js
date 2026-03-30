#!/usr/bin/env node
/**
 * generate-screenshots.js — Calm Blokku
 *
 * Generates App Store Connect screenshots (1290×2796) with text overlays.
 * Requires: sharp (npm install sharp)
 *
 * Input:  assets/screenshots/01_hero.png … 06_complete.png
 * Output: assets/screenshots/output/01_hero.png … 06_complete.png
 *
 * Run:  node scripts/generate-screenshots.js
 */
'use strict';

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

// ── Paths ──────────────────────────────────────────────────
const SS_DIR  = path.join(__dirname, '..', 'assets', 'screenshots');
const OUT_DIR = path.join(SS_DIR, 'output');

// ── Canvas (iPhone 6.7″ — App Store Connect accepted size) ─
const W = 1284;
const H = 2778;
const BG = { r: 245, g: 240, b: 232, alpha: 1 }; // #F5F0E8

// ── Colors ─────────────────────────────────────────────────
const TEXT_PRIMARY = '#2C2A26';
const TEXT_MUTED   = '#7A756C';
const ACCENT       = '#6B8FAB';

// ── Layout ─────────────────────────────────────────────────
const TEXT_ZONE_H   = 530;   // px reserved for text at top
const BOTTOM_PAD    = 24;    // px below screenshot
const STATUS_CROP   = 90;    // px cropped from screenshot top (status bar)
const CORNER_RADIUS = 32;    // screenshot corner radius
const SHADOW_BLUR   = 18;    // shadow blur sigma
const SHADOW_OFFSET = 6;     // shadow Y offset

// ── Screenshot definitions ─────────────────────────────────
const ITEMS = [
  {
    input:  '01_hero.png',
    output: '01_hero.png',
    main:   '1日5分の脳トレ習慣',
    sub:    '毎日届く、落ち着いたブロックパズル',
  },
  {
    input:  '02_daily.png',
    output: '02_daily.png',
    main:   '今日の3問に挑戦しよう',
    sub:    'EASY・MEDIUM・HARDの3段階',
    // Replace "Calm Brokku" with "Calm Blokku" in the screenshot
    // Coordinates are relative to the image AFTER status-bar crop
    patches: [{
      x: 250, y: 80, w: 670, h: 115,
      bg: '#F5F0E8',
      text: 'Calm Blokku',
      fontSize: 68,
      fontWeight: '700',
      textColor: '#2C2A26',
    }],
  },
  {
    input:  '03_clear.png',
    output: '03_clear.png',
    main:   '置いて、揃えて、消すだけ。',
    sub:    '8×8のボードにブロックをはめるシンプルルール',
  },
  {
    input:  '04_endless.png',
    output: '04_endless.png',
    main:   'もっと遊びたい日は\nエンドレスモード',
    sub:    'レベルが上がるほど難しくなる',
  },
  {
    input:  '05_record.png',
    output: '05_record.png',
    main:   '連続記録を伸ばそう',
    sub:    'カレンダーで毎日の達成をひと目で確認',
  },
  {
    input:  '06_complete.png',
    output: '06_complete.png',
    main:   '目に優しいデザイン',
    sub:    '落ち着いた配色で、寝る前にも安心',
  },
];

// ── Helpers ────────────────────────────────────────────────

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Create SVG text overlay for the top zone */
function buildTextSvg(mainText, subText) {
  const lines    = mainText.split('\n');
  const mainSize = lines.length > 1 ? 58 : 68;
  const subSize  = 36;
  const lineH    = mainSize * 1.5;

  const totalMainH = lines.length * lineH;
  const gap        = 40;
  const totalH     = totalMainH + gap + subSize;
  const baseY      = (TEXT_ZONE_H - totalH) / 2 + mainSize * 0.82;

  const mainEls = lines.map((line, i) =>
    `<text x="${W / 2}" y="${baseY + i * lineH}" text-anchor="middle"
       font-family="'Hiragino Sans','Hiragino Kaku Gothic ProN',sans-serif"
       font-weight="700" font-size="${mainSize}" fill="${TEXT_PRIMARY}">${esc(line)}</text>`
  ).join('\n');

  const subY = baseY + (lines.length - 1) * lineH + gap + subSize + 10;

  return Buffer.from(
`<svg width="${W}" height="${TEXT_ZONE_H}" xmlns="http://www.w3.org/2000/svg">
  ${mainEls}
  <text x="${W / 2}" y="${subY}" text-anchor="middle"
    font-family="'Hiragino Sans','Hiragino Kaku Gothic ProN',sans-serif"
    font-weight="400" font-size="${subSize}" fill="${TEXT_MUTED}">${esc(subText)}</text>
  <line x1="${W / 2 - 36}" y1="${TEXT_ZONE_H - 6}" x2="${W / 2 + 36}" y2="${TEXT_ZONE_H - 6}"
    stroke="${ACCENT}" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
</svg>`);
}

/** Create a rounded-rect mask (white on transparent) */
function maskSvg(w, h, r) {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/>
     </svg>`);
}

/** Create a shadow shape (dark rounded rect on transparent) */
function shadowSvg(w, h, r) {
  const pad = 40;
  return Buffer.from(
    `<svg width="${w + pad * 2}" height="${h + pad * 2}" xmlns="http://www.w3.org/2000/svg">
       <rect x="${pad}" y="${pad}" width="${w}" height="${h}" rx="${r}" ry="${r}"
         fill="rgba(44,42,38,0.10)"/>
     </svg>`);
}

// ── Main generation ────────────────────────────────────────

async function generateOne(item) {
  const inputPath  = path.join(SS_DIR, item.input);
  const outputPath = path.join(OUT_DIR, item.output);

  // 1. Read metadata
  const meta = await sharp(inputPath).metadata();
  const cropTop  = Math.min(STATUS_CROP, Math.round(meta.height * 0.05));
  const croppedH = meta.height - cropTop;

  // 2. Crop status bar
  let croppedBuf = await sharp(inputPath)
    .extract({ top: cropTop, left: 0, width: meta.width, height: croppedH })
    .png()
    .toBuffer();

  // 3. Apply text patches (e.g. rename "Calm Brokku" → "Calm Blokku")
  if (item.patches) {
    const layers = item.patches.map(p => {
      const svg = Buffer.from(
        `<svg width="${p.w}" height="${p.h}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${p.w}" height="${p.h}" fill="${p.bg}"/>
          <text x="${p.w / 2}" y="${p.h / 2}" text-anchor="middle" dominant-baseline="central"
            font-family="'Hiragino Sans','Hiragino Kaku Gothic ProN',sans-serif"
            font-weight="${p.fontWeight || '700'}" font-size="${p.fontSize}"
            fill="${p.textColor || TEXT_PRIMARY}">${esc(p.text)}</text>
        </svg>`);
      return { input: svg, top: p.y, left: p.x };
    });
    croppedBuf = await sharp(croppedBuf)
      .composite(layers)
      .png()
      .toBuffer();
  }

  // 4. Available area for the screenshot
  const availW = W;
  const availH = H - TEXT_ZONE_H - BOTTOM_PAD;

  // 5. Scale to fit (maintain aspect ratio)
  const scale = Math.min(availW / meta.width, availH / croppedH);
  const ssW = Math.round(meta.width * scale);
  const ssH = Math.round(croppedH * scale);

  // 6. Resize
  const resizedBuf = await sharp(croppedBuf)
    .resize(ssW, ssH)
    .ensureAlpha()
    .png()
    .toBuffer();

  // 7. Apply rounded corners
  const maskBuf = await sharp(maskSvg(ssW, ssH, CORNER_RADIUS))
    .resize(ssW, ssH)
    .png()
    .toBuffer();

  const roundedBuf = await sharp(resizedBuf)
    .composite([{ input: maskBuf, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 8. Create shadow
  const shadowPad = 40;
  const shadowBuf = await sharp(shadowSvg(ssW, ssH, CORNER_RADIUS))
    .png()
    .toBuffer();
  const blurredShadow = await sharp(shadowBuf)
    .blur(SHADOW_BLUR)
    .png()
    .toBuffer();

  // 9. Build text overlay
  const textBuf = await sharp(buildTextSvg(item.main, item.sub))
    .png()
    .toBuffer();

  // 10. Positions
  const ssX = Math.round((W - ssW) / 2);
  const ssY = TEXT_ZONE_H + Math.round((availH - ssH) / 2);
  const shX = ssX - shadowPad;
  const shY = ssY - shadowPad + SHADOW_OFFSET;

  // 11. Compose everything onto background
  await sharp({
    create: { width: W, height: H, channels: 4, background: BG },
  })
    .composite([
      { input: textBuf,        top: 0,   left: 0 },
      { input: blurredShadow,  top: Math.max(0, shY), left: Math.max(0, shX) },
      { input: roundedBuf,     top: ssY, left: ssX },
    ])
    .png()
    .toFile(outputPath);

  console.log(`  ✓ ${item.output.padEnd(22)} ${ssW}×${ssH}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Generating ${ITEMS.length} App Store screenshots (${W}×${H})...\n`);
  for (const item of ITEMS) {
    await generateOne(item);
  }
  console.log(`\nDone → ${path.relative(process.cwd(), OUT_DIR)}/`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

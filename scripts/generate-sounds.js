#!/usr/bin/env node
/**
 * Generate simple WAV sound effects for the block puzzle game.
 * No dependencies — pure PCM generation.
 *
 * Usage: node scripts/generate-sounds.js
 * Output: assets/sounds/*.wav
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

// --- WAV file writer ---

function writeWav(filePath, samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const byteRate = sampleRate * 2; // 16-bit mono
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;        // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2;         // PCM
  buffer.writeUInt16LE(1, offset); offset += 2;         // mono
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(2, offset); offset += 2;         // block align
  buffer.writeUInt16LE(16, offset); offset += 2;        // bits per sample

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = Math.round(clamped * 32767);
    buffer.writeInt16LE(int16, offset);
    offset += 2;
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`  Created: ${path.basename(filePath)} (${(fileSize / 1024).toFixed(1)} KB)`);
}

// --- Tone generators ---

function sineWave(freq, duration, volume = 0.5) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Envelope: quick attack, smooth decay
    const env = Math.exp(-t * 8 / duration);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * volume * env;
  }
  return samples;
}

function concat(...arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Float64Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function silence(duration) {
  return new Float64Array(Math.floor(SAMPLE_RATE * duration));
}

// --- Sound definitions ---

// 1. Place sound: short, soft click (wood-like)
function generatePlaceSound() {
  const numSamples = Math.floor(SAMPLE_RATE * 0.08);
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 60);
    // Mix of frequencies for a wooden "tok" sound
    samples[i] = (
      Math.sin(2 * Math.PI * 800 * t) * 0.4 +
      Math.sin(2 * Math.PI * 1200 * t) * 0.3 +
      Math.sin(2 * Math.PI * 400 * t) * 0.2
    ) * env * 0.35;
  }
  return samples;
}

// 2. Line clear sound: ascending sweep
function generateLineClearSound() {
  const numSamples = Math.floor(SAMPLE_RATE * 0.25);
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / 0.25;
    const freq = 600 + progress * 800; // sweep 600 → 1400 Hz
    const env = Math.sin(progress * Math.PI) * 0.9; // bell envelope
    samples[i] = (
      Math.sin(2 * Math.PI * freq * t) * 0.5 +
      Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.2
    ) * env * 0.3;
  }
  return samples;
}

// 3. Success sound: pleasant three-note chord (C-E-G arpeggio)
function generateSuccessSound() {
  const note1 = sineWave(523, 0.15, 0.35); // C5
  const gap1 = silence(0.05);
  const note2 = sineWave(659, 0.15, 0.35); // E5
  const gap2 = silence(0.05);
  const note3 = sineWave(784, 0.3, 0.4);   // G5 (longer)
  return concat(note1, gap1, note2, gap2, note3);
}

// 4. Level up sound: ascending scale flourish
function generateLevelUpSound() {
  const notes = [523, 587, 659, 784, 1047]; // C5 D5 E5 G5 C6
  const parts = [];
  for (let i = 0; i < notes.length; i++) {
    parts.push(sineWave(notes[i], 0.1, 0.3));
    if (i < notes.length - 1) parts.push(silence(0.03));
  }
  // Final sustained note
  parts.push(sineWave(1047, 0.25, 0.35));
  return concat(...parts);
}

// 5. Fail sound: descending two notes
function generateFailSound() {
  const note1 = sineWave(440, 0.2, 0.3);  // A4
  const gap = silence(0.08);
  const note2 = sineWave(330, 0.35, 0.25); // E4 (lower, longer)
  return concat(note1, gap, note2);
}

// --- Main ---

console.log('Generating sound effects...');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

writeWav(path.join(OUTPUT_DIR, 'place.wav'), generatePlaceSound());
writeWav(path.join(OUTPUT_DIR, 'line-clear.wav'), generateLineClearSound());
writeWav(path.join(OUTPUT_DIR, 'success.wav'), generateSuccessSound());
writeWav(path.join(OUTPUT_DIR, 'level-up.wav'), generateLevelUpSound());
writeWav(path.join(OUTPUT_DIR, 'fail.wav'), generateFailSound());

console.log('Done!');

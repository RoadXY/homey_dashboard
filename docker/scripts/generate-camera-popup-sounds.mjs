// Generates the built-in camera popup sounds in public/sounds as 16-bit mono WAV files.
// The sounds are synthesized here, so they carry no third-party licence.
// Run: node scripts/generate-camera-popup-sounds.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sounds");

/** Sine partial with a fade-in and an exponential decay. */
function partial({ frequency, start = 0, duration, amplitude = 1, decay = 0 }) {
  return (t) => {
    const local = t - start;
    if (local < 0 || local >= duration) return 0;
    const fadeIn = Math.min(1, local / 0.005);
    const fadeOut = Math.min(1, (duration - local) / 0.02);
    return amplitude * fadeIn * fadeOut * Math.exp(-decay * local) * Math.sin(2 * Math.PI * frequency * local);
  };
}

function render(duration, partials) {
  const count = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const t = i / SAMPLE_RATE;
    let value = 0;
    for (const sound of partials) value += sound(t);
    samples[i] = value;
  }
  // Normalise to 70% of full scale so every sound has the same headroom.
  const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0) || 1;
  return Int16Array.from(samples, (value) => Math.round((value / peak) * 0.7 * 32767));
}

function wav(pcm) {
  const dataBytes = pcm.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  Buffer.from(pcm.buffer).copy(buffer, 44);
  return buffer;
}

const sounds = {
  // Two-tone door chime: "ding" then a lower "dong".
  doorbell: render(2.2, [
    partial({ frequency: 880, duration: 1.1, amplitude: 0.8, decay: 3.2 }),
    partial({ frequency: 1320, duration: 0.6, amplitude: 0.2, decay: 6 }),
    partial({ frequency: 660, start: 0.6, duration: 1.6, amplitude: 0.8, decay: 2.4 }),
    partial({ frequency: 990, start: 0.6, duration: 0.9, amplitude: 0.2, decay: 4.5 }),
  ]),
  // Three short beeps for an attention-grabbing alert.
  alert: render(1.2, [
    partial({ frequency: 1000, start: 0, duration: 0.18, amplitude: 0.8 }),
    partial({ frequency: 1000, start: 0.3, duration: 0.18, amplitude: 0.8 }),
    partial({ frequency: 1000, start: 0.6, duration: 0.18, amplitude: 0.8 }),
  ]),
  // A single soft, decaying chime for a quiet notice.
  chime: render(1.8, [
    partial({ frequency: 1320, duration: 1.8, amplitude: 0.7, decay: 2.2 }),
    partial({ frequency: 1760, duration: 1.2, amplitude: 0.25, decay: 3.5 }),
  ]),
};

mkdirSync(outputDirectory, { recursive: true });
for (const [name, pcm] of Object.entries(sounds)) {
  const file = join(outputDirectory, `${name}.wav`);
  writeFileSync(file, wav(pcm));
  console.log(`wrote ${file} (${pcm.length / SAMPLE_RATE} s)`);
}

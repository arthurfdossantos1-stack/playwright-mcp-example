// Synthesizes an original 35.5s bright pop bed at 120 BPM (1 beat = 0.5s) for the
// light WebBoost reel, laid out on the narration's scene cuts (s):
// 5.4, 9, 12.9, 17.3, 22.6, 26.1, 29.3. Major-key pad (C–G–Am–F) + pluck arps,
// kick/claps from the price line, bass from the quality scene, riser into the
// ≈31s logo, impact + half-time finale.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const DUR = 35.5;
const KICK_IN = 5.4;
const BASS_IN = 9.0;
const BUILD = [17.3, 22.6];
const OUTRO = 31.0; // logo lands (Cta scene + 50 frames)
const N = Math.floor(SR * DUR);
const out = new Float32Array(N);
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");
mkdirSync(OUT, { recursive: true });

const add = (start, dur, fn) => {
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n && s0 + i < N; i++) out[s0 + i] += fn(i / SR, i / n);
};
let seed = 1;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647 - 0.5;
};

const kick = (t, g = 0.85) =>
  add(t, 0.28, (ts, p) => {
    const f = 140 - 95 * Math.min(1, ts * 9);
    return Math.sin(2 * Math.PI * f * ts) * Math.exp(-p * 7) * g;
  });
const hat = (t, g = 0.1) => add(t, 0.045, (ts, p) => rnd() * 2 * Math.exp(-p * 10) * g);
const bass = (t, f, dur = 0.11, g = 1) =>
  add(t, dur, (ts, p) => {
    const env = Math.min(1, ts * 90) * Math.exp(-p * 4);
    return (Math.sin(2 * Math.PI * f * ts) + Math.sin(2 * Math.PI * f * 3 * ts) / 3.5) * env * 0.28 * g;
  });
const impact = (t) => {
  add(t, 1.2, (ts, p) => {
    const f = 60 - 25 * Math.min(1, ts * 3);
    return Math.sin(2 * Math.PI * f * ts) * Math.exp(-p * 4) * 0.9;
  });
  add(t, 0.4, (ts, p) => rnd() * 2 * Math.exp(-p * 6) * 0.3);
};
const chord = (t, dur, freqs, g) =>
  add(t, dur, (ts, p) => {
    const env = Math.min(1, ts / 0.6) * Math.min(1, (dur - ts) / 1.2);
    return freqs.reduce((a, f) => a + Math.sin(2 * Math.PI * f * ts) + Math.sin(2 * Math.PI * f * 1.003 * ts), 0) * env * g;
  });

const clap = (t, g = 0.22) =>
  add(t, 0.12, (ts, p) => {
    const burst = ts < 0.012 || (ts > 0.018 && ts < 0.028) ? 1 : Math.exp(-(ts - 0.03) * 40);
    return rnd() * 2 * burst * Math.exp(-p * 3) * g;
  });
const pluck = (t, f, g = 0.1) =>
  add(t, 0.35, (ts, p) => (Math.sin(2 * Math.PI * f * ts) + 0.4 * Math.sin(4 * Math.PI * f * ts)) * Math.exp(-p * 6) * g);

// bright pad: C – G – Am – F, 2s per chord, loops to the logo, then C major
const PROG = [
  [130.81, 164.81, 196.0, 261.63], // C
  [98.0, 146.83, 196.0, 246.94], // G
  [110.0, 130.81, 164.81, 220.0], // Am
  [87.31, 130.81, 174.61, 220.0], // F
];
for (let k = 0, t = 0; t < OUTRO - 0.1; k++, t += 2) chord(t, Math.min(2.4, OUTRO + 0.3 - t), PROG[k % 4], 0.016);
chord(OUTRO - 0.1, DUR - OUTRO + 0.1, [130.81, 164.81, 196.0, 261.63, 329.63], 0.016);
// pluck arpeggio (8ths) over the chords, from the start
for (let e = 0; ; e++) {
  const t = 0.25 + e * 0.25;
  if (t >= OUTRO - 1) break;
  const ch = PROG[Math.floor(t / 2) % 4];
  pluck(t, ch[(e % 4)] * 2, 0.07);
}

// kicks + claps (2 & 4) + offbeat hats from the price line until the riser
for (let t = KICK_IN; t < OUTRO - 1; t += 0.5) kick(t, 0.75);
for (let t = KICK_IN + 0.5; t < OUTRO - 1; t += 1) clap(t);
for (let t = KICK_IN + 0.25; t < OUTRO - 1; t += 0.5) hat(t);
// 16th hats during the search/chat build
for (let t = BUILD[0] + 0.125; t < BUILD[1]; t += 0.25) hat(t, 0.05);
// bass 8ths following the chord roots
for (let e = 0; ; e++) {
  const t = BASS_IN + e * 0.25;
  if (t >= OUTRO - 1) break;
  bass(t, PROG[Math.floor(t / 2) % 4][0] / 2);
}
// riser into the logo
add(OUTRO - 1, 1.0, (ts, p) => rnd() * 2 * p * p * 0.4);
impact(OUTRO);
// finale: half-time kicks + claps, long C bass
for (let t = OUTRO + 1; t < DUR - 1; t += 1) kick(t, 0.5);
for (let t = OUTRO + 1.5; t < DUR - 1; t += 2) clap(t, 0.18);
bass(OUTRO, 65.41, 2.5);
bass(OUTRO + 2.5, 65.41, 2);

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(out[i]));
// drive into a tanh soft-limiter for a louder, fuller bed without hard clipping
const DRIVE = 2.2;
const g = DRIVE / peak;
const LIMIT = 0.95 / Math.tanh(DRIVE);
// short fade-out
for (let i = 0; i < N; i++) out[i] *= Math.min(1, (N - i) / (SR * 0.6));
const buf = Buffer.alloc(44 + N * 2);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 2, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) buf.writeInt16LE(Math.round(Math.tanh(out[i] * g) * LIMIT * 32767), 44 + i * 2);
writeFileSync(join(OUT, "track.wav"), buf);
console.log("track.wav written");

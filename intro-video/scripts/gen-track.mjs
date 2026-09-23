// Synthesizes an original 24.5s dark-electronic bed at 120 BPM (1 beat = 0.5s).
// Scene cuts (s): 2.5, 5, 8, 12.5, 16, 20 — kicks enter at 2.5, riser into the
// 20s logo, impact + half-time finale on the outro.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const DUR = 24.5;
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
const bass = (t, f, dur = 0.11) =>
  add(t, dur, (ts, p) => {
    const env = Math.min(1, ts * 90) * Math.exp(-p * 4);
    return (Math.sin(2 * Math.PI * f * ts) + Math.sin(2 * Math.PI * f * 3 * ts) / 3.5) * env * 0.28;
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

// pad drone, A minor → F major lift on the outro
chord(0, 20.4, [110, 130.81, 164.81], 0.022);
chord(19.9, 4.6, [87.31, 130.81, 174.61, 220], 0.02);

// kicks 2.5 → 19.0 every beat; drop out at 19 for the riser
for (let t = 2.5; t < 19; t += 0.5) kick(t);
// hats on offbeats 2.5 → 19
for (let t = 2.75; t < 19; t += 0.5) hat(t);
// 16th hats in the build section 8 → 12.5
for (let t = 8.125; t < 12.5; t += 0.25) hat(t, 0.05);
// bass 8ths 5 → 19
const pat = [55, 55, 55, 55, 55, 55, 65.41, 82.41];
for (let e = 0; ; e++) {
  const t = 5 + e * 0.25;
  if (t >= 19) break;
  bass(t, pat[e % 8]);
}
// riser into the logo
add(19, 1.0, (ts, p) => rnd() * 2 * p * p * 0.45);
impact(20);
// finale: half-time kicks + long bass notes
for (let t = 21; t < 23.5; t += 1) kick(t, 0.6);
bass(20, 43.65, 2.5);
bass(22, 55, 2.3);

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(out[i]));
const g = 0.9 / peak;
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
for (let i = 0; i < N; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i] * g)) * 32767), 44 + i * 2);
writeFileSync(join(OUT, "track.wav"), buf);
console.log("track.wav written");

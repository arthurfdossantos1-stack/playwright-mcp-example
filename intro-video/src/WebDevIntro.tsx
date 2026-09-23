import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import vo from "./vo.json";
import { Hook } from "./scenes/Hook";
import { Claim } from "./scenes/Claim";
import { Search } from "./scenes/Search";
import { BuildScene } from "./scenes/Build";
import { Speed } from "./scenes/Speed";
import { Devices } from "./scenes/Devices";
import { Outro } from "./scenes/Outro";

// Timeline in beats of the 120 BPM track (1 beat = 0.5s = 15 frames @30fps).
const FPS = 30;
const BEAT = FPS / 2;
const SCENES = [
  { C: Hook, beats: 5 },
  { C: Claim, beats: 5 },
  { C: Search, beats: 6 },
  { C: BuildScene, beats: 9 },
  { C: Speed, beats: 7 },
  { C: Devices, beats: 8 },
  { C: Outro, beats: 12 },
] as const;

const starts = SCENES.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].beats * BEAT);
  return acc;
}, []);
export const TOTAL_FRAMES = starts[starts.length - 1] + SCENES[SCENES.length - 1].beats * BEAT;

// Voice-over toggle: the narration (scripts/gen-voice.py) is kept but muted.
const WITH_VOICE = false;
const MUSIC_VOL = WITH_VOICE ? 0.22 : 0.65;
const VO_VOL = 1;
const DUCK = 0.3; // music level multiplier under the voice
// smooth duck envelope: ramps down 4 frames before each line, back up after
const duck = (f: number) =>
  !WITH_VOICE ? 1 : vo.lines.reduce((m, l) => {
    const d = interpolate(f, [l.from - 4, l.from, l.from + l.frames, l.from + l.frames + 8], [1, DUCK, DUCK, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return Math.min(m, d);
  }, 1);

// SFX land 2–3 frames before the visual hit
const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 0.6 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={FPS * 2} layout="none">
    <Audio src={staticFile(`sfx/${src}`)} volume={volume} />
  </Sequence>
);

export const WebDevIntro: React.FC = () => {
  const searchStart = starts[2];
  const typeStart = searchStart + Math.round(FPS * 0.45);
  const typeTicks = Array.from({ length: 11 }, (_, i) => typeStart + i * 4);
  return (
    <AbsoluteFill style={{ background: "#05040A" }}>
      {SCENES.map(({ C, beats }, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={beats * BEAT}>
          <C />
        </Sequence>
      ))}

      {/* music bed; ducked under the narrator when WITH_VOICE is on */}
      <Audio src={staticFile("sfx/track.wav")} volume={(f) => MUSIC_VOL * duck(f)} />
      {WITH_VOICE && vo.lines.map((l, i) => (
        <Sequence key={`vo${i}`} from={l.from} durationInFrames={l.frames + 5} layout="none">
          <Audio src={staticFile(l.file)} volume={VO_VOL} />
        </Sequence>
      ))}
      {starts.slice(1).map((s, i) => (
        <Sfx key={`w${i}`} at={s - 3} src="whoosh.wav" volume={0.3} />
      ))}
      {typeTicks.map((t, i) => (
        <Sfx key={`t${i}`} at={t} src="tick.wav" volume={0.2} />
      ))}
      <Sfx at={searchStart + Math.round(FPS * 2.1) - 2} src="pop.wav" volume={0.5} />
      <Sfx at={starts[4] + Math.round(FPS * 1.15) - 2} src="pop.wav" volume={0.45} />
      <Sfx at={starts[6] - 2} src="bass.wav" volume={0.35} />
    </AbsoluteFill>
  );
};

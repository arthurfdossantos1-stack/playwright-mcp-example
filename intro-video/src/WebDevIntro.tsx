import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import narration from "./narration.json";
import { Hook } from "./scenes/Hook";
import { Claim } from "./scenes/Claim";
import { Search } from "./scenes/Search";
import { BuildScene } from "./scenes/Build";
import { Speed } from "./scenes/Speed";
import { Devices } from "./scenes/Devices";
import { Outro } from "./scenes/Outro";

// Timeline follows the ElevenLabs narration (src/narration.json): each scene
// starts just before the sentence it illustrates. Times in seconds.
const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
const CUTS = [0, 5.1, 12.5, 17.4, 21.0, 24.8, 29.6];
export const END_SEC = 38.5;
const SCENES = [Hook, Claim, Search, BuildScene, Speed, Devices, Outro];
const starts = CUTS.map(f);
const ends = [...starts.slice(1), f(END_SEC)];
export const TOTAL_FRAMES = f(END_SEC);

const MUSIC_VOL = 0.45;
const DUCK = 0.55; // music multiplier while the narrator speaks
// smooth duck envelope over the detected speech segments
const duck = (fr: number) =>
  narration.segments.reduce((m, [a, b]) => {
    const d = interpolate(fr, [f(a as number) - 6, f(a as number), f(b as number), f(b as number) + 10], [1, DUCK, DUCK, 1], {
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
  const typeStart = searchStart + f(0.45);
  const typeTicks = Array.from({ length: 11 }, (_, i) => typeStart + i * 4);
  return (
    <AbsoluteFill style={{ background: "#05040A" }}>
      {SCENES.map((C, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={ends[i] - starts[i]}>
          <C />
        </Sequence>
      ))}

      <Audio src={staticFile("sfx/track.wav")} volume={(fr) => MUSIC_VOL * duck(fr)} />
      <Audio src={staticFile(narration.file)} volume={1} />

      {starts.slice(1).map((s, i) => (
        <Sfx key={`w${i}`} at={s - 3} src="whoosh.wav" volume={0.25} />
      ))}
      {typeTicks.map((t, i) => (
        <Sfx key={`t${i}`} at={t} src="tick.wav" volume={0.15} />
      ))}
      <Sfx at={searchStart + f(2.1) - 2} src="pop.wav" volume={0.4} />
      <Sfx at={starts[4] + f(1.15) - 2} src="pop.wav" volume={0.35} />
      <Sfx at={starts[6] - 2} src="bass.wav" volume={0.35} />
    </AbsoluteFill>
  );
};

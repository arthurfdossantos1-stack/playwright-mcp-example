import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import narration from "./narration.json";
import { Hook } from "./reel/Hook";
import { Price } from "./reel/Price";
import { Quality } from "./reel/Quality";
import { Phone } from "./reel/Phone";
import { SearchChat } from "./reel/SearchChat";
import { Deadline } from "./reel/Deadline";
import { Trust } from "./reel/Trust";
import { Cta } from "./reel/Cta";

// Timeline follows the narration (src/narration.json): each scene starts just
// before the sentence it illustrates. Times in seconds.
export const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
const CUTS = [0, 5.4, 9.0, 12.9, 17.3, 22.6, 26.1, 29.3];
export const END_SEC = 35.5;
const SCENES = [Hook, Price, Quality, Phone, SearchChat, Deadline, Trust, Cta];
const starts = CUTS.map(f);
const ends = [...starts.slice(1), f(END_SEC)];
export const TOTAL_FRAMES = f(END_SEC);

const MUSIC_VOL = 0.65;
const DUCK = 0.5; // music multiplier while the narrator speaks
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

export const WebBoostReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#F7F6FB" }}>
    {SCENES.map((C, i) => (
      <Sequence key={i} from={starts[i]} durationInFrames={ends[i] - starts[i]}>
        <C />
      </Sequence>
    ))}

    <Audio src={staticFile("sfx/track.wav")} volume={(fr) => MUSIC_VOL * duck(fr)} />
    <Audio src={staticFile(narration.file)} volume={1} />

    {starts.slice(1).map((s, i) => (
      <Sfx key={`w${i}`} at={s - 3} src="whoosh.wav" volume={0.22} />
    ))}
    {/* pops on the big hits: "cliente", "300", "10 dias", taps */}
    <Sfx at={starts[0] + 48} src="pop.wav" volume={0.35} />
    <Sfx at={starts[1] + 65} src="pop.wav" volume={0.4} />
    <Sfx at={starts[4] + 108} src="tick.wav" volume={0.35} />
    <Sfx at={starts[5] + 76} src="pop.wav" volume={0.4} />
    <Sfx at={starts[7] + 22} src="tick.wav" volume={0.35} />
    <Sfx at={starts[7] + 48} src="bass.wav" volume={0.3} />
  </AbsoluteFill>
);

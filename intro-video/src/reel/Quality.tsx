import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit } from "../components/Motion";
import { PhoneMockup, Screen } from "../components/Mockups";
import { T } from "./common";

// "com design profissional, moderno e de extrema qualidade" — one word per beat
const WORDS = [
  { text: "Profissional", at: 18 },
  { text: "Moderno", at: 47 },
  { text: "Extrema qualidade", at: 72 },
];
const PHONES: Screen[] = ["shop", "site", "stats"];

export const Quality: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const slide = interpolate(frame, [0, durationInFrames], [260, -260], { easing: theme.ease.inOut, ...clamp });
  const current = [...WORDS].reverse().find((w) => frame >= w.at);
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        {/* phones row, sliding with parallax */}
        <div
          style={{
            position: "absolute",
            top: 640,
            left: "50%",
            display: "flex",
            gap: 60,
            transform: `translateX(calc(-50% + ${slide}px))`,
          }}
        >
          {PHONES.map((s, i) => {
            const p = spring({ frame: frame - i * 5, fps, config: theme.spring.smooth });
            const mid = i === 1;
            return (
              <div
                key={s}
                style={{
                  opacity: p * (mid ? 1 : 0.85),
                  transform: `translateY(${(1 - p) * 300 + (mid ? 0 : 70)}px) scale(${mid ? 1 : 0.9})`,
                }}
              >
                <PhoneMockup height={1000} start={6 + i * 4} screen={s} />
              </div>
            );
          })}
        </div>
        {/* the word of the moment */}
        <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          {current && <Word key={current.text} text={current.text} at={current.at} last={current === WORDS[WORDS.length - 1]} />}
        </div>
      </Exit>
    </SceneShell>
  );
};

const Word: React.FC<{ text: string; at: number; last: boolean }> = ({ text, at, last }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring.snappy });
  return (
    <div
      style={{
        ...T.hero,
        fontSize: last ? 104 : 130,
        color: last ? theme.colors.primary : theme.colors.text,
        opacity: p,
        filter: `blur(${(1 - p) * 10}px)`,
        transform: `translateY(${(1 - p) * 40}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";

type SpringKey = keyof typeof theme.spring;

// Fade + rise + scale entrance
export const Entrance: React.FC<{
  delay?: number;
  rise?: number;
  from?: number;
  config?: SpringKey;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, rise = 40, from = 0.94, config = "smooth", style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring[config] });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [rise, 0])}px) scale(${interpolate(p, [0, 1], [from, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Scene wrapper exit: rise + fade + blur, faster than entrances
export const Exit: React.FC<{
  duration: number;
  length?: number;
  mode?: "up" | "zoom";
  children: React.ReactNode;
}> = ({ duration, length = 10, mode = "up", children }) => {
  const frame = useCurrentFrame();
  const r = [duration - length, duration - 1];
  const p = interpolate(frame, r, [0, 1], { easing: theme.ease.in, ...clamp });
  const transform =
    mode === "zoom" ? `scale(${1 + p * 0.25})` : `translateY(${-p * 50}px) scale(${1 - p * 0.03})`;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 1 - p,
        filter: `blur(${p * 10}px)`,
        transform,
      }}
    >
      {children}
    </div>
  );
};

// Word-by-word reveal. `highlight` = index of the one hero word.
export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  per?: number;
  gap?: number;
  highlight?: number;
  highlightColor?: string;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, per = 4, gap = 22, highlight = -1, highlightColor, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap, ...style }}>
      {text.split(" ").map((word, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.snappy });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              filter: `blur(${(1 - p) * 8}px)`,
              transform: `translateY(${interpolate(p, [0, 1], [36, 0])}px)`,
              color: i === highlight ? highlightColor ?? theme.colors.primarySoft : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// Letter-by-letter rise for big display words
export const LetterRise: React.FC<{
  text: string;
  delay?: number;
  per?: number;
  style?: React.CSSProperties;
  letterStyle?: (i: number) => React.CSSProperties;
}> = ({ text, delay = 0, per = 3, style, letterStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", ...style }}>
      {text.split("").map((ch, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.smooth });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: p,
              filter: `blur(${(1 - p) * 14}px)`,
              transform: `translateY(${interpolate(p, [0, 1], [120, 0])}px) scale(${interpolate(p, [0, 1], [0.8, 1])})`,
              ...letterStyle?.(i),
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// Typewriter: returns visible slice of text
export const useTyped = (text: string, start: number, cps: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.floor(((frame - start) / fps) * cps));
  return text.slice(0, Math.min(text.length, n));
};

export const Caret: React.FC<{ color?: string; height?: number }> = ({
  color = theme.colors.text,
  height = 40,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const on = Math.floor(frame / (fps / 2.5)) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: 3,
        height,
        marginLeft: 4,
        background: color,
        opacity: on ? 1 : 0,
        verticalAlign: "middle",
      }}
    />
  );
};

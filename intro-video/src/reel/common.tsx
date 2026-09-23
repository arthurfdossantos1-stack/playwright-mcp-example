import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";

// Shared type styles for the 1080×1920 reel
export const T = {
  hero: { fontFamily: theme.fonts.display, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, color: theme.colors.text } as React.CSSProperties,
  sub: { fontFamily: theme.fonts.body, fontWeight: 500, color: theme.colors.textDim, letterSpacing: "0.005em" } as React.CSSProperties,
};

// Visible between [from, to) with a spring entrance and a fast exit
export const Phase: React.FC<{ from: number; to?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  from,
  to = Infinity,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from - 1 || frame >= to + 10) return null;
  const inP = spring({ frame: frame - from, fps, config: theme.spring.smooth });
  const out = Number.isFinite(to) ? interpolate(frame, [to, to + 9], [0, 1], { easing: theme.ease.in, ...clamp }) : 0;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: Math.min(inP, 1 - out),
        transform: `translateY(${(1 - inP) * 40 - out * 60}px)`,
        filter: `blur(${out * 10}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Pop-in helper (scale + rise), returns a style
export const usePop = (at: number, config: keyof typeof theme.spring = "bouncy") => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring[config] });
  return {
    p,
    style: {
      opacity: Math.min(1, p * 1.4),
      transform: `translateY(${interpolate(p, [0, 1], [50, 0])}px) scale(${interpolate(p, [0, 1], [0.7, 1])})`,
    } as React.CSSProperties,
  };
};

export const useFloat = (speed = 26, amp = 8, phase = 0) => {
  const frame = useCurrentFrame();
  return Math.sin(frame / speed + phase) * amp;
};

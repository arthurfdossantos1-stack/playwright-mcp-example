import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// Layer 1 — light background: soft lavender blooms drifting, never flat white.
export const BgLight: React.FC<{ tint?: number }> = ({ tint = 1 }) => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 60) * 50;
  const d2 = Math.cos(frame / 75) * 40;
  const c = theme.colors;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #FFFFFF 0%, ${c.bg} 55%, ${c.bgAlt} 100%)`, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          left: -520 + d1,
          top: -420,
          borderRadius: "50%",
          filter: "blur(90px)",
          opacity: 0.35 * tint,
          background: `radial-gradient(circle, ${c.primarySoft}, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1100,
          right: -600 - d2,
          bottom: -380,
          borderRadius: "50%",
          filter: "blur(100px)",
          opacity: 0.28 * tint,
          background: `radial-gradient(circle, ${c.primary}, transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Layer 4 — gentle grade, keeps whites clean
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.primary, mixBlendMode: "soft-light", opacity: 0.06 }} />
  </AbsoluteFill>
);

// Layer 5 — very light procedural grain (multiply on light backgrounds)
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: noise,
        backgroundSize: "220px",
        backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
        opacity: 0.035,
        mixBlendMode: "multiply",
      }}
    />
  );
};

// Full layer stack for every scene
export const SceneShell: React.FC<{ children: React.ReactNode; tint?: number }> = ({ children, tint }) => (
  <AbsoluteFill>
    <BgLight tint={tint} />
    {children}
    <Grade />
    <Grain />
  </AbsoluteFill>
);

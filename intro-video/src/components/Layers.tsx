import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// Layer 1 — dark background with the reference's glowing "horizon" at the bottom.
export const BgGlow: React.FC<{ intensity?: number; light?: boolean }> = ({
  intensity = 1,
  light = false,
}) => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 50) * 60;
  const d2 = Math.cos(frame / 65) * 40;
  const breathe = 1 + Math.sin(frame / 28) * 0.04;
  const c = theme.colors;
  return (
    <AbsoluteFill style={{ background: light ? c.light : c.bg, overflow: "hidden" }}>
      {/* violet horizon */}
      <div
        style={{
          position: "absolute",
          width: 2600,
          height: 900,
          left: -340 + d1,
          bottom: -560,
          borderRadius: "50%",
          filter: "blur(70px)",
          opacity: intensity,
          transform: `scaleY(${breathe})`,
          background: `radial-gradient(ellipse at 50% 30%, ${c.primary} 0%, ${c.blue}CC 32%, transparent 68%)`,
        }}
      />
      {/* warm rim on the edge of the horizon */}
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 360,
          left: 700 - d2,
          bottom: -250,
          borderRadius: "50%",
          filter: "blur(80px)",
          opacity: 0.35 * intensity,
          background: `radial-gradient(ellipse, ${c.accent}, transparent 70%)`,
        }}
      />
      {/* faint top haze so the frame is never flat black */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1000,
          left: -300 - d2,
          top: -700,
          borderRadius: "50%",
          filter: "blur(90px)",
          opacity: (light ? 0.25 : 0.18) * intensity,
          background: `radial-gradient(circle, ${c.primarySoft}, transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Layer 4 — grade, above content, below grain
export const Grade: React.FC<{ light?: boolean }> = ({ light }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.primary,
        mixBlendMode: "soft-light",
        opacity: light ? 0.12 : 0.2,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.12), transparent 28%, transparent 78%, rgba(0,0,0,0.12))",
      }}
    />
  </AbsoluteFill>
);

// Layer 5a — procedural grain with flicker
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
        opacity: 0.06,
        mixBlendMode: "overlay",
      }}
    />
  );
};

// Layer 5b — vignette, topmost
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
    }}
  />
);

// Full 5-layer scene shell
export const SceneShell: React.FC<{
  children: React.ReactNode;
  light?: boolean;
  glow?: number;
}> = ({ children, light, glow = 1 }) => (
  <AbsoluteFill>
    <BgGlow light={light} intensity={glow} />
    {children}
    <Grade light={light} />
    <Grain />
    {!light && <Vignette />}
  </AbsoluteFill>
);

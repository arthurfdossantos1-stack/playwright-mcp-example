import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, LetterRise } from "../components/Motion";

// Scene 5 — light scene: "Rápido." then concentric pill with PageSpeed counter
export const Speed: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const c = theme.colors;
  const swap = Math.round(fps * 1.15);
  const wordOut = interpolate(frame, [swap - 8, swap], [0, 1], { easing: theme.ease.in, ...clamp });
  const pill = spring({ frame: frame - swap, fps, config: theme.spring.bouncy });
  const count = interpolate(
    spring({ frame: frame - swap - 4, fps, config: { damping: 30, stiffness: 60 } }),
    [0, 1],
    [0, 100],
  );
  const breathe = 1 + Math.sin(frame / 14) * 0.012;
  const rings = [0, 1, 2, 3];
  return (
    <SceneShell light glow={0.55}>
      <Exit duration={durationInFrames} mode="zoom">
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              opacity: 1 - wordOut,
              transform: `scale(${1 - wordOut * 0.2})`,
              filter: `blur(${wordOut * 12}px)`,
            }}
          >
            <LetterRise
              text="Rápido."
              per={2}
              style={{
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 300,
                letterSpacing: "-0.04em",
                color: c.ink,
              }}
            />
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          {rings.map((r) => {
            const p = spring({ frame: frame - swap - 2 - r * 3, fps, config: theme.spring.smooth });
            return (
              <div
                key={r}
                style={{
                  position: "absolute",
                  width: 760 + r * 150,
                  height: 230 + r * 150,
                  borderRadius: 999,
                  background: `rgba(124,77,255,${0.16 - r * 0.035})`,
                  border: "1px solid rgba(124,77,255,0.12)",
                  opacity: p,
                  transform: `scale(${interpolate(p, [0, 1], [0.6, 1]) * breathe})`,
                }}
              />
            );
          })}
          <div
            style={{
              opacity: pill,
              transform: `scale(${interpolate(pill, [0, 1], [0.5, 1])})`,
              width: 720,
              height: 200,
              borderRadius: 999,
              background: `linear-gradient(180deg, ${c.primarySoft}, ${c.primary})`,
              boxShadow: `inset 0 -10px 30px rgba(40,20,160,0.5), 0 30px 80px -10px ${c.glow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              color: "white",
              fontFamily: theme.fonts.display,
            }}
          >
            <span style={{ fontSize: 110, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
              {Math.round(count)}
            </span>
            <span style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.1, opacity: 0.9 }}>
              no
              <br />
              PageSpeed
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              top: 745,
              opacity: 0.75 * spring({ frame: frame - swap - 14, fps, config: theme.spring.smooth }),
              fontFamily: theme.fonts.body,
              fontWeight: 500,
              fontSize: 38,
              color: c.ink,
            }}
          >
            Leve, seguro e otimizado para o Google
          </div>
        </AbsoluteFill>
      </Exit>
    </SceneShell>
  );
};

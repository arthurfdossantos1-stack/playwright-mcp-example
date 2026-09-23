import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Entrance } from "../components/Motion";
import { TapDot } from "../components/Mockups";
import { WebBoostIcon, WebBoostWordmark, brandColors } from "../components/WebBoostLogo";
import { T } from "./common";

// "Clica em 'Saiba mais' e vem fazer o seu site com a WebBoost. Tô te esperando!"
const TAP = 24; // "Saiba mais" ≈ 30.1s
const LOGO = 50;

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const pill = spring({ frame: frame - 2, fps, config: theme.spring.bouncy });
  const tapIn = spring({ frame: frame - 4, fps, config: theme.spring.smooth });
  const press = interpolate(frame, [TAP, TAP + 16], [0, 1], { ...clamp });
  const pillPress = interpolate(frame, [TAP - 2, TAP + 2, TAP + 10], [1, 0.93, 1], { ...clamp });
  const pillOut = interpolate(frame, [LOGO - 10, LOGO], [0, 1], { easing: theme.ease.in, ...clamp });
  const glow = 0.7 + Math.sin(frame / 9) * 0.3;
  const breathe = 1 + Math.sin(frame / 24) * 0.01;
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [1, 0], { easing: theme.ease.in, ...clamp });
  return (
    <SceneShell>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        {/* "Saiba mais" pill + tap */}
        {frame < LOGO + 1 && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 1 - pillOut, transform: `scale(${1 - pillOut * 0.3})` }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  opacity: pill,
                  transform: `scale(${interpolate(pill, [0, 1], [0.5, 1]) * pillPress})`,
                  padding: "40px 110px",
                  borderRadius: 99,
                  background: `linear-gradient(135deg, ${brandColors.a}, ${brandColors.b})`,
                  boxShadow: `0 0 0 10px ${theme.colors.lav}, 0 40px ${90 * glow}px -20px ${theme.colors.glow}`,
                  color: "white",
                  fontFamily: theme.fonts.display,
                  fontWeight: 600,
                  fontSize: 84,
                }}
              >
                {brand.cta}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: interpolate(tapIn, [0, 1], [700, 360]),
                  top: interpolate(tapIn, [0, 1], [420, 70]),
                  opacity: tapIn,
                }}
              >
                <TapDot press={press} />
              </div>
            </div>
          </AbsoluteFill>
        )}
        {/* logo lockup */}
        {frame >= LOGO - 2 && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${breathe})` }}>
              <WebBoostIcon size={440} delay={LOGO} gap={theme.colors.bg} />
              <div style={{ marginTop: 50 }}>
                <WebBoostWordmark size={176} delay={LOGO + 28} />
              </div>
              <Entrance delay={LOGO + 44} style={{ marginTop: 30 }}>
                <div style={{ ...T.sub, fontSize: 50 }}>
                  {brand.tagline[0]} <span style={{ color: theme.colors.primary }}>{brand.tagline[1]}</span>
                </div>
              </Entrance>
              <Entrance delay={LOGO + 68} style={{ marginTop: 120 }}>
                <div style={{ ...T.hero, fontSize: 90 }}>Tô te esperando!</div>
              </Entrance>
              <Entrance delay={LOGO + 80} style={{ marginTop: 34 }}>
                <div style={{ ...T.sub, fontSize: 40 }}>{brand.contact}</div>
              </Entrance>
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </SceneShell>
  );
};

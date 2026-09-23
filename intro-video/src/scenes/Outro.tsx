import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Entrance } from "../components/Motion";
import { WebBoostIcon, WebBoostWordmark, brandColors } from "../components/WebBoostLogo";

// Scene 7 — WebBoost logo sting + tagline + CTA, glow only on the CTA
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const c = theme.colors;
  const breathe = 1 + Math.sin(frame / 22) * 0.012;
  const ctaGlow = 0.7 + Math.sin(frame / 10) * 0.3;
  const fadeOut = interpolate(frame, [durationInFrames - 14, durationInFrames - 1], [1, 0], {
    easing: theme.ease.in,
    ...clamp,
  });
  return (
    <SceneShell glow={1.1}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fadeOut }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${breathe})` }}>
          <WebBoostIcon size={250} />
          <div style={{ marginTop: 34 }}>
            <WebBoostWordmark size={150} delay={8} />
          </div>
          <Entrance delay={44} style={{ marginTop: 22 }}>
            <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 40, color: c.textDim, letterSpacing: "0.02em" }}>
              {brand.tagline[0]} <span style={{ color: brandColors.line }}>{brand.tagline[1]}</span>
            </div>
          </Entrance>
        </div>
        <Entrance delay={116} config="bouncy" style={{ marginTop: 48 }}>
          <div
            style={{
              padding: "24px 58px",
              borderRadius: 99,
              background: `linear-gradient(135deg, ${brandColors.a}, ${brandColors.b})`,
              boxShadow: `0 0 ${60 * ctaGlow}px ${c.primary}99, 0 0 ${120 * ctaGlow}px ${c.glow}`,
              color: "white",
              fontFamily: theme.fonts.display,
              fontWeight: 600,
              fontSize: 42,
            }}
          >
            {brand.cta} →
          </div>
        </Entrance>
        <Entrance delay={128} style={{ marginTop: 28 }}>
          <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 28, color: c.textDim }}>{brand.contact}</div>
        </Entrance>
      </AbsoluteFill>
    </SceneShell>
  );
};

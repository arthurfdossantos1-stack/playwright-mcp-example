import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Entrance, LetterRise } from "../components/Motion";
import { LogoMark } from "../components/Mockups";

// Scene 7 — logo sting + tagline + CTA, glow only on the CTA
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const c = theme.colors;
  const mark = spring({ frame, fps, config: theme.spring.bouncy });
  const rot = spring({ frame, fps, config: theme.spring.smooth });
  const breathe = 1 + Math.sin(frame / 22) * 0.015;
  const ctaGlow = 0.7 + Math.sin(frame / 10) * 0.3;
  const fadeOut = interpolate(frame, [durationInFrames - 14, durationInFrames - 1], [1, 0], {
    easing: theme.ease.in,
    ...clamp,
  });
  return (
    <SceneShell glow={1.1}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fadeOut }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36, transform: `scale(${breathe})` }}>
          <div
            style={{
              opacity: mark,
              transform: `scale(${mark}) rotate(${interpolate(rot, [0, 1], [-120, 0])}deg)`,
            }}
          >
            <LogoMark size={190} />
          </div>
          <LetterRise
            text={brand.name}
            delay={10}
            per={2}
            style={{
              fontFamily: theme.fonts.display,
              fontWeight: 700,
              fontSize: 170,
              letterSpacing: "-0.04em",
              color: c.text,
            }}
          />
          <LetterRise
            text={brand.suffix}
            delay={24}
            per={2}
            style={{
              fontFamily: theme.fonts.display,
              fontWeight: 500,
              fontSize: 170,
              letterSpacing: "-0.04em",
              color: c.textDim,
              marginLeft: -12,
            }}
          />
        </div>
        <Entrance delay={34} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 40, color: c.textDim, letterSpacing: "0.01em" }}>
            {brand.tagline}
          </div>
        </Entrance>
        <Entrance delay={46} config="bouncy" style={{ marginTop: 56 }}>
          <div
            style={{
              padding: "26px 60px",
              borderRadius: 99,
              background: `linear-gradient(135deg, ${c.primary}, ${c.blue})`,
              boxShadow: `0 0 ${60 * ctaGlow}px ${c.primary}99, 0 0 ${120 * ctaGlow}px ${c.glow}`,
              color: "white",
              fontFamily: theme.fonts.display,
              fontWeight: 600,
              fontSize: 46,
            }}
          >
            {brand.cta} →
          </div>
        </Entrance>
        <Entrance delay={58} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 30, color: c.textDim }}>{brand.contact}</div>
        </Entrance>
      </AbsoluteFill>
    </SceneShell>
  );
};

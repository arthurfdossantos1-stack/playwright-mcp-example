import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, WordReveal } from "../components/Motion";

// Scene 2 — the promise, one hero word + underline, then service tags
export const Claim: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const line = spring({ frame: frame - 16, fps, config: theme.spring.smooth });
  const tags = ["Design", "Desenvolvimento", "SEO", "Hospedagem"];
  const float = Math.sin(frame / 26) * 4;
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 46 }}>
          <div style={{ position: "relative", transform: `translateY(${float}px)` }}>
            <WordReveal
              text="Design que converte."
              per={4}
              gap={30}
              highlight={2}
              style={{
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 128,
                letterSpacing: "-0.03em",
                color: theme.colors.text,
                lineHeight: 1.05,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 20,
                bottom: -14,
                height: 8,
                width: 590 * line,
                borderRadius: 99,
                background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primarySoft})`,
                boxShadow: `0 0 30px ${theme.colors.glow}`,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {tags.map((t, i) => {
              const p = spring({ frame: frame - 24 - i * 4, fps, config: theme.spring.snappy });
              return (
                <div
                  key={t}
                  style={{
                    opacity: p,
                    transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
                    padding: "14px 28px",
                    borderRadius: 99,
                    border: `1px solid ${theme.colors.line}`,
                    background: "rgba(255,255,255,0.04)",
                    color: theme.colors.textDim,
                    fontFamily: theme.fonts.body,
                    fontWeight: 500,
                    fontSize: 30,
                  }}
                >
                  {t}
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </Exit>
    </SceneShell>
  );
};

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, WordReveal } from "../components/Motion";
import { WebBoostIcon } from "../components/WebBoostLogo";

// Scene 2 — "A WebBoost cria sites que trabalham por você, com um design que
// transforma visita em venda." Brand chip → headline → value line.
export const Claim: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const chip = spring({ frame: frame - 2, fps, config: theme.spring.snappy });
  const float = Math.sin(frame / 26) * 4;
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 44 }}>
          <div
            style={{
              opacity: chip,
              transform: `translateY(${interpolate(chip, [0, 1], [20, 0])}px) scale(${interpolate(chip, [0, 1], [0.9, 1])})`,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "12px 28px 12px 18px",
              borderRadius: 99,
              border: `1px solid ${theme.colors.line}`,
              background: "rgba(255,255,255,0.04)",
              fontFamily: theme.fonts.display,
              fontWeight: 600,
              fontSize: 34,
              color: theme.colors.text,
            }}
          >
            <WebBoostIcon size={54} delay={-40} />
            WebBoost
          </div>
          <div style={{ transform: `translateY(${float}px)` }}>
            <WordReveal
              text="Sites que trabalham por você."
              delay={Math.round(fps * 1.2)}
              per={4}
              gap={30}
              highlight={4}
              style={{
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 104,
                letterSpacing: "-0.03em",
                color: theme.colors.text,
                lineHeight: 1.05,
              }}
            />
          </div>
          <WordReveal
            text="Design que transforma visita em venda"
            delay={Math.round(fps * 3.8)}
            per={3}
            gap={13}
            style={{
              fontFamily: theme.fonts.body,
              fontWeight: 500,
              fontSize: 44,
              color: theme.colors.textDim,
            }}
          />
        </AbsoluteFill>
      </Exit>
    </SceneShell>
  );
};

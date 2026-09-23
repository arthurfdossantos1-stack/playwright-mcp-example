import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, LetterRise, WordReveal } from "../components/Motion";

// Scene 1 — "Sem site?" hook question, then the follow-up line (matches narration)
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const push = interpolate(frame, [0, durationInFrames], [1, 1.07], { easing: theme.ease.inOut, ...clamp });
  return (
    <SceneShell>
      <Exit duration={durationInFrames} mode="zoom" length={9}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${push})` }}>
          <LetterRise
            text="Sem site?"
            per={3}
            style={{
              fontFamily: theme.fonts.display,
              fontWeight: 700,
              fontSize: 330,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              marginTop: -60,
            }}
            letterStyle={(i) => ({
              background: `linear-gradient(180deg, #FFFFFF 20%, ${theme.colors.primarySoft} ${95 - i * 6}%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              paddingRight: 6,
            })}
          />
          <WordReveal
            text="ou tem um que não traz cliente nenhum?"
            delay={Math.round(fps * 2.35)}
            per={3}
            gap={16}
            style={{
              fontFamily: theme.fonts.body,
              fontWeight: 500,
              fontSize: 50,
              color: theme.colors.textDim,
              marginTop: 20,
              letterSpacing: "0.01em",
            }}
          />
        </AbsoluteFill>
      </Exit>
    </SceneShell>
  );
};

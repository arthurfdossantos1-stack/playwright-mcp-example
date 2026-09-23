import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, WordReveal } from "../components/Motion";
import { BrowserMockup } from "../components/Mockups";

// Scene 4 — tilted 3D browser rises in and the landing page assembles itself
export const BuildScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: theme.spring.smooth });
  // slow camera settle across the whole scene
  const cam = interpolate(frame, [0, durationInFrames], [0, 1], { easing: theme.ease.inOut, ...clamp });
  const rx = interpolate(rise, [0, 1], [38, 16]) - cam * 8;
  const ry = interpolate(rise, [0, 1], [-4, -10]) + cam * 6;
  const y = interpolate(rise, [0, 1], [520, 40]) - cam * 20;
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <AbsoluteFill style={{ alignItems: "center" }}>
          <WordReveal
            text="Do design ao código."
            delay={4}
            per={4}
            gap={20}
            highlight={3}
            style={{
              marginTop: 74,
              fontFamily: theme.fonts.display,
              fontWeight: 700,
              fontSize: 76,
              letterSpacing: "-0.03em",
              color: theme.colors.text,
            }}
          />
          <div style={{ perspective: 1800, marginTop: 10 }}>
            <div
              style={{
                opacity: rise,
                transform: `translateY(${y}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
                transformOrigin: "50% 100%",
              }}
            >
              <BrowserMockup width={1240} start={Math.round(fps * 0.5)} />
            </div>
          </div>
        </AbsoluteFill>
      </Exit>
    </SceneShell>
  );
};

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, WordReveal } from "../components/Motion";
import { BrowserMockup, PhoneMockup } from "../components/Mockups";

// Scene 6 — desktop + phone in parallax: "Perfeito em qualquer tela."
export const Devices: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const desk = spring({ frame, fps, config: theme.spring.smooth });
  const phone = spring({ frame: frame - 8, fps, config: theme.spring.smooth });
  const drift = interpolate(frame, [0, durationInFrames], [0, -1], { easing: theme.ease.inOut, ...clamp });
  const float = Math.sin(frame / 24) * 8;
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 110, top: 300, width: 640 }}>
            <WordReveal
              text="Perfeito em qualquer tela."
              delay={10}
              per={4}
              gap={22}
              highlight={3}
              style={{
                justifyContent: "flex-start",
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 96,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: theme.colors.text,
                rowGap: 4,
              }}
            />
            <WordReveal
              text="Responsivo no celular, tablet e desktop"
              delay={26}
              per={2}
              gap={9}
              style={{
                justifyContent: "flex-start",
                marginTop: 34,
                fontFamily: theme.fonts.body,
                fontWeight: 500,
                fontSize: 32,
                color: theme.colors.textDim,
              }}
            />
          </div>
          <div style={{ position: "absolute", left: 800, top: 170, perspective: 1800 }}>
            <div
              style={{
                opacity: desk,
                transform: `translateX(${interpolate(desk, [0, 1], [300, 0]) + drift * 40}px) rotateY(${-22 + drift * 4}deg) rotateX(6deg)`,
                transformOrigin: "0% 50%",
              }}
            >
              <BrowserMockup width={1100} start={4} />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 1420,
              top: 360,
              opacity: phone,
              transform: `translateY(${interpolate(phone, [0, 1], [400, 0]) + float + drift * 30}px) translateX(${drift * 70}px) rotate(${interpolate(phone, [0, 1], [10, -4])}deg)`,
            }}
          >
            <PhoneMockup height={640} start={14} />
          </div>
        </AbsoluteFill>
      </Exit>
    </SceneShell>
  );
};

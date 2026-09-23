import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, WordReveal } from "../components/Motion";
import { CalendarCounter } from "../components/Mockups";
import { T, usePop } from "./common";

// "E o melhor: seu site fica pronto em até 10 dias." — counter lands on "10 dias"
export const Deadline: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const LAND = 78;
  const cal = usePop(26, "smooth");
  const v = interpolate(frame, [34, LAND], [0, brand.days], { easing: theme.ease.out, ...clamp });
  const hit = interpolate(frame, [LAND, LAND + 5, LAND + 14], [1, 1.07, 1], { ...clamp });
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <WordReveal text="E o melhor:" delay={6} per={4} gap={24} style={{ ...T.hero, fontSize: 120 }} />
          <WordReveal text="seu site pronto em até" delay={22} per={3} gap={14} style={{ ...T.sub, fontSize: 60, marginTop: 26 }} />
          <div style={{ marginTop: 70, ...cal.style }}>
            <div style={{ transform: `scale(${hit})` }}>
              <CalendarCounter value={Math.round(v)} label="dias" />
            </div>
          </div>
        </div>
      </Exit>
    </SceneShell>
  );
};

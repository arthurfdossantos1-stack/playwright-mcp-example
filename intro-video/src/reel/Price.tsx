import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, WordReveal } from "../components/Motion";
import { WebBoostIcon } from "../components/WebBoostLogo";
import { T, usePop } from "./common";

// "Na WebBoost, seu site sai a partir de R$ 300" — counter lands on "300"
export const Price: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const LAND = 67;
  const chip = usePop(4, "snappy");
  const num = usePop(40, "smooth");
  const v = interpolate(frame, [40, LAND], [0, brand.priceValue], { easing: theme.ease.out, ...clamp });
  const hit = interpolate(frame, [LAND, LAND + 5, LAND + 14], [1, 1.08, 1], { ...clamp });
  const breathe = 1 + Math.sin(frame / 18) * 0.01;
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              ...chip.style,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "16px 36px 16px 22px",
              borderRadius: 99,
              background: "#FFFFFF",
              border: `1px solid ${theme.colors.line}`,
              boxShadow: theme.colors.shadowSm,
              fontFamily: theme.fonts.display,
              fontWeight: 700,
              fontSize: 50,
              color: theme.colors.navy,
            }}
          >
            <WebBoostIcon size={84} delay={-60} gap="#FFFFFF" />
            Web<span style={{ color: theme.colors.primary }}>Boost</span>
          </div>
          <WordReveal text="Seu site sai" delay={16} per={4} gap={22} style={{ ...T.hero, fontSize: 104, marginTop: 90 }} />
          <WordReveal text="a partir de" delay={30} per={3} gap={16} style={{ ...T.sub, fontSize: 62, marginTop: 24 }} />
          <div
            style={{
              ...num.style,
              marginTop: 30,
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              transform: `${num.style.transform} scale(${hit * breathe})`,
              color: theme.colors.primary,
              fontFamily: theme.fonts.display,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              textShadow: `0 30px 80px ${theme.colors.glow}`,
            }}
          >
            <span style={{ fontSize: 110, marginTop: 50 }}>R$</span>
            <span style={{ fontSize: 330, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{Math.round(v)}</span>
          </div>
        </div>
      </Exit>
    </SceneShell>
  );
};

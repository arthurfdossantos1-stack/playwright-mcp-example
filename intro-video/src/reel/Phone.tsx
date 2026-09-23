import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, WordReveal } from "../components/Motion";
import { IconBolt, IconCircle, PhoneMockup } from "../components/Mockups";
import { T, useFloat, usePop } from "./common";

// "Visual limpo e premium, rápido e perfeito no celular."
export const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const phone = spring({ frame, fps, config: theme.spring.smooth });
  const fast = usePop(62);
  const resp = usePop(92);
  const f = useFloat(30, 8);
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <WordReveal text="Visual limpo e premium" delay={2} per={5} gap={22} highlight={3} style={{ ...T.hero, fontSize: 96, width: 820, rowGap: 0 }} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 480,
            left: "50%",
            transform: `translateX(-50%) translateY(${(1 - phone) * 500 + f}px) rotate(${(1 - phone) * 8}deg)`,
            opacity: phone,
          }}
        >
          <PhoneMockup height={980} start={8} screen="site" />
        </div>
        <div style={{ position: "absolute", top: 800, right: 50, ...fast.style }}>
          <Badge icon={<IconBolt size={44} />} label="Rápido" />
        </div>
        <div style={{ position: "absolute", top: 1180, left: 40, ...resp.style }}>
          <Badge label="Responsivo" dot />
        </div>
        <div style={{ position: "absolute", top: 1560, left: 0, right: 0 }}>
          <WordReveal text="Perfeito no celular." delay={100} per={4} gap={20} style={{ ...T.hero, fontSize: 92 }} />
        </div>
      </Exit>
    </SceneShell>
  );
};

const Badge: React.FC<{ label: string; icon?: React.ReactNode; dot?: boolean }> = ({ label, icon, dot }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "18px 34px 18px 18px",
      borderRadius: 99,
      background: "#FFFFFF",
      border: `1px solid ${theme.colors.line}`,
      boxShadow: theme.colors.shadow,
      fontFamily: theme.fonts.display,
      fontWeight: 600,
      fontSize: 46,
      color: theme.colors.text,
    }}
  >
    <IconCircle size={76}>
      {icon ?? (dot ? <div style={{ width: 26, height: 26, borderRadius: 99, background: theme.colors.success }} /> : null)}
    </IconCircle>
    {label}
  </div>
);

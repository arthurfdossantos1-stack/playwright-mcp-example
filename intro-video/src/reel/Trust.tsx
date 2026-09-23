import React from "react";
import { useVideoConfig } from "remotion";
import { theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit } from "../components/Motion";
import { IconCircle, IconLock, IconStar, IconTag } from "../components/Mockups";
import { T, useFloat, usePop } from "./common";

// "Preço acessível, qualidade e segurança." — one row per word
const ROWS = [
  { label: "Preço acessível", at: 4, Icon: IconTag },
  { label: "Qualidade", at: 36, Icon: IconStar },
  { label: "Segurança", at: 62, Icon: IconLock },
];

export const Trust: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 80, paddingLeft: 90 }}>
          {ROWS.map((r, i) => (
            <Row key={r.label} {...r} i={i} />
          ))}
        </div>
      </Exit>
    </SceneShell>
  );
};

const Row: React.FC<{ label: string; at: number; Icon: React.FC<{ size: number }>; i: number }> = ({ label, at, Icon, i }) => {
  const pop = usePop(at);
  const f = useFloat(22, 5, i * 1.3);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 44, ...pop.style }}>
      <div style={{ transform: `translateY(${f}px)` }}>
        <IconCircle size={170}>
          <Icon size={86} />
        </IconCircle>
      </div>
      <span style={{ ...T.hero, fontSize: 84, color: theme.colors.text, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
};

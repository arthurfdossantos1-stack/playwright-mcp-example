import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, WordReveal, useTyped } from "../components/Motion";
import { ChatBubble, IconChat, SearchResultCard, TapDot } from "../components/Mockups";
import { Phase, T, usePop } from "./common";

// "Otimizado pro Google, com WhatsApp integrado, pro seu cliente falar com você em um clique."
const QUERY = "site de loja perto de mim";
const SWAP = 50; // "com WhatsApp integrado" starts ≈ 19.0s
const TAP = 110; // "…falar com você em um clique"

export const SearchChat: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const typed = useTyped(QUERY, 6, 22);
  const result = spring({ frame: frame - 34, fps, config: theme.spring.smooth });
  const btn = usePop(SWAP + 22);
  const press = interpolate(frame, [TAP, TAP + 16], [0, 1], { ...clamp });
  const btnScale = interpolate(frame, [TAP - 2, TAP + 2, TAP + 10], [1, 0.94, 1], { ...clamp });
  const tapIn = spring({ frame: frame - (TAP - 22), fps, config: theme.spring.smooth });
  const tx = interpolate(tapIn, [0, 1], [320, 120]);
  const ty = interpolate(tapIn, [0, 1], [260, 30]);
  const bubble = usePop(TAP + 6, "snappy");
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <Phase from={0} to={SWAP - 6}>
          <WordReveal text="Otimizado pro Google" delay={2} per={4} gap={22} highlight={2} style={{ ...T.hero, fontSize: 100, width: 900 }} />
          <div style={{ marginTop: 70 }}>
            <SearchResultCard query={QUERY} typed={typed} showResult={result} />
          </div>
        </Phase>
        <Phase from={SWAP}>
          <WordReveal text="WhatsApp integrado" delay={SWAP + 2} per={4} gap={22} style={{ ...T.hero, fontSize: 100 }} />
          <WordReveal text="seu cliente fala com você" delay={SWAP + 12} per={3} gap={14} style={{ ...T.sub, fontSize: 56, marginTop: 24 }} />
          <div style={{ width: 880, marginTop: 80, display: "flex", flexDirection: "column", gap: 40, minHeight: 420 }}>
            <div style={{ position: "relative", alignSelf: "center", ...btn.style }}>
              <div
                style={{
                  transform: `scale(${btnScale})`,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "30px 56px",
                  borderRadius: 99,
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.blue})`,
                  boxShadow: `0 30px 70px -20px ${theme.colors.glow}`,
                  color: "white",
                  fontFamily: theme.fonts.display,
                  fontWeight: 600,
                  fontSize: 52,
                }}
              >
                <IconChat size={54} />
                Falar no WhatsApp
              </div>
              <div style={{ position: "absolute", left: tx + 340, top: ty + 30, opacity: tapIn }}>
                <TapDot press={press} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", ...bubble.style }}>
              <ChatBubble text="Oi! Vi seu site e quero um orçamento." />
            </div>
          </div>
        </Phase>
      </Exit>
    </SceneShell>
  );
};

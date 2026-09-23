import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, clamp, theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Caret, Exit, useTyped } from "../components/Motion";
import { Cursor, Lock } from "../components/Mockups";

// Scene 3 — URL typed into a glowing bar, cursor flies in and clicks
export const Search: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const c = theme.colors;
  const enter = spring({ frame, fps, config: theme.spring.smooth });
  const typeStart = Math.round(fps * 0.45);
  const typed = useTyped(brand.url, typeStart, 16);
  const clickAt = Math.round(fps * 2.1);
  const cursorP = spring({ frame: frame - Math.round(fps * 1.35), fps, config: theme.spring.smooth });
  const cx = interpolate(cursorP, [0, 1], [1180, 905]);
  const cy = interpolate(cursorP, [0, 1], [330, 52]);
  const btn = spring({ frame: frame - Math.round(fps * 1.2), fps, config: theme.spring.bouncy });
  const press = interpolate(frame, [clickAt - 2, clickAt, clickAt + 6], [1, 0.95, 1], { easing: theme.ease.out, ...clamp });
  const ripple = interpolate(frame, [clickAt, clickAt + 22], [0, 1], { easing: theme.ease.out, ...clamp });
  const glow = 0.6 + Math.sin(frame / 12) * 0.15 + (frame > clickAt ? 0.4 * (1 - ripple) : 0);
  return (
    <SceneShell>
      <Exit duration={durationInFrames} mode="zoom" length={9}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              position: "relative",
              opacity: enter,
              transform: `translateY(${(1 - enter) * 40}px) scale(${interpolate(enter, [0, 1], [0.9, 1]) * press})`,
            }}
          >
            {/* ripple */}
            <div
              style={{
                position: "absolute",
                inset: -20 - ripple * 60,
                borderRadius: 99,
                border: `2px solid ${c.primarySoft}`,
                opacity: frame > clickAt ? (1 - ripple) * 0.8 : 0,
              }}
            />
            <div
              style={{
                width: 980,
                height: 118,
                borderRadius: 99,
                background: "rgba(10,8,20,0.9)",
                boxShadow: `0 0 0 2px ${c.primary}, 0 0 ${50 * glow}px ${c.primary}AA, 0 0 ${120 * glow}px ${c.glow}`,
                display: "flex",
                alignItems: "center",
                padding: "0 46px",
                gap: 22,
                fontFamily: theme.fonts.body,
                fontSize: 44,
                fontWeight: 500,
                color: c.text,
              }}
            >
              <Lock size={30} />
              <span>
                <span style={{ color: c.textDim }}>https://</span>
                {typed}
              </span>
              <Caret height={46} />
              <div
                style={{
                  marginLeft: "auto",
                  width: 78,
                  height: 78,
                  borderRadius: 99,
                  background: `linear-gradient(135deg, ${c.primary}, ${c.blue})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: btn,
                  transform: `scale(${interpolate(btn, [0, 1], [0.4, 1])})`,
                  marginRight: -26,
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24">
                  <path d="M5 12 H19 M13 6 L19 12 L13 18" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div style={{ position: "absolute", left: cx, top: cy, opacity: cursorP }}>
              <Cursor size={72} />
            </div>
          </div>
        </AbsoluteFill>
      </Exit>
    </SceneShell>
  );
};

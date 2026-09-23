import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, clamp, theme } from "../theme";

const c = theme.colors;

// Block that "builds in": grows from the left + fades, staggered by delay
const Build: React.FC<{ delay: number; style: React.CSSProperties; children?: React.ReactNode }> = ({
  delay,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.snappy });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px) scaleX(${interpolate(p, [0, 1], [0.6, 1])})`,
        transformOrigin: "left center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Line: React.FC<{ w: string; h: number; o?: number }> = ({ w, h, o = 0.09 }) => (
  <div style={{ height: h, width: w, borderRadius: 99, background: `rgba(21,19,31,${o})` }} />
);

// ---------- Phone with a light website (3 screen variants) ----------
export type Screen = "site" | "shop" | "stats";

export const PhoneMockup: React.FC<{ height: number; start?: number; screen?: Screen }> = ({
  height,
  start = 0,
  screen = "site",
}) => {
  const w = height * 0.49;
  const s = height / 800;
  const d = (n: number) => start + n;
  return (
    <div
      style={{
        width: w,
        height,
        borderRadius: 56 * s,
        padding: 11 * s,
        background: "#FFFFFF",
        border: `${2 * s}px solid #E4E1EE`,
        boxShadow: c.shadow,
        fontFamily: theme.fonts.body,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 46 * s,
          overflow: "hidden",
          background: `linear-gradient(180deg, #FFFFFF, ${c.bg})`,
          padding: `${62 * s}px ${26 * s}px`,
          display: "flex",
          flexDirection: "column",
          gap: 20 * s,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 16 * s,
            left: "50%",
            transform: "translateX(-50%)",
            width: 110 * s,
            height: 30 * s,
            borderRadius: 99,
            background: "#15131F",
          }}
        />
        <Build delay={d(0)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 * s }}>
            <LogoMark size={30 * s} />
            <span style={{ fontFamily: theme.fonts.display, fontWeight: 600, fontSize: 19 * s, color: c.text }}>
              Seu Negócio
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 * s }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 24 * s, height: 3 * s, background: c.textDim, borderRadius: 9 }} />
            ))}
          </div>
        </Build>

        {screen === "site" && (
          <>
            <Build
              delay={d(5)}
              style={{
                color: c.text,
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 40 * s,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Seu negócio, <span style={{ color: c.primary }}>no topo.</span>
            </Build>
            <Build delay={d(9)} style={{ display: "flex", flexDirection: "column", gap: 8 * s }}>
              <Line w="95%" h={9 * s} />
              <Line w="70%" h={9 * s} o={0.06} />
            </Build>
            <Build
              delay={d(12)}
              style={{
                padding: 16 * s,
                borderRadius: 14 * s,
                background: `linear-gradient(135deg, ${c.primary}, ${c.blue})`,
                color: "white",
                fontWeight: 600,
                fontSize: 18 * s,
                textAlign: "center",
              }}
            >
              Fale conosco
            </Build>
            <Build
              delay={d(15)}
              style={{
                height: 200 * s,
                borderRadius: 18 * s,
                background: `linear-gradient(140deg, ${c.lav}, #F6F2FF 55%, #E9E3FF)`,
                border: `1px solid ${c.line}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <MiniChart delay={d(20)} />
            </Build>
            {[0, 1].map((i) => (
              <Build
                key={i}
                delay={d(19 + i * 4)}
                style={{ height: 60 * s, borderRadius: 14 * s, background: "#FFFFFF", border: `1px solid ${c.line}` }}
              />
            ))}
          </>
        )}

        {screen === "shop" && (
          <>
            <Build
              delay={d(5)}
              style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 34 * s, color: c.text, letterSpacing: "-0.02em" }}
            >
              Loja online
            </Build>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 * s }}>
              {[0, 1, 2, 3].map((i) => (
                <Build
                  key={i}
                  delay={d(8 + i * 3)}
                  style={{
                    height: 170 * s,
                    borderRadius: 16 * s,
                    background: "#FFFFFF",
                    border: `1px solid ${c.line}`,
                    padding: 10 * s,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8 * s,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      borderRadius: 10 * s,
                      background: i % 2 ? `linear-gradient(140deg, ${c.lav}, #FFFFFF)` : `linear-gradient(140deg, #E9E3FF, ${c.lav})`,
                    }}
                  />
                  <Line w="80%" h={7 * s} />
                  <div style={{ fontSize: 14 * s, fontWeight: 600, color: c.primary }}>R$ 89,90</div>
                </Build>
              ))}
            </div>
          </>
        )}

        {screen === "stats" && (
          <>
            <Build
              delay={d(5)}
              style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 34 * s, color: c.text, letterSpacing: "-0.02em" }}
            >
              Visitas
            </Build>
            <Build
              delay={d(8)}
              style={{
                height: 220 * s,
                borderRadius: 18 * s,
                background: "#FFFFFF",
                border: `1px solid ${c.line}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <MiniChart delay={d(12)} />
            </Build>
            <div style={{ display: "flex", gap: 12 * s }}>
              {["+128%", "4,9★"].map((t, i) => (
                <Build
                  key={t}
                  delay={d(14 + i * 4)}
                  style={{
                    flex: 1,
                    padding: 14 * s,
                    borderRadius: 14 * s,
                    background: "#FFFFFF",
                    border: `1px solid ${c.line}`,
                    fontFamily: theme.fonts.display,
                    fontWeight: 700,
                    fontSize: 26 * s,
                    color: c.text,
                  }}
                >
                  {t}
                </Build>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Rising line chart
const MiniChart: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 36], [0, 1], { easing: theme.ease.out, ...clamp });
  const pts = [[0, 200], [60, 185], [120, 190], [180, 150], [240, 160], [300, 110], [360, 120], [420, 60], [480, 40]];
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <svg viewBox="0 0 480 240" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <path
        d={path}
        fill="none"
        stroke={c.primary}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
      <circle cx={480 * p} cy={200 - 160 * p} r={11 * p} fill={c.primary} opacity={p} />
    </svg>
  );
};

// ---------- Floating cards ----------
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.92)",
  border: `1px solid ${c.line}`,
  boxShadow: c.shadowSm,
  fontFamily: theme.fonts.body,
};

// iOS-style notification: "Novo cliente"
export const NotificationCard: React.FC<{ title: string; body: string; width?: number }> = ({ title, body, width = 640 }) => (
  <div style={{ ...card, width, borderRadius: 34, padding: "24px 28px", display: "flex", gap: 22, alignItems: "center" }}>
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: 20,
        background: `linear-gradient(135deg, ${c.primary}, ${c.blue})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <IconPerson size={40} color="white" />
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 30, color: c.text }}>{title}</span>
        <span style={{ fontSize: 24, color: c.textDim }}>agora</span>
      </div>
      <span style={{ fontSize: 28, color: c.textDim }}>{body}</span>
    </div>
  </div>
);

// Generic search result (no search-engine branding)
export const SearchResultCard: React.FC<{ query: string; typed: string; showResult: number }> = ({ query, typed, showResult }) => (
  <div style={{ ...card, width: 880, borderRadius: 40, padding: 34, display: "flex", flexDirection: "column", gap: 28 }}>
    <div
      style={{
        height: 96,
        borderRadius: 99,
        border: `2px solid ${c.line}`,
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 30px",
        fontSize: 36,
        color: c.text,
      }}
    >
      <IconSearch size={34} />
      <span>{typed}</span>
      {typed.length < query.length && <span style={{ width: 3, height: 40, background: c.primary }} />}
    </div>
    <div
      style={{
        opacity: showResult,
        transform: `translateY(${(1 - showResult) * 30}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "24px 26px",
        borderRadius: 26,
        background: c.lav,
        border: `2px solid ${c.primary}33`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            padding: "6px 16px",
            borderRadius: 99,
            background: c.primary,
            color: "white",
            fontWeight: 700,
            fontSize: 24,
            fontFamily: theme.fonts.display,
          }}
        >
          1º
        </div>
        <span style={{ fontSize: 26, color: c.textDim }}>{brand.url}</span>
      </div>
      <span style={{ fontFamily: theme.fonts.display, fontWeight: 600, fontSize: 38, color: c.text }}>
        Seu Negócio — o melhor da cidade
      </span>
      <Line w="85%" h={12} o={0.08} />
    </div>
  </div>
);

// Chat bubble (incoming or outgoing)
export const ChatBubble: React.FC<{ text: string; out?: boolean }> = ({ text, out }) => (
  <div
    style={{
      alignSelf: out ? "flex-end" : "flex-start",
      maxWidth: 680,
      padding: "24px 32px",
      borderRadius: 40,
      borderBottomLeftRadius: out ? 40 : 12,
      borderBottomRightRadius: out ? 12 : 40,
      background: out ? `linear-gradient(135deg, ${c.primary}, ${c.blue})` : "#FFFFFF",
      color: out ? "white" : c.text,
      border: out ? "none" : `1px solid ${c.line}`,
      boxShadow: c.shadowSm,
      fontFamily: theme.fonts.body,
      fontWeight: 500,
      fontSize: 38,
      lineHeight: 1.25,
    }}
  >
    {text}
  </div>
);

// Calendar tile with a big day counter
export const CalendarCounter: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div style={{ ...card, width: 520, borderRadius: 56, overflow: "hidden", display: "flex", flexDirection: "column" }}>
    <div
      style={{
        height: 110,
        background: `linear-gradient(135deg, ${c.primary}, ${c.blue})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 70,
      }}
    >
      {[0, 1].map((i) => (
        <div key={i} style={{ width: 22, height: 22, borderRadius: 99, background: "rgba(255,255,255,0.85)" }} />
      ))}
    </div>
    <div style={{ padding: "30px 0 44px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span
        style={{
          fontFamily: theme.fonts.display,
          fontWeight: 700,
          fontSize: 260,
          lineHeight: 1,
          letterSpacing: "-0.05em",
          color: c.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span style={{ fontFamily: theme.fonts.display, fontWeight: 600, fontSize: 56, color: c.primary }}>{label}</span>
    </div>
  </div>
);

// Icon in a soft circle
export const IconCircle: React.FC<{ size: number; children: React.ReactNode; hero?: boolean }> = ({ size, children, hero }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 99,
      background: hero ? `linear-gradient(135deg, ${c.primary}, ${c.blue})` : "#FFFFFF",
      border: hero ? "none" : `1px solid ${c.line}`,
      boxShadow: c.shadowSm,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);

// ---------- Icons (theme colors only, no emoji) ----------
type IconProps = { size: number; color?: string };
export const IconTag: React.FC<IconProps> = ({ size, color = c.primary }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
    <circle cx="8" cy="8" r="1.6" fill={color} />
  </svg>
);
export const IconStar: React.FC<IconProps> = ({ size, color = c.primary }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
  </svg>
);
export const IconLock: React.FC<IconProps> = ({ size, color = c.primary }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill={color} stroke="none" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);
export const IconPerson: React.FC<IconProps> = ({ size, color = c.primary }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="12" cy="8" r="4.2" />
    <path d="M3.8 21c.8-4.4 4.2-6.8 8.2-6.8s7.4 2.4 8.2 6.8z" />
  </svg>
);
export const IconSearch: React.FC<IconProps> = ({ size, color = c.textDim }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
  </svg>
);
export const IconChat: React.FC<IconProps> = ({ size, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
  </svg>
);
export const IconBolt: React.FC<IconProps> = ({ size, color = c.primary }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
  </svg>
);

// Tap cursor (finger-dot style, like the reference)
export const TapDot: React.FC<{ press: number }> = ({ press }) => (
  <div style={{ position: "relative", width: 80, height: 80 }}>
    <div
      style={{
        position: "absolute",
        inset: -40 * press,
        borderRadius: 99,
        border: `3px solid ${c.primary}`,
        opacity: press > 0 ? 1 - press : 0,
      }}
    />
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: 99,
        background: "rgba(21,19,31,0.28)",
        border: "3px solid rgba(255,255,255,0.9)",
        transform: `scale(${1 - 0.18 * Math.sin(Math.PI * Math.min(1, press * 2))})`,
      }}
    />
  </div>
);

// Generic placeholder mark for the demo client's site ("Seu Negócio")
export const LogoMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect x="6" y="6" width="88" height="88" rx="26" fill={c.primary} />
    <circle cx="50" cy="50" r="18" fill="white" opacity="0.9" />
  </svg>
);

import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, clamp, theme } from "../theme";

const c = theme.colors;

// Block that "builds in": grows from the left + fades, staggered by delay
const Build: React.FC<{
  delay: number;
  style: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ delay, style, children }) => {
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

// Glowing rim like the reference: violet on the left, warm orange on the right
export const rimShadow = (strength = 1) =>
  [
    `0 0 0 1.5px rgba(165,139,255,${0.55 * strength})`,
    `-18px 0 60px -10px ${c.primary}${strength > 0.5 ? "AA" : "55"}`,
    `18px 0 60px -10px ${c.accent}${strength > 0.5 ? "88" : "44"}`,
    "0 60px 120px -30px rgba(0,0,0,0.8)",
  ].join(", ");

// Desktop browser showing a landing page that assembles itself
export const BrowserMockup: React.FC<{
  width: number;
  start?: number;
  url?: string;
}> = ({ width, start = 0, url = brand.url }) => {
  const h = width * 0.54;
  const s = width / 1200; // design at 1200px, scale everything
  const d = (n: number) => start + n;
  return (
    <div
      style={{
        width,
        height: h,
        borderRadius: 22 * s,
        background: `linear-gradient(180deg, ${c.bgAlt}, ${c.bg})`,
        boxShadow: rimShadow(1),
        overflow: "hidden",
        fontFamily: theme.fonts.body,
      }}
    >
      {/* chrome bar */}
      <div
        style={{
          height: 54 * s,
          display: "flex",
          alignItems: "center",
          gap: 10 * s,
          padding: `0 ${22 * s}px`,
          borderBottom: `1px solid ${c.line}`,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        {["#FF5F57", "#FEBC2E", "#28C840"].map((col) => (
          <div key={col} style={{ width: 13 * s, height: 13 * s, borderRadius: 99, background: col, opacity: 0.85 }} />
        ))}
        <div
          style={{
            marginLeft: 24 * s,
            height: 30 * s,
            flex: 1,
            maxWidth: 520 * s,
            borderRadius: 99,
            background: "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            padding: `0 ${16 * s}px`,
            color: c.textDim,
            fontSize: 15 * s,
            gap: 8 * s,
          }}
        >
          <Lock size={12 * s} />
          {url}
        </div>
      </div>

      {/* page */}
      <div style={{ padding: `${28 * s}px ${48 * s}px`, display: "flex", flexDirection: "column", gap: 26 * s }}>
        {/* nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Build delay={d(0)} style={{ display: "flex", alignItems: "center", gap: 10 * s }}>
            <LogoMark size={28 * s} />
            <span style={{ color: c.text, fontFamily: theme.fonts.display, fontWeight: 600, fontSize: 19 * s }}>
              Seu Negócio
            </span>
          </Build>
          <div style={{ display: "flex", gap: 28 * s, alignItems: "center" }}>
            {["Início", "Serviços", "Portfólio", "Contato"].map((t, i) => (
              <Build key={t} delay={d(3 + i * 2)} style={{ color: c.textDim, fontSize: 15 * s }}>
                {t}
              </Build>
            ))}
          </div>
        </div>

        {/* hero */}
        <div style={{ display: "flex", gap: 40 * s, alignItems: "center", marginTop: 14 * s }}>
          <div style={{ flex: 1.1, display: "flex", flexDirection: "column", gap: 16 * s }}>
            <Build
              delay={d(10)}
              style={{
                alignSelf: "flex-start",
                padding: `${6 * s}px ${14 * s}px`,
                borderRadius: 99,
                border: `1px solid ${c.primary}66`,
                color: c.primarySoft,
                fontSize: 13 * s,
                fontWeight: 600,
              }}
            >
              NOVO · Loja online
            </Build>
            <Build
              delay={d(13)}
              style={{
                color: c.text,
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 46 * s,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              Seu negócio,
              <br />
              <span style={{ color: c.primarySoft }}>no topo do Google.</span>
            </Build>
            <Build delay={d(17)} style={{ display: "flex", flexDirection: "column", gap: 8 * s }}>
              <div style={{ height: 10 * s, width: "92%", borderRadius: 99, background: "rgba(255,255,255,0.10)" }} />
              <div style={{ height: 10 * s, width: "70%", borderRadius: 99, background: "rgba(255,255,255,0.07)" }} />
            </Build>
            <div style={{ display: "flex", gap: 12 * s, marginTop: 6 * s }}>
              <Build
                delay={d(21)}
                style={{
                  padding: `${13 * s}px ${24 * s}px`,
                  borderRadius: 12 * s,
                  background: `linear-gradient(135deg, ${c.primary}, ${c.blue})`,
                  color: "white",
                  fontWeight: 600,
                  fontSize: 15 * s,
                }}
              >
                Fale conosco
              </Build>
              <Build
                delay={d(24)}
                style={{
                  padding: `${13 * s}px ${24 * s}px`,
                  borderRadius: 12 * s,
                  border: `1px solid ${c.line}`,
                  color: c.text,
                  fontSize: 15 * s,
                }}
              >
                Ver planos
              </Build>
            </div>
          </div>
          <Build
            delay={d(16)}
            style={{
              flex: 1,
              height: 260 * s,
              borderRadius: 18 * s,
              background: `linear-gradient(140deg, ${c.primary}55, ${c.blue}33 45%, ${c.accent}33)`,
              border: `1px solid ${c.line}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <MiniChart s={s} delay={d(22)} />
          </Build>
        </div>

        {/* feature cards */}
        <div style={{ display: "flex", gap: 18 * s, marginTop: 8 * s }}>
          {["SEO", "Rápido", "Seguro"].map((t, i) => (
            <Build
              key={t}
              delay={d(27 + i * 4)}
              style={{
                flex: 1,
                height: 92 * s,
                borderRadius: 14 * s,
                background: "rgba(255,255,255,0.035)",
                border: `1px solid ${c.line}`,
                padding: 16 * s,
                display: "flex",
                flexDirection: "column",
                gap: 10 * s,
              }}
            >
              <div style={{ color: c.text, fontWeight: 600, fontSize: 16 * s }}>{t}</div>
              <div style={{ height: 8 * s, width: "80%", borderRadius: 99, background: "rgba(255,255,255,0.08)" }} />
              <div style={{ height: 8 * s, width: "55%", borderRadius: 99, background: "rgba(255,255,255,0.06)" }} />
            </Build>
          ))}
        </div>
      </div>
    </div>
  );
};

// Rising line chart inside the hero image block
const MiniChart: React.FC<{ s: number; delay: number }> = ({ s, delay }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 40], [0, 1], { easing: theme.ease.out, ...clamp });
  const pts = [
    [0, 200], [60, 185], [120, 190], [180, 150], [240, 160], [300, 110], [360, 120], [420, 60], [480, 40],
  ];
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <svg viewBox="0 0 480 240" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="lg" x1="0" x2="1">
          <stop offset="0" stopColor={c.primarySoft} />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="url(#lg)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
      <circle cx={480 * p} cy={200 - 160 * p} r={9 * p} fill="white" opacity={p} />
    </svg>
  );
};

// Phone mockup with the same site in mobile layout
export const PhoneMockup: React.FC<{ height: number; start?: number }> = ({ height, start = 0 }) => {
  const w = height * 0.49;
  const s = height / 800;
  const d = (n: number) => start + n;
  return (
    <div
      style={{
        width: w,
        height,
        borderRadius: 54 * s,
        padding: 12 * s,
        background: "#0B0A12",
        boxShadow: rimShadow(1),
        fontFamily: theme.fonts.body,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 44 * s,
          overflow: "hidden",
          background: `linear-gradient(180deg, ${c.bgAlt}, ${c.bg})`,
          padding: `${58 * s}px ${26 * s}px`,
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
            background: "#000",
          }}
        />
        <Build delay={d(0)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <LogoMark size={30 * s} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 * s }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 24 * s, height: 3 * s, background: c.textDim, borderRadius: 9 }} />
            ))}
          </div>
        </Build>
        <Build
          delay={d(5)}
          style={{
            color: c.text,
            fontFamily: theme.fonts.display,
            fontWeight: 700,
            fontSize: 38 * s,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Seu negócio, <span style={{ color: c.primarySoft }}>no topo.</span>
        </Build>
        <Build delay={d(9)} style={{ display: "flex", flexDirection: "column", gap: 8 * s }}>
          <div style={{ height: 9 * s, width: "95%", borderRadius: 99, background: "rgba(255,255,255,0.10)" }} />
          <div style={{ height: 9 * s, width: "70%", borderRadius: 99, background: "rgba(255,255,255,0.07)" }} />
        </Build>
        <Build
          delay={d(12)}
          style={{
            padding: `${16 * s}px`,
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
            height: 210 * s,
            borderRadius: 18 * s,
            background: `linear-gradient(140deg, ${c.primary}55, ${c.blue}33 45%, ${c.accent}33)`,
            border: `1px solid ${c.line}`,
          }}
        />
        {[0, 1].map((i) => (
          <Build
            key={i}
            delay={d(19 + i * 4)}
            style={{
              height: 64 * s,
              borderRadius: 14 * s,
              background: "rgba(255,255,255,0.035)",
              border: `1px solid ${c.line}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Generic placeholder mark for the demo client's site ("Seu Negócio")
export const LogoMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="lm1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c.primarySoft} />
        <stop offset="1" stopColor={c.blue} />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="26" fill="url(#lm1)" />
    <circle cx="50" cy="50" r="18" fill="white" opacity="0.9" />
  </svg>
);

export const Lock: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 12 12">
    <rect x="2" y="5" width="8" height="6" rx="1.5" fill={c.textDim} />
    <path d="M4 5 V3.5 a2 2 0 0 1 4 0 V5" stroke={c.textDim} strokeWidth="1.3" fill="none" />
  </svg>
);

export const Cursor: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 14px ${c.glow})` }}>
    <path
      d="M6 4 L34 18 L21 21 L15 34 Z"
      fill={c.primarySoft}
      stroke="white"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

// theme.ts — single source of truth. Never inline colors/easings in components.
import { Easing } from "remotion";
// Fonts bundled from npm (@fontsource) — no runtime network fetch needed.
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";

export const theme = {
  // Light, Apple-style palette. Violet is the hero — max one hero element per frame.
  colors: {
    bg: "#F7F6FB",
    bgAlt: "#EFEDF6",
    surface: "#FFFFFF",
    line: "rgba(21,19,31,0.08)",
    primary: "#7C4DFF",
    primarySoft: "#A58BFF",
    blue: "#5B3CFF",
    lav: "#EEE8FF",
    navy: "#1B1F3B", // "Web" in the logo
    text: "#15131F",
    textDim: "#6B6880",
    success: "#22C55E",
    glow: "rgba(124, 77, 255, 0.35)",
    shadow: "0 40px 80px -30px rgba(60,30,160,0.28), 0 10px 24px -10px rgba(21,19,31,0.14)",
    shadowSm: "0 16px 36px -14px rgba(60,30,160,0.25), 0 4px 10px -4px rgba(21,19,31,0.10)",
  },
  fonts: {
    display: "Poppins",
    body: "Inter",
    mono: "JetBrains Mono",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;

// Editable copy/brand — change here to rebrand the video.
export const brand = {
  name: "WebBoost",
  url: "www.seunegocio.com.br", // the client's site shown in the demo scenes
  tagline: ["Sites que impulsionam", "resultados."], // 2nd part in brand violet
  price: "R$ 300",
  priceValue: 300,
  days: 10,
  cta: "Saiba mais",
  contact: "WhatsApp  (51) 99385-8465",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

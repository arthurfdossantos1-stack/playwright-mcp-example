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
  colors: {
    bg: "#05040A",
    bgAlt: "#0E0C1A",
    surface: "#13111F",
    line: "rgba(255,255,255,0.08)",
    primary: "#7C4DFF", // hero violet — max one hero element per frame
    primarySoft: "#A58BFF",
    blue: "#3B2BFF",
    accent: "#FF7A2F", // warm rim light, like the reference
    text: "#F5F4FA",
    textDim: "#9B98AE",
    light: "#F7F6FB",
    ink: "#15131F",
    glow: "rgba(124, 77, 255, 0.45)",
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
  name: "Vértice",
  suffix: "Web",
  url: "www.seunegocio.com.br",
  tagline: "Desenvolvimento de sites profissionais",
  cta: "Peça seu orçamento",
  contact: "vertice.web  ·  (11) 99999-0000",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

import React, { useId } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";

// WebBoost mark redrawn as SVG (browser window + rocket + trail), animated.
// Coordinates follow the original artwork; viewBox crops to the icon.
const BRAND = { a: "#8B45F5", b: "#6A4CFF", lav: "#E6DEFF", line: "#C9B8FF", gray: "#D9D6E3", navy: theme.colors.navy };

// unique, url()-safe ids so several logos can share a frame
const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, "");

export const WebBoostIcon: React.FC<{ size: number; delay?: number; gap?: string }> = ({
  size,
  delay = 0,
  gap = theme.colors.bg,
}) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [0, 22], [0, 1], { easing: theme.ease.out, ...clamp });
  const item = (i: number) => spring({ frame: frame - 10 - i * 3, fps, config: theme.spring.snappy });
  const fly = spring({ frame: frame - 16, fps, config: theme.spring.smooth });
  const trail = interpolate(frame, [18, 34], [0, 1], { easing: theme.ease.out, ...clamp });
  // rocket travels in along the trail from bottom-left
  const rx = interpolate(fly, [0, 1], [-260, 0]);
  const ry = interpolate(fly, [0, 1], [200, 0]);
  const hover = Math.sin(frame / 18) * 4;
  const uid = useSvgId();
  const id = (n: string) => `${n}-${uid}`;
  const bar = (i: number) => ({ opacity: item(i), transform: `scaleX(${item(i)})`, transformBox: "fill-box" as const, transformOrigin: "left center" });

  return (
    <svg width={size} height={size * (490 / 525)} viewBox="370 238 525 490" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={id("wb-stroke")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BRAND.a} />
          <stop offset="1" stopColor={BRAND.b} />
        </linearGradient>
        <linearGradient id={id("wb-trail")} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#B9A3FF" stopOpacity="0" />
          <stop offset="1" stopColor="#A98BFF" stopOpacity="0.95" />
        </linearGradient>
        <clipPath id={id("wb-trail-clip")}>
          <rect x={370} y={560} width={340 * trail} height={180} />
        </clipPath>
      </defs>

      {/* browser window */}
      <rect
        x={388}
        y={258}
        width={410}
        height={345}
        rx={34}
        fill="none"
        stroke={`url(#${id("wb-stroke")})`}
        strokeWidth={24}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
      {[445, 480, 515].map((cx, i) => (
        <circle key={cx} cx={cx} cy={312} r={11} fill={BRAND.a} opacity={item(i)} />
      ))}
      <rect x={435} y={344} width={316} height={3} rx={1.5} fill={BRAND.line} style={bar(2)} />
      <rect x={433} y={384} width={160} height={22} rx={11} fill={`url(#${id("wb-stroke")})`} style={bar(3)} />
      <rect x={433} y={440} width={160} height={18} rx={9} fill={BRAND.gray} style={bar(4)} />
      <rect x={433} y={482} width={115} height={18} rx={9} fill={BRAND.gray} style={bar(5)} />
      <rect x={620} y={384} width={132} height={112} rx={14} fill={BRAND.lav} opacity={item(4)} />

      {/* trail */}
      <path
        d="M383 713 Q560 724 660 588 L700 622 Q585 742 383 718 Z"
        fill={`url(#${id("wb-trail")})`}
        clipPath={`url(#${id("wb-trail-clip")})`}
      />

      {/* rocket (drawn pointing up, rotated 45° to the upper-right) */}
      <g opacity={fly} transform={`translate(${rx} ${ry + hover})`}>
        <g transform="translate(770 532) rotate(45) scale(1.16)">
          <g stroke={gap} strokeWidth={14} strokeLinejoin="round" style={{ paintOrder: "stroke" }} fill={`url(#${id("wb-stroke")})`}>
            <path d="M-50 22 L-110 84 Q-118 108 -90 103 L-44 74 Z" />
            <path d="M50 22 L110 84 Q118 108 90 103 L44 74 Z" />
            <path d="M0 -165 C72 -122 90 -20 52 76 L-52 76 C-90 -20 -72 -122 0 -165 Z" />
          </g>
          <circle cx={0} cy={-48} r={31} fill="white" />
        </g>
      </g>
    </svg>
  );
};

// Full lockup: icon + "WebBoost" wordmark + tagline
export const WebBoostWordmark: React.FC<{ size: number; delay?: number }> = ({ size, delay = 0 }) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const letters = "WebBoost".split("");
  return (
    <div style={{ display: "flex", fontFamily: theme.fonts.display, fontWeight: 700, fontSize: size, letterSpacing: "-0.035em", lineHeight: 1 }}>
      {letters.map((ch, i) => {
        const p = spring({ frame: frame - i * 2, fps, config: theme.spring.smooth });
        const boost = i >= 3;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              filter: `blur(${(1 - p) * 12}px)`,
              transform: `translateY(${interpolate(p, [0, 1], [80, 0])}px)`,
              ...(boost
                ? {
                    background: `linear-gradient(180deg, ${BRAND.a}, ${BRAND.b})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    paddingRight: 2,
                  }
                : { color: BRAND.navy }),
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const brandColors = BRAND;

"use client";

import { motion } from "framer-motion";

type InkStampProps = {
  label: string;
  tone?: "filed" | "acquitted" | "sentenced";
  className?: string;
};

export function InkStamp({ label, tone = "filed", className = "" }: InkStampProps) {
  const color = tone === "acquitted" ? "#4a5a3a" : "#6b1c1c";

  return (
    <motion.svg
      viewBox="0 0 280 116"
      className={className}
      initial={{ opacity: 0, scale: 1.4, rotate: -2, y: -12 }}
      animate={{ opacity: 0.9, scale: 1, rotate: 0, y: 0 }}
      transition={{
        duration: 0.15,
        ease: [0.2, 0.9, 0.3, 1.2]
      }}
      aria-label={label}
      role="img"
    >
      <defs>
        <filter id={`ink-bleed-${tone}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves="3"
            seed={tone === "filed" ? "9" : tone === "acquitted" ? "14" : "22"}
          />
          <feDisplacementMap in="SourceGraphic" scale="2.8" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.9 0.75 0.95" />
          </feComponentTransfer>
        </filter>
      </defs>
      <g filter={`url(#ink-bleed-${tone})`} opacity="0.95">
        <rect
          x="15"
          y="15"
          width="250"
          height="86"
          rx="3"
          fill="none"
          stroke={color}
          strokeWidth="8"
        />
        <rect
          x="27"
          y="27"
          width="226"
          height="62"
          rx="2"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.75"
        />
        <text
          x="140"
          y="70"
          textAnchor="middle"
          fontFamily="Cormorant SC, Georgia, serif"
          fontSize={label.length > 10 ? 34 : 42}
          fontWeight="700"
          letterSpacing="4"
          fill={color}
        >
          {label}
        </text>
      </g>
    </motion.svg>
  );
}

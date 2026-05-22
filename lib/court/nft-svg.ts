import type { HydratedDocument } from "mongoose";
import type { ICase } from "@/lib/db/models/Case";
import { caseSeal, verdictLabel } from "@/lib/court/seal";
import { escapeXml } from "@/lib/utils";

export function generateVerdictSvg(
  caseDoc: HydratedDocument<ICase> | ICase,
  side: "plaintiff" | "defendant"
) {
  const raw = typeof (caseDoc as HydratedDocument<ICase>).toObject === "function"
    ? (caseDoc as HydratedDocument<ICase>).toObject()
    : caseDoc;
  const verdict = raw.verdict;
  const label = verdict?.winner ? verdictLabel(verdict.winner, side) : "PENDING";
  const labelColor = label === "ACQUITTED" ? "#4a5a3a" : "#6b1c1c";
  const party = side === "plaintiff" ? "PLAINTIFF" : "DEFENDANT";
  const serial = side === "plaintiff" ? raw.plaintiffNftSerial : raw.defendantNftSerial;
  const caseNameLines = wrapSvgLines(verdict?.caseName ?? "Matter Pending", 30, 2);
  const caseNameFontSize = caseNameLines.length > 1 ? 54 : 72;
  const rulingLines = wrapSvgLines(verdict?.ruling ?? raw.complaint, 58, 8);
  const caseNameSvg = caseNameLines
    .map(
      (line, index) =>
        `<tspan x="600" dy="${index === 0 ? 0 : caseNameFontSize * 1.12}">${escapeXml(line)}</tspan>`
    )
    .join("");
  const rulingSvg = rulingLines
    .map(
      (line, index) =>
        `<tspan x="190" dy="${index === 0 ? 0 : 44}">${escapeXml(line)}</tspan>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600" role="img" aria-label="The Hedera Court verdict NFT">
  <defs>
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="5" seed="${raw.caseNumber}" />
      <feColorMatrix type="matrix" values="0 0 0 0 0.95 0 0 0 0 0.91 0 0 0 0 0.82 0 0 0 0.18 0" />
    </filter>
    <filter id="stamp" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="${raw.caseNumber + (side === "plaintiff" ? 2 : 9)}" />
      <feDisplacementMap in="SourceGraphic" scale="4" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.92 0.78 0.96" />
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="1200" height="1600" fill="#f4ecd8" />
  <rect width="1200" height="1600" filter="url(#paper)" opacity="0.75" />
  <rect x="80" y="78" width="1040" height="1444" fill="none" stroke="#8a6d3b" stroke-width="10" />
  <rect x="112" y="112" width="976" height="1376" fill="none" stroke="#8a6d3b" stroke-width="2" opacity="0.75" />
  <text x="600" y="212" text-anchor="middle" font-family="Cormorant SC, Georgia, serif" font-size="56" letter-spacing="9" fill="#8a6d3b">THE HEDERA COURT</text>
  <text x="600" y="302" text-anchor="middle" font-family="Cormorant SC, Georgia, serif" font-size="34" letter-spacing="6" fill="#1c1614">CASE NO. ${raw.caseNumber}</text>
  <line x1="188" y1="355" x2="1012" y2="355" stroke="#8a6d3b" stroke-width="2" />
  <text x="600" y="440" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="${caseNameFontSize}" fill="#6b1c1c">${caseNameSvg}</text>
  <rect x="150" y="565" width="900" height="330" fill="#fff8e8" opacity="0.62" />
  <text x="190" y="620" font-family="IBM Plex Mono, monospace" font-size="30" fill="#1c1614">${rulingSvg}</text>
  <g transform="translate(198 940) rotate(-4)" filter="url(#stamp)">
    <rect x="0" y="0" width="804" height="246" rx="8" fill="none" stroke="${labelColor}" stroke-width="18"/>
    <rect x="32" y="32" width="740" height="182" rx="5" fill="none" stroke="${labelColor}" stroke-width="5" opacity="0.75"/>
    <text x="402" y="150" text-anchor="middle" font-family="Cormorant SC, Georgia, serif" font-size="92" font-weight="700" letter-spacing="10" fill="${labelColor}">${label}</text>
  </g>
  <text x="600" y="1242" text-anchor="middle" font-family="Cormorant SC, Georgia, serif" font-size="42" letter-spacing="6" fill="#1c1614">${party}</text>
  <text x="600" y="1320" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="28" fill="#1c1614">Seal ${caseSeal(raw.caseId)} - Serial ${serial ?? "pending"}</text>
  <text x="600" y="1420" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="36" fill="#6b1c1c">Court is adjourned. Try to be less.</text>
</svg>`;
}

function wrapSvgLines(text: string, maxChars: number, maxLines: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const words = normalized.length > 0 ? normalized.split(" ") : ["Pending"];
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const chunks = chunkLongWord(word, maxChars);
    for (const chunk of chunks) {
      const candidate = current ? `${current} ${chunk}` : chunk;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
        }
        current = chunk;
      }

      if (lines.length === maxLines) {
        return addEllipsis(lines, maxChars);
      }
    }
  }

  if (current) {
    lines.push(current);
  }

  return addEllipsis(lines.slice(0, maxLines), maxChars, lines.length > maxLines);
}

function chunkLongWord(word: string, maxChars: number) {
  if (word.length <= maxChars) {
    return [word];
  }

  const chunks: string[] = [];
  for (let index = 0; index < word.length; index += maxChars) {
    chunks.push(word.slice(index, index + maxChars));
  }
  return chunks;
}

function addEllipsis(lines: string[], maxChars: number, force = true) {
  if (!force || lines.length === 0) {
    return lines;
  }

  const lastIndex = lines.length - 1;
  const trimmed = lines[lastIndex].slice(0, Math.max(0, maxChars - 3)).trimEnd();
  lines[lastIndex] = `${trimmed}...`;
  return lines;
}

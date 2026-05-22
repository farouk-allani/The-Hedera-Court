import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { imagePrompts } from "@/lib/assets/image-prompts";

const publicDir = path.join(process.cwd(), "public");
const generatedDir = path.join(publicDir, "generated");

export async function generateAssets() {
  await fs.mkdir(generatedDir, { recursive: true });
  await writeSvgFallbacks();

  if (!process.env.OPENAI_API_KEY) {
    return {
      generated: false,
      reason: "OPENAI_API_KEY is not set; fallback assets are present."
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
  const results = [];

  results.push(
    await generatePng({
      client,
      model,
      prompt: imagePrompts.magpiePortrait,
      outputPath: path.join(publicDir, "magpie-portrait.png"),
      size: "1024x1024"
    })
  );

  results.push(
    await generatePng({
      client,
      model,
      prompt: imagePrompts.courtHero,
      outputPath: path.join(generatedDir, "court-hero-illustration.png"),
      size: "1536x1024"
    })
  );

  results.push(
    await generatePng({
      client,
      model,
      prompt: imagePrompts.evidenceCollage,
      outputPath: path.join(generatedDir, "evidence-collage.png"),
      size: "1536x1024"
    })
  );

  results.push(
    await generatePng({
      client,
      model,
      prompt: imagePrompts.verdictCardsBackground,
      outputPath: path.join(generatedDir, "verdict-cards-bg.png"),
      size: "1536x1024"
    })
  );

  results.push(
    await generatePng({
      client,
      model,
      prompt: imagePrompts.courtLibraryBackground,
      outputPath: path.join(generatedDir, "court-library-bg.png"),
      size: "1536x1024"
    })
  );

  return {
    generated: true,
    results
  };
}

async function generatePng({
  client,
  model,
  prompt,
  outputPath,
  size
}: {
  client: OpenAI;
  model: string;
  prompt: string;
  outputPath: string;
  size: "1024x1024" | "1536x1024";
}) {
  try {
    const response = await client.images.generate({
      model,
      prompt,
      size
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("OpenAI returned no image data.");
    }
    await fs.writeFile(outputPath, Buffer.from(b64, "base64"));
    return { outputPath, ok: true };
  } catch (err) {
    return {
      outputPath,
      ok: false,
      error: err instanceof Error ? err.message : "Unknown image generation failure"
    };
  }
}

async function writeSvgFallbacks() {
  await fs.writeFile(
    path.join(publicDir, "paper-grain.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="12" />
    <feColorMatrix type="saturate" values="0" />
    <feComponentTransfer>
      <feFuncA type="table" tableValues="0 0.05" />
    </feComponentTransfer>
  </filter>
  <rect width="240" height="240" fill="#f4ecd8"/>
  <rect width="240" height="240" filter="url(#grain)"/>
</svg>`
  );

  await fs.writeFile(path.join(publicDir, "stamp-filed.svg"), stampSvg("CASE FILED", "#6b1c1c", 9));
  await fs.writeFile(path.join(publicDir, "stamp-acquitted.svg"), stampSvg("ACQUITTED", "#4a5a3a", 14));
  await fs.writeFile(path.join(publicDir, "stamp-sentenced.svg"), stampSvg("SENTENCED", "#6b1c1c", 22));
}

function stampSvg(label: string, color: string, seed: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="290" viewBox="0 0 700 290">
  <defs>
    <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="${seed}" />
      <feDisplacementMap in="SourceGraphic" scale="5" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.9 0.74 0.95" />
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="700" height="290" fill="none"/>
  <g filter="url(#ink)" opacity="0.92">
    <rect x="45" y="45" width="610" height="200" rx="8" fill="none" stroke="${color}" stroke-width="18"/>
    <rect x="75" y="75" width="550" height="140" rx="5" fill="none" stroke="${color}" stroke-width="5" opacity="0.7"/>
    <text x="350" y="170" text-anchor="middle" font-family="Cormorant SC, Georgia, serif" font-size="76" font-weight="700" letter-spacing="9" fill="${color}">${label}</text>
  </g>
</svg>`;
}

import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import OpenAI from "openai";
import { z } from "zod";
import type { JusticeWinner } from "@/lib/db/models/Case";

export const JUSTICE_MAGPIE_SYSTEM_PROMPT = `You are Justice Magpie.

You are seventy-three years old, British, and presiding over The Hedera Court for the eight thousand four hundred and twelfth time this year. You are exhausted, but you take the bench seriously because no one else will.

You rule on petty disputes with the gravity of constitutional law.

You use legal vocabulary precisely but ironically.

You never call yourself an AI.

You never apologize for your rulings.

You never use emoji.

You never use the words:
- vibes
- literally
- journey
- absolutely

You never hedge.

You may roast ideas, code habits, startup cliches, and harmless petty arguments.
You must not attack protected traits, private individuals, minors, bodies, religion, race, nationality, gender, disability, or sexuality.
You must not produce explicit, hateful, graphic, or dangerous content.
You must be witty, not cruel.

Every ruling has exactly four parts:

1. CASE NAME
Formal, in the style of:
"The People vs. <thing>"
or
"<plaintiff trait> vs. <defendant trait>"
Maximum 8 words.

2. RULING
2-3 sentences.
Cite the actual flaw in the losing argument.
You may insult both parties briefly if they both deserve it, but always pick a clear winner.

3. SENTENCE
One absurd, specific, fitting punishment for the loser.
Always actionable.
Never vague.

4. Final line:
"Court is adjourned. Try to be less."

Output ONLY valid JSON.
No preamble.
No markdown fences.

Shape:
{
  "caseName": "...",
  "ruling": "...",
  "sentence": "...",
  "winner": "plaintiff" | "defendant",
  "loserCrime": "..."
}`;

const bannedWords = ["vibes", "literally", "journey", "absolutely"];

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const DEFAULT_OPENAI_MODEL = "gpt-5.4-nano";

type OpenAiCompatibleProvider =
  | "gemini"
  | "groq"
  | "openai"
  | "openrouter"
  | "openai-compatible";

type JusticeProviderConfig =
  | {
      kind: "anthropic";
      apiKey: string;
      model: string;
    }
  | {
      kind: OpenAiCompatibleProvider;
      apiKey: string;
      model: string;
      baseURL?: string;
      defaultHeaders?: Record<string, string>;
    };

export const JusticeRulingSchema = z
  .object({
    caseName: z.string().trim().min(3).max(70).refine(
      (value) => value.split(/\s+/).length <= 8,
      "caseName must be 8 words or fewer"
    ),
    ruling: z.string().trim().min(20).max(760),
    sentence: z.string().trim().min(10).max(260),
    winner: z.enum(["plaintiff", "defendant"]),
    loserCrime: z.string().trim().min(3).max(80)
  })
  .superRefine((value, ctx) => {
    const combined = `${value.caseName} ${value.ruling} ${value.sentence} ${value.loserCrime}`.toLowerCase();
    for (const word of bannedWords) {
      if (combined.includes(word)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Banned word used: ${word}`
        });
      }
    }
  });

export type JusticeRuling = z.infer<typeof JusticeRulingSchema>;

export async function deliberateAndRule(
  complaint: string,
  defense: string
): Promise<JusticeRuling> {
  const provider = resolveJusticeProvider();

  if (!provider) {
    return fallbackRuling(complaint, defense);
  }

  try {
    const text =
      provider.kind === "anthropic"
        ? await invokeAnthropic(provider, complaint, defense)
        : await invokeOpenAiCompatible(provider, complaint, defense);
    const json = extractJson(text);
    return JusticeRulingSchema.parse(JSON.parse(json));
  } catch (err) {
    console.warn("Justice model failed; using fallback ruling.", err);
    return fallbackRuling(complaint, defense);
  }
}

async function invokeAnthropic(
  provider: Extract<JusticeProviderConfig, { kind: "anthropic" }>,
  complaint: string,
  defense: string
) {
  const model = new ChatAnthropic({
    apiKey: provider.apiKey,
    model: provider.model,
    temperature: 0.7,
    maxTokens: 700
  });

  const response = await model.invoke([
    new SystemMessage(JUSTICE_MAGPIE_SYSTEM_PROMPT),
    new HumanMessage(buildRulingPrompt(complaint, defense))
  ]);

  return messageContentToString(response.content);
}

async function invokeOpenAiCompatible(
  provider: Extract<JusticeProviderConfig, { kind: OpenAiCompatibleProvider }>,
  complaint: string,
  defense: string
) {
  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
    defaultHeaders: provider.defaultHeaders
  });

  const response = await client.chat.completions.create({
    model: provider.model,
    messages: [
      { role: "system", content: JUSTICE_MAGPIE_SYSTEM_PROMPT },
      { role: "user", content: buildRulingPrompt(complaint, defense) }
    ],
    temperature: 0.7,
    max_tokens: 700
  });

  return messageContentToString(response.choices[0]?.message?.content);
}

function buildRulingPrompt(complaint: string, defense: string) {
  return `Plaintiff:\n${complaint}\n\nDefendant:\n${defense}\n\nRule now.`;
}

function resolveJusticeProvider(): JusticeProviderConfig | null {
  const requested = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (requested) {
    return providerFromName(requested);
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return geminiProvider();
  }

  if (process.env.GROQ_API_KEY) {
    return groqProvider();
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return anthropicProvider();
  }

  if (process.env.OPENROUTER_API_KEY) {
    return openRouterProvider();
  }

  if (process.env.OPENAI_API_KEY && (process.env.AI_MODEL || process.env.OPENAI_MODEL)) {
    return openAiProvider();
  }

  return null;
}

function providerFromName(name: string): JusticeProviderConfig | null {
  if (name === "fallback" || name === "none" || name === "mock") {
    return null;
  }

  if (name === "google" || name === "gemini") {
    return geminiProvider();
  }

  if (name === "groq") {
    return groqProvider();
  }

  if (name === "anthropic" || name === "claude") {
    return anthropicProvider();
  }

  if (name === "openai") {
    return openAiProvider();
  }

  if (name === "openrouter") {
    return openRouterProvider();
  }

  if (name === "openai-compatible") {
    return genericOpenAiCompatibleProvider();
  }

  console.warn(`Unknown AI_PROVIDER "${name}"; using fallback ruling.`);
  return null;
}

function anthropicProvider(): JusticeProviderConfig | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return missingProviderKey("ANTHROPIC_API_KEY");
  }

  return {
    kind: "anthropic",
    apiKey,
    model: process.env.AI_MODEL || process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL
  };
}

function geminiProvider(): JusticeProviderConfig | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return missingProviderKey("GEMINI_API_KEY or GOOGLE_API_KEY");
  }

  return {
    kind: "gemini",
    apiKey,
    model:
      process.env.AI_MODEL ||
      process.env.GEMINI_MODEL ||
      process.env.GOOGLE_MODEL ||
      DEFAULT_GEMINI_MODEL,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  };
}

function groqProvider(): JusticeProviderConfig | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return missingProviderKey("GROQ_API_KEY");
  }

  return {
    kind: "groq",
    apiKey,
    model: process.env.AI_MODEL || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
    baseURL: "https://api.groq.com/openai/v1"
  };
}

function openAiProvider(): JusticeProviderConfig | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return missingProviderKey("OPENAI_API_KEY");
  }

  return {
    kind: "openai",
    apiKey,
    model: process.env.AI_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
  };
}

function openRouterProvider(): JusticeProviderConfig | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return missingProviderKey("OPENROUTER_API_KEY");
  }

  return {
    kind: "openrouter",
    apiKey,
    model: process.env.AI_MODEL || process.env.OPENROUTER_MODEL || "openrouter/free",
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "The Hedera Court"
    }
  };
}

function genericOpenAiCompatibleProvider(): JusticeProviderConfig | null {
  const apiKey = process.env.AI_API_KEY;
  const baseURL = process.env.AI_BASE_URL;

  if (!apiKey || !baseURL) {
    return missingProviderKey("AI_API_KEY and AI_BASE_URL");
  }

  return {
    kind: "openai-compatible",
    apiKey,
    baseURL,
    model: process.env.AI_MODEL || "llama-3.1-8b-instant"
  };
}

function missingProviderKey(name: string): null {
  console.warn(`${name} is not set; using fallback ruling.`);
  return null;
}

function messageContentToString(content: unknown) {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text: unknown }).text);
        }
        return "";
      })
      .join("");
  }
  return String(content ?? "");
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Claude returned no JSON");
  }
  return trimmed.slice(start, end + 1);
}

function fallbackRuling(complaint: string, defense: string): JusticeRuling {
  const plaintiffWins = !/\bfaster\b|\bquick\b|\bship\b/i.test(complaint) || /\bfaster\b|\bship\b/i.test(defense);
  const winner: JusticeWinner = plaintiffWins ? "plaintiff" : "defendant";
  const loser = winner === "plaintiff" ? "defendant" : "plaintiff";
  return {
    caseName:
      complaint.toLowerCase().includes("typescript") || complaint.includes("any")
        ? "The People vs. Any"
        : "Decorum vs. Nonsense",
    ruling:
      winner === "plaintiff"
        ? "The defense confuses haste with merit. A weak excuse, polished until it shines, remains a weak excuse and has been placed before the Court with needless confidence."
        : "The complaint arrives with indignation but insufficient proof. The plaintiff has mistaken annoyance for jurisprudence and expected the Court to do the rest.",
    sentence:
      loser === "defendant"
        ? "The defendant shall write a one-page policy, follow it once, and refrain from calling the shortcut elegant."
        : "The plaintiff shall draft three clearer allegations before speaking in meetings for one full afternoon.",
    winner,
    loserCrime:
      loser === "defendant" ? "Reckless procedural optimism" : "Overwrought petitioning"
  };
}

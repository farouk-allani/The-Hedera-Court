# Deployment Guide

This project is ready for a public GitHub repository and Vercel deployment.

## Before Publishing

1. Keep `.env` and `.env.local.generated` private. They are ignored by Git.
2. Replace `TODO: Your Name` in `package.json`.
3. Replace README links after you create the GitHub repo and Vercel project.
4. Run:

```bash
npm run verify
```

## GitHub

```bash
git init
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/the-hedera-court.git
git push -u origin main
```

## Vercel

1. Import the GitHub repository in Vercel.
2. Framework preset: `Next.js`.
3. Install command: `npm ci`.
4. Build command: `npm run build`.
5. Output directory: leave empty.
6. Node.js version: `20.x`.

## Environment Variables

Add these in Vercel Project Settings -> Environment Variables:

```env
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=
HEDERA_OPERATOR_KEY=
HEDERA_COURT_TREASURY_ID=
HEDERA_VERDICT_TOKEN_ID=
HEDERA_DOCKET_TOPIC_ID=
MONGODB_URI=
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash-lite
GEMINI_API_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-nano
OPENAI_IMAGE_MODEL=gpt-image-1-mini
NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
HEDERA_ALLOW_MOCK=false
```

After Vercel gives you a production URL, update `NEXT_PUBLIC_APP_URL` to that exact URL and redeploy.

## Hedera Bootstrap

Run this locally after your operator key and treasury account are configured:

```bash
npm run bootstrap
```

Copy the generated `HEDERA_VERDICT_TOKEN_ID` and `HEDERA_DOCKET_TOPIC_ID` into your local `.env` and into Vercel environment variables.

## Demo Accounts

Use three testnet accounts:

- Court operator/treasury: server-side only
- Plaintiff wallet: signs the filing ante
- Defendant wallet: signs the defense ante

Do not use the court treasury wallet as the plaintiff or defendant.

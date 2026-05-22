import { CourtHero } from "@/components/CourtHero";

export default function HomePage() {
  const treasuryId = process.env.HEDERA_COURT_TREASURY_ID ?? "";

  return (
    <main>
      <CourtHero treasuryId={treasuryId} />
    </main>
  );
}

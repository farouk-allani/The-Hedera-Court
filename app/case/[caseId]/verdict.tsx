import { VerdictReveal } from "@/components/VerdictReveal";
import type { PublicCase } from "@/lib/cases/types";

export function CaseVerdict({ caseData }: { caseData: PublicCase }) {
  return <VerdictReveal caseData={caseData} />;
}

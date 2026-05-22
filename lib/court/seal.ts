import { sha256 } from "@/lib/utils";

export function caseSeal(caseId: string) {
  return sha256(caseId).slice(0, 10).toUpperCase();
}

export function verdictLabel(winner: "plaintiff" | "defendant", side: "plaintiff" | "defendant") {
  return winner === side ? "ACQUITTED" : "SENTENCED";
}

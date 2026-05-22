import type { ReactNode } from "react";

export function BrassPlaque({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex border border-brass bg-cream px-3 py-2 text-brass shadow-[inset_0_0_0_1px_rgba(244,236,216,0.55)]">
      <span className="small-caps text-sm">{children}</span>
    </div>
  );
}

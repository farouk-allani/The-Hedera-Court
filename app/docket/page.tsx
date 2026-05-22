import { Docket } from "@/components/Docket";
import Image from "next/image";

export default function DocketPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <div className="court-panel relative mb-8 min-h-72 overflow-hidden p-6 md:p-8">
        <Image
          src="/generated/evidence-collage.jpg"
          alt="Public docket evidence desk"
          fill
          priority
          quality={76}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[rgba(244,236,216,0.52)]" />
        <div className="relative max-w-3xl">
          <p className="small-caps ">Public docket</p>
          <h1 className="mt-2 font-display text-5xl leading-none md:text-6xl">
            Receipts for civilization&apos;s smallest emergencies.
          </h1>
        </div>
      </div>
      <Docket />
    </main>
  );
}

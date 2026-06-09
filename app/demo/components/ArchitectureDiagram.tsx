"use client";

import Image from "next/image";

export default function ArchitectureDiagram() {
  return (
    <div className="w-full border border-white/10 bg-white/[0.01] p-5 md:p-6">
      <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-4">
        Architecture
      </p>
      <Image
        src="/sadxlatch.png"
        alt="S.A.D. × Latch architecture diagram"
        width={1600}
        height={900}
        className="w-full h-auto"
      />
    </div>
  );
}

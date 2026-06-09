"use client";

import Image from "next/image";

export default function IntegrationBanner() {
  return (
    <div className="relative w-full overflow-hidden border-2 border-[#F5A623]/60 bg-[#F5A623]/[0.08] shadow-[0_0_40px_rgba(245,166,35,0.12)]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F5A623]/20 via-transparent to-[#FF2D00]/8" />

      <div className="relative px-6 py-8 md:px-8 md:py-9">
        <p className="text-[10px] font-mono text-[#F5A623] uppercase tracking-[0.2em] mb-7">
          Complete Migration Pipeline
        </p>

        {/* Pipeline */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0">

          {/* Latch */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Image
              src="/latch.png"
              alt="Latch"
              width={52}
              height={52}
              className="rounded-2xl flex-shrink-0"
            />
            <div>
              <p className="text-sm font-bold text-[#F5A623]">Latch</p>
              <p className="text-[11px] text-[#F5A623]/70 mt-0.5 leading-relaxed">
                G-address → Smart Account
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="flex-1 flex-col items-center gap-1 px-6 md:px-10 hidden md:flex">
            <div className="flex items-center w-full gap-1.5">
              <div className="flex-1 h-[1.5px] bg-gradient-to-r from-[#F5A623]/80 to-[#FF2D00]/60" />
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="flex-shrink-0">
                <path d="M0 0L8 6L0 12V0Z" fill="#F5A623" fillOpacity="0.7" />
              </svg>
            </div>
            <p className="text-[9px] font-mono text-[#F5A623]/40 uppercase tracking-wider whitespace-nowrap mt-1">
              keypair stays active
            </p>
          </div>

          {/* S.A.D. */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="h-[52px] w-[7.5rem] bg-[#FF2D00]/10 border border-[#FF2D00]/30 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image
                src="/s.a.d transparent logo.png"
                alt="S.A.D."
                width={104}
                height={38}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-white">S.A.D.</p>
              <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
                Close G-address · Free reserves
              </p>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="mt-7 pt-5 border-t border-[#F5A623]/20 flex items-start gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623]/60 flex-shrink-0 mt-1" />
          <p className="text-[11px] text-[#F5A623]/60 font-mono leading-relaxed">
            Recovered reserves flow directly into funding your new Smart Account — zero value left behind.
          </p>
        </div>
      </div>
    </div>
  );
}

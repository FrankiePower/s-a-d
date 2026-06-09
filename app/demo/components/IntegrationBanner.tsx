"use client";

import Image from "next/image";

export default function IntegrationBanner() {
  return (
    <div className="relative w-full overflow-hidden border border-[#F5A623]/30 bg-[#F5A623]/[0.04]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F5A623]/10 via-transparent to-[#FF2D00]/5" />

      <div className="relative px-6 py-7 md:px-8 md:py-8">
        <p className="text-[10px] font-mono text-[#F5A623]/60 uppercase tracking-[0.2em] mb-6">
          Complete Migration Pipeline
        </p>

        {/* Pipeline */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0">

          {/* Latch */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Image
              src="/latch.png"
              alt="Latch"
              width={44}
              height={44}
              className="rounded-xl flex-shrink-0"
            />
            <div>
              <p className="text-sm font-semibold text-[#F5A623]">Latch</p>
              <p className="text-[11px] text-[#F5A623]/50 mt-0.5 leading-relaxed">
                G-address → Smart Account
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="flex-1 flex-col items-center gap-1 px-6 md:px-8 hidden md:flex">
            <div className="flex items-center w-full gap-1.5">
              <div className="flex-1 h-px bg-gradient-to-r from-[#F5A623]/50 to-[#FF2D00]/40" />
              <svg width="7" height="11" viewBox="0 0 7 11" fill="none" className="flex-shrink-0">
                <path d="M0 0L7 5.5L0 11V0Z" fill="rgba(255,255,255,0.3)" />
              </svg>
            </div>
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-wider whitespace-nowrap mt-1">
              keypair stays active
            </p>
          </div>

          {/* S.A.D. */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="h-11 w-[6.5rem] bg-[#FF2D00]/10 border border-[#FF2D00]/20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image
                src="/s.a.d transparent logo.png"
                alt="S.A.D."
                width={96}
                height={34}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">S.A.D.</p>
              <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                Close G-address · Free reserves
              </p>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="mt-6 pt-5 border-t border-[#F5A623]/10 flex items-start gap-2.5">
          <div className="w-1 h-1 rounded-full bg-[#F5A623]/40 flex-shrink-0 mt-1.5" />
          <p className="text-[11px] text-[#F5A623]/40 font-mono leading-relaxed">
            Recovered reserves flow directly into funding your new Smart Account — zero value left behind.
          </p>
        </div>
      </div>
    </div>
  );
}

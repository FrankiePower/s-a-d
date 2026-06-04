"use client";

import { useState } from "react";

interface AccordionItem {
  title: string;
  label: string;
  items: string[];
}

const SECTIONS: AccordionItem[] = [
  {
    title: "What this tool currently does",
    label: "Current",
    items: [
      "Automatically closes open offers.",
      "Automatically sells owned assets on Stellar DEX at market price.",
      "Automatically removes trustlines, returning all unsold assets to the issuers.",
      "Automatically removes existing data entries.",
      "Allows merging directly to exchanges and other destinations that do not support merge operations out of the box.",
      "Works with multisig accounts.",
      "Absolutely free, you pay only for transaction fees.",
    ],
  },
  {
    title: "Final product",
    label: "Production",
    items: [
      "Scans the account before signing anything.",
      "Shows balances, trustlines, offers, claimable balances, signers, thresholds, sponsorships, data entries, Soroban assets, allowances, and DeFi positions.",
      "Detects blockers that prevent safe cleanup or account merge.",
      "Previews every cleanup and migration step before execution.",
      "Claims selected claimable balances when safe.",
      "Closes open classic DEX offers.",
      "Withdraws supported AMM and liquidity pool positions.",
      "Unwinds supported DeFi positions across Stellar protocols.",
      "Sells selected classic and Soroban tokens to XLM or another target asset using available routing.",
      "Removes empty trustlines and account data entries.",
      "Reviews and optionally revokes active Soroban token allowances or authorizations.",
      "Supports multisig accounts with clear signer and threshold requirements.",
      "Sends recovered value to a wallet, smart account, or exchange.",
      "Uses a temporary mediator account when the destination cannot receive ACCOUNT_MERGE.",
      "Keeps signing non-custodial and client-side through Stellar Wallets Kit or local key input.",
      "Separates reversible cleanup from irreversible final account closure.",
    ],
  },
  {
    title: "What this demo shows",
    label: "Demo",
    items: [
      "Connect or enter a Stellar account to generate a safety preview.",
      "Displays classic balances, trustlines, open offers, data entries, and claimable balances.",
      "Shows multisig configuration, required signatures, and merge readiness.",
      "Detects sponsorship and reserve blockers.",
      "Shows Soroban token balances and active allowances.",
      "Flags DeFi positions from protocols like Blend, Aquarius, and Soroswap.",
      "Builds a staged cleanup plan with fees, recovered reserve, risks, and required signatures.",
      "Separates actions into Recover, Clean Up, Migrate, and Close Account.",
      "Previews token liquidation to XLM with slippage and routing assumptions.",
      "Shows unsupported DeFi or Soroban state as explicit blockers instead of hiding it.",
      "Demonstrates client-side signing boundaries with unsigned transaction steps.",
      "Protects the final merge behind a clear irreversible-action confirmation.",
    ],
  },
];

export default function FeatureAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2 mt-8">
      {SECTIONS.map((section, idx) => {
        const isOpen = open === idx;
        return (
          <div key={idx} className="border border-white/10 bg-white/5">
            <button
              onClick={() => setOpen(isOpen ? null : idx)}
              className="w-full flex items-center justify-between px-5 py-4 text-left group hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff3131]/70 shrink-0">
                  {section.label}
                </span>
                <span className="text-sm md:text-base font-medium text-white">
                  {section.title}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-white/10">
                <ul className="mt-4 space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/60 font-mono leading-relaxed">
                      <span className="text-[#ff3131] mt-0.5 shrink-0">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

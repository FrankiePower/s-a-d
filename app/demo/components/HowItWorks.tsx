"use client";

const STEPS = [
  {
    title: "Connect your wallet",
    body: "Connect via Freighter or enter a Stellar account address. Your keys stay in your browser — nothing is signed yet.",
  },
  {
    title: "Account is scanned",
    body: "S.A.D reads all account state from Horizon: XLM balance, trustlines, open offers, claimable balances, data entries, signers, thresholds, sponsorships, and Soroban positions.",
  },
  {
    title: "Blockers are detected",
    body: "Sponsorships, multisig thresholds, locked reserves, active DeFi positions, and unsupported Soroban state are flagged before any action is proposed.",
  },
  {
    title: "A cleanup plan is built",
    body: "Each required step is staged in order — Recover, Clean Up, Migrate, Close — with risk labels, estimated fees, and recovered reserve shown upfront.",
  },
  {
    title: "You sign only what you approve",
    body: "Every transaction is built client-side and shown before signing. Reversible cleanup steps are separated from the irreversible final account merge.",
  },
  {
    title: "Account is closed safely",
    body: "Recovered value is sent to your destination wallet, smart account, or exchange. A mediator account handles merge when the destination cannot receive ACCOUNT_MERGE directly.",
  },
];

export default function HowItWorks() {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono text-white/60 uppercase tracking-wider text-center mb-6">
        How It Works
      </h3>

      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 p-4 md:p-6 hover:bg-white/10 transition-colors flex items-start gap-4 md:gap-6"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 bg-[#ff3131] text-black font-bold flex items-center justify-center text-xs md:text-sm shrink-0">
              {i + 1}
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider mb-2">
                {step.title}
              </h4>
              <p className="text-xs md:text-sm text-white/60 leading-relaxed font-mono">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-[#ff3131]/10 border border-[#ff3131]/30 p-4">
        <p className="text-xs font-mono text-[#ff3131] leading-relaxed">
          <strong>Safety first.</strong>{" "}
          <span className="text-white/60">
            S.A.D never signs anything without your explicit approval. Irreversible steps are gated behind a confirmation that makes the consequences clear.
          </span>
        </p>
      </div>
    </div>
  );
}

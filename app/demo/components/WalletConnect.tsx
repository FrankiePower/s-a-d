"use client";

import { useState } from "react";
import { useFreighter } from "@/hooks/useFreighter";
import { useInspectAccount } from "@/hooks/useInspectAccount";
import { useDemolisher } from "@/hooks/useDemolisher";

export default function WalletConnect() {
  const { connected, address, network, connecting, error, connect, disconnect, sign } =
    useFreighter();

  const { status: inspectStatus, data, error: inspectError } =
    useInspectAccount(address, network);

  const { status: mergeStatus, currentStep, logs, error: mergeError, merge, reset: resetMerge } =
    useDemolisher();

  const [destination, setDestination] = useState("");
  const [memo, setMemo] = useState("");

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;

  const hasHardBlocker = data?.blockers.some((b) => b.severity === "hard") ?? false;
  const isRunning = mergeStatus === "running";
  const canMerge =
    inspectStatus === "success" &&
    destination.trim().length > 0 &&
    !hasHardBlocker &&
    !isRunning;

  const handleMerge = async () => {
    if (!address || !network) return;
    await merge({ source: address, destination, memo: memo || undefined, network, sign });
  };

  return (
    <div className="bg-white/5 border border-white/10">
      {/* Header */}
      <div className="border-b border-white/10 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <span className="text-xs font-mono text-white/60 uppercase tracking-wider">
          Wallet
        </span>
        {connected && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-xs font-mono text-green-400 uppercase tracking-wider">
                Connected
              </span>
            </div>
            <button
              onClick={disconnect}
              className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        {!connected ? (
          /* ── Disconnected ── */
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <div className="space-y-2 text-center">
              <p className="text-sm md:text-base text-white/60 font-mono">
                Connect your Freighter wallet to inspect a Stellar account.
              </p>
              <p className="text-xs text-white/30 font-mono">
                Non-custodial. Your keys never leave your browser.
              </p>
            </div>

            <button
              onClick={connect}
              disabled={connecting}
              className="group relative px-8 py-3 bg-black border border-white text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-3 text-xs font-bold tracking-[0.15em] group-hover:text-black transition-colors duration-300">
                {connecting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    CONNECTING...
                  </>
                ) : (
                  "CONNECT FREIGHTER"
                )}
              </span>
            </button>

            {error && (
              <div className="w-full bg-red-500/10 border border-red-500/50 p-3">
                <p className="text-xs font-mono text-red-400 text-center">{error}</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Connected ── */
          <div className="space-y-5">
            {/* Address + network */}
            <div className="bg-black/50 border border-white/10 p-4 space-y-3">
              <div>
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                  Address
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-mono text-white break-all">
                    {address}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(address!)}
                    className="text-white/30 hover:text-white transition-colors shrink-0"
                    title="Copy address"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                  Network
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    network?.toLowerCase().includes("main") ? "bg-green-400" : "bg-yellow-400"
                  }`} />
                  <span className="text-sm font-mono text-white capitalize">{network}</span>
                </div>
              </div>
            </div>

            {/* Inspection status */}
            {inspectStatus === "loading" && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
                <span className="text-xs font-mono text-white/60">
                  Scanning account state...
                </span>
              </div>
            )}

            {inspectStatus === "success" && data && (
              <div className="space-y-2">
                <div className="bg-[#ff3131]/10 border border-[#ff3131]/30 p-3">
                  <p className="text-xs font-mono text-[#ff3131]">
                    ✓ Account scanned —{" "}
                    <span className="text-white/60">{short(address!)}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "XLM Balance", value: `${data.xlmBalance} XLM` },
                    { label: "Available", value: `${data.xlmAvailable} XLM` },
                    { label: "Reserved", value: `${data.xlmReserved} XLM` },
                    { label: "Trustlines", value: String(data.trustlines.length) },
                    { label: "Open Offers", value: String(data.openOffers.length) },
                    { label: "Data Entries", value: String(data.dataEntries.length) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-black/50 border border-white/10 p-2">
                      <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                        {label}
                      </div>
                      <div className="text-xs font-mono text-white mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>

                {data.blockers.length > 0 && (
                  <div className="space-y-1">
                    {data.blockers.map((b, i) => (
                      <div
                        key={i}
                        className={`p-3 border text-xs font-mono ${
                          b.severity === "hard"
                            ? "bg-red-500/10 border-red-500/40 text-red-400"
                            : "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                        }`}
                      >
                        {b.severity === "hard" ? "✗" : "⚠"} {b.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {inspectStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500/50 p-3">
                <p className="text-xs font-mono text-red-400">{inspectError}</p>
              </div>
            )}

            {/* Input forms — shown once scan is complete */}
            {inspectStatus === "success" && (
              <div className="space-y-3 border-t border-white/10 pt-5">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">
                  Merge Destination
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-white/60">
                    Destination address
                    <span className="text-white/30"> — account that will receive funds</span>
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.replace(/\W/g, ""))}
                    placeholder="G..."
                    maxLength={60}
                    className="w-full bg-black/50 border border-white/10 px-3 py-2.5 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-white/60">
                    Memo
                    <span className="text-white/30"> — required for exchanges and anchors</span>
                  </label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Optional"
                    maxLength={28}
                    className="w-full bg-black/50 border border-white/10 px-3 py-2.5 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                {/* Signature count warning */}
                {data && (
                  <div className="bg-white/5 border border-white/10 p-3">
                    <p className="text-xs font-mono text-white/50">
                      <span className="text-white">
                        {data.cleanupSteps.length} Freighter approval{data.cleanupSteps.length !== 1 ? "s" : ""}
                      </span>
                      {" "}required — one per cleanup step. Each popup must be approved in sequence.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleMerge}
                  disabled={!canMerge}
                  className="w-full px-6 py-3 bg-[#ff3131] text-black font-bold text-sm uppercase tracking-wider transition-opacity disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center gap-3"
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      {currentStep.replace(/_/g, " ").toUpperCase()}…
                    </>
                  ) : mergeStatus === "done" ? (
                    "✓ ACCOUNT MERGED"
                  ) : (
                    "MERGE ACCOUNT"
                  )}
                </button>

                {hasHardBlocker && !isRunning && (
                  <p className="text-xs font-mono text-red-400/70 text-center">
                    Resolve hard blockers above before merging.
                  </p>
                )}

                {/* Step log */}
                {logs.length > 0 && (
                  <div className="bg-black border border-white/10 p-3 space-y-1 max-h-48 overflow-auto">
                    {logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-mono">
                        <span className={`shrink-0 ${
                          log.step === "done" ? "text-green-400" :
                          log.step === "error" ? "text-red-400" :
                          "text-white/40"
                        }`}>
                          {log.step === "done" ? "✓" : log.step === "error" ? "✗" : "→"}
                        </span>
                        <span className="text-white/70">{log.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {mergeError && (
                  <div className="bg-red-500/10 border border-red-500/50 p-3 flex items-start justify-between gap-3">
                    <p className="text-xs font-mono text-red-400">{mergeError}</p>
                    <button onClick={resetMerge} className="text-xs font-mono text-white/40 hover:text-white shrink-0">
                      retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

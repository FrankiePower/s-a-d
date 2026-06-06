"use client";

import { useState, useCallback } from "react";
import {
  DemolisherEngine,
  DemolisherStep,
  passphraseForNetwork,
} from "@/lib/demolisher/demolisher-engine";

const HORIZON_URLS: Record<string, string> = {
  PUBLIC: "https://horizon.stellar.org",
  TESTNET: "https://horizon-testnet.stellar.org",
  FUTURENET: "https://horizon-futurenet.stellar.org",
};

const MEDIATOR_ENDPOINT = "/api/demolisher";
const MEDIATOR_ACCOUNT = "GDXA2PI2CR73P3FR5CHEWUK5JBUAHV45EVR2EJPBZBK6PXYHJZ2TJOQ5";

export interface DemolisherLog {
  step: DemolisherStep;
  detail: string;
  ts: number;
}

export type DemolisherStatus = "idle" | "running" | "done" | "error";

export interface DemolisherState {
  status: DemolisherStatus;
  currentStep: DemolisherStep;
  logs: DemolisherLog[];
  error: string | null;
  merge: (opts: {
    source: string;
    destination: string;
    memo?: string;
    network: string;
    sign: (xdr: string) => Promise<string>;
  }) => Promise<void>;
  reset: () => void;
}

export function useDemolisher(): DemolisherState {
  const [status, setStatus] = useState<DemolisherStatus>("idle");
  const [currentStep, setCurrentStep] = useState<DemolisherStep>("idle");
  const [logs, setLogs] = useState<DemolisherLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (step: DemolisherStep, detail: string) => {
    setCurrentStep(step);
    setLogs((prev) => [...prev, { step, detail, ts: Date.now() }]);
  };

  const merge = useCallback(
    async (opts: {
      source: string;
      destination: string;
      memo?: string;
      network: string;
      sign: (xdr: string) => Promise<string>;
    }) => {
      setStatus("running");
      setError(null);
      setLogs([]);
      setCurrentStep("idle");

      const networkKey = opts.network.toUpperCase();
      const networkPassphrase = passphraseForNetwork(networkKey);
      const horizonUrl = HORIZON_URLS[networkKey] ?? HORIZON_URLS.TESTNET;

      const engine = new DemolisherEngine({
        source: opts.source,
        destination: opts.destination,
        memo: opts.memo,
        networkPassphrase,
        horizonUrl,
        mediatorEndpoint: MEDIATOR_ENDPOINT,
        mediatorAccount: MEDIATOR_ACCOUNT,
        sign: opts.sign,
        onStep: (step, detail) => addLog(step, detail),
      });

      try {
        await engine.run();
        setStatus("done");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Merge failed.";
        setError(msg);
        setStatus("error");
        addLog("error", msg);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setCurrentStep("idle");
    setLogs([]);
    setError(null);
  }, []);

  return { status, currentStep, logs, error, merge, reset };
}

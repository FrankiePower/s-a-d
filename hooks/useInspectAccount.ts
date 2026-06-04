"use client";

import { useState, useEffect } from "react";
import { inspectAccount } from "@/lib/demolisher/inspect-account";
import type { AccountInspection } from "@/lib/demolisher/types";

export type InspectionStatus = "idle" | "loading" | "success" | "error";

export interface InspectAccountState {
  status: InspectionStatus;
  data: AccountInspection | null;
  error: string | null;
  refresh: () => void;
}

export function useInspectAccount(
  address: string | null,
  network: string | null
): InspectAccountState {
  const [status, setStatus] = useState<InspectionStatus>("idle");
  const [data, setData] = useState<AccountInspection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!address || !network) {
      setStatus("idle");
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setStatus("loading");
      setError(null);
      try {
        const result = await inspectAccount(address, network);
        if (!cancelled) {
          setData(result);
          setStatus("success");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Inspection failed.");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, network, tick]);

  const refresh = () => setTick((t) => t + 1);

  return { status, data, error, refresh };
}

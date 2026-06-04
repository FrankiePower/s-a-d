"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  isAllowed,
  setAllowed,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api";

export interface FreighterState {
  connected: boolean;
  address: string | null;
  network: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useFreighter(): FreighterState {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore existing session on mount
  useEffect(() => {
    (async () => {
      try {
        const { isConnected: ext } = await isConnected();
        if (!ext) return;
        const { isAllowed: allowed } = await isAllowed();
        if (!allowed) return;
        const { address: addr, error: addrErr } = await getAddress();
        if (addrErr || !addr) return;
        const { network: net } = await getNetwork();
        setAddress(addr);
        setNetwork(net ?? null);
        setConnected(true);
      } catch {
        // silent — no session to restore
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const { isConnected: ext, error: connErr } = await isConnected();
      if (connErr) throw new Error(connErr.message);
      if (!ext)
        throw new Error(
          "Freighter not found. Install the Freighter extension to continue."
        );

      const { isAllowed: allowed } = await isAllowed();
      if (!allowed) await setAllowed();

      const { address: addr, error: addrErr } = await getAddress();
      if (addrErr) throw new Error(addrErr.message);
      if (!addr) throw new Error("Freighter did not return an address.");

      const { network: net, error: netErr } = await getNetwork();
      if (netErr) throw new Error(netErr.message);

      setAddress(addr);
      setNetwork(net ?? null);
      setConnected(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setError(msg);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setNetwork(null);
    setError(null);
  }, []);

  return { connected, address, network, connecting, error, connect, disconnect };
}

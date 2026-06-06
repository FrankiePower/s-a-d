"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  isAllowed,
  requestAccess,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";

export interface FreighterState {
  connected: boolean;
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sign: (xdr: string) => Promise<string>;
}

export function useFreighter(): FreighterState {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore existing session on mount — silent, no popup
  useEffect(() => {
    (async () => {
      try {
        const { isConnected: ext } = await isConnected();
        if (!ext) return;
        const { isAllowed: allowed } = await isAllowed();
        if (!allowed) return;
        // Already connected — just read state without re-prompting
        const { address: addr, error: addrErr } = await requestAccess();
        if (addrErr || !addr) return;
        const { network: net, networkPassphrase: passphrase } = await getNetwork();
        setAddress(addr);
        setNetwork(net ?? null);
        setNetworkPassphrase(passphrase ?? null);
        setConnected(true);
      } catch {
        // silent — no prior session
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

      // requestAccess() opens the Freighter popup, grants site permission,
      // and returns the address — all in one call
      const { address: addr, error: accessErr } = await requestAccess();
      if (accessErr) throw new Error(accessErr.message);
      if (!addr) throw new Error("Freighter did not return an address.");

      const { network: net, networkPassphrase: passphrase, error: netErr } =
        await getNetwork();
      if (netErr) throw new Error(netErr.message);

      setAddress(addr);
      setNetwork(net ?? null);
      setNetworkPassphrase(passphrase ?? null);
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
    setNetworkPassphrase(null);
    setError(null);
  }, []);

  // sign uses the passphrase already known from getNetwork() — no need to pass it in
  const sign = useCallback(
    async (xdr: string): Promise<string> => {
      if (!connected || !networkPassphrase)
        throw new Error("Wallet not connected.");

      const result = await signTransaction(xdr, { networkPassphrase, address: address ?? undefined });

      if (result.error) throw new Error(result.error.message);
      if (!result.signedTxXdr) throw new Error("Freighter closed without signing.");
      return result.signedTxXdr;
    },
    [connected, address, networkPassphrase]
  );

  return {
    connected,
    address,
    network,
    networkPassphrase,
    connecting,
    error,
    connect,
    disconnect,
    sign,
  };
}

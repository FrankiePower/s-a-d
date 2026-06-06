import { NextRequest, NextResponse } from "next/server";
import * as StellarSdk from "@stellar/stellar-sdk";

const NETWORK_PASSPHRASES: Record<string, string> = {
  PUBLIC: StellarSdk.Networks.PUBLIC,
  TESTNET: StellarSdk.Networks.TESTNET,
  FUTURENET: StellarSdk.Networks.FUTURENET,
};

function getPassphrase(network = "TESTNET"): string {
  return NETWORK_PASSPHRASES[network.toUpperCase()] ?? StellarSdk.Networks.TESTNET;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.MEDIATOR_SECRET;
  console.log("[demolisher] POST received. secret loaded:", !!secret);
  if (!secret) {
    return NextResponse.json({ error: "Mediator not configured." }, { status: 500 });
  }

  let body: { transaction: string; network?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { transaction: envelopeXdr, network } = body;
  if (!envelopeXdr) {
    return NextResponse.json({ error: "Missing transaction field." }, { status: 400 });
  }

  const passphrase = getPassphrase(network);
  const mediatorKeypair = StellarSdk.Keypair.fromSecret(secret);
  const mediatorAccount = mediatorKeypair.publicKey();

  let tx: StellarSdk.Transaction;
  try {
    tx = new StellarSdk.Transaction(envelopeXdr, passphrase);
  } catch {
    return NextResponse.json({ error: "Could not parse transaction XDR." }, { status: 400 });
  }

  // ── Validate structure ────────────────────────────────────────────────────
  // Must be exactly 2 ops:
  //   [0] accountMerge: source=user → destination=mediator
  //   [1] payment: source=mediator → destination=user's chosen address
  const ops = tx.operations;

  if (ops.length !== 2) {
    return NextResponse.json({ error: "Transaction must have exactly 2 operations." }, { status: 400 });
  }

  const [merge, transfer] = ops as [
    StellarSdk.Operation.AccountMerge,
    StellarSdk.Operation.Payment | StellarSdk.Operation.CreateAccount
  ];

  const isValidMerge =
    merge.type === "accountMerge" &&
    merge.destination === mediatorAccount &&
    merge.source !== mediatorAccount;

  const isValidTransfer =
    (transfer.type === "payment" || transfer.type === "createAccount") &&
    transfer.source === mediatorAccount &&
    transfer.destination !== mediatorAccount;

  if (!isValidMerge || !isValidTransfer) {
    console.log("[demolisher] validation failed:", {
      mergeType: merge.type,
      mergeDestination: merge.destination,
      mergeSource: merge.source,
      transferType: transfer.type,
      transferSource: transfer.source,
      transferDestination: transfer.destination,
      mediatorAccount,
      isValidMerge,
      isValidTransfer,
    });
    return NextResponse.json({ error: "Transaction structure is invalid." }, { status: 400 });
  }

  // ── Co-sign with mediator ─────────────────────────────────────────────────
  tx.sign(mediatorKeypair);

  return NextResponse.json({
    transaction: tx.toEnvelope().toXDR("base64"),
  });
}

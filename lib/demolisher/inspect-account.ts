import * as StellarSdk from "@stellar/stellar-sdk";
import type {
  AccountInspection,
  Trustline,
  OpenOffer,
  DataEntry,
  ClaimableBalance,
  AccountSigner,
  Thresholds,
  Blocker,
  CleanupStep,
} from "./types";

const HORIZON_URLS: Record<string, string> = {
  PUBLIC: "https://horizon.stellar.org",
  TESTNET: "https://horizon-testnet.stellar.org",
  FUTURENET: "https://horizon-futurenet.stellar.org",
};

const BASE_RESERVE = 0.5;
const BASE_FEE_XLM = 0.0001;

function getServer(network: string): StellarSdk.Horizon.Server {
  const url = HORIZON_URLS[network.toUpperCase()] ?? HORIZON_URLS.TESTNET;
  return new StellarSdk.Horizon.Server(url);
}

function formatAsset(code: string, issuer?: string): string {
  return issuer ? `${code}:${issuer}` : "XLM";
}

function calcReservedXlm(subentryCount: number): number {
  return (2 + subentryCount) * BASE_RESERVE;
}

export async function inspectAccount(
  address: string,
  network: string
): Promise<AccountInspection> {
  const server = getServer(network);

  const [account, offersPage, claimablePage] = await Promise.all([
    server.loadAccount(address),
    server.offers().forAccount(address).limit(100).call(),
    server.claimableBalances().claimant(address).limit(100).call(),
  ]);

  // ── XLM balance ─────────────────────────────────────────────────────────────
  const nativeLine = account.balances.find(
    (b): b is StellarSdk.Horizon.HorizonApi.BalanceLineNative =>
      b.asset_type === "native"
  )!;
  const xlmBalance = nativeLine.balance;
  const reserved = calcReservedXlm(account.subentry_count);
  const xlmAvailable = Math.max(0, parseFloat(xlmBalance) - reserved).toFixed(7);
  const xlmReserved = reserved.toFixed(7);

  // ── Trustlines ──────────────────────────────────────────────────────────────
  const trustlines: Trustline[] = account.balances
    .filter(
      (b): b is StellarSdk.Horizon.HorizonApi.BalanceLineAsset =>
        b.asset_type === "credit_alphanum4" || b.asset_type === "credit_alphanum12"
    )
    .map((b) => ({
      asset: formatAsset(b.asset_code, b.asset_issuer),
      assetCode: b.asset_code,
      assetIssuer: b.asset_issuer,
      balance: b.balance,
      limit: b.limit,
      buyingLiabilities: b.buying_liabilities,
      sellingLiabilities: b.selling_liabilities,
      isAuthorized: b.is_authorized,
      sponsoredBy: b.sponsor ?? null,
    }));

  // ── Open offers ─────────────────────────────────────────────────────────────
  const openOffers: OpenOffer[] = offersPage.records.map((o) => {
    const selling =
      o.selling.asset_type === "native"
        ? "XLM"
        : formatAsset(
            (o.selling as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_code,
            (o.selling as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_issuer
          );
    const buying =
      o.buying.asset_type === "native"
        ? "XLM"
        : formatAsset(
            (o.buying as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_code,
            (o.buying as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_issuer
          );
    return {
      id: String(o.id),
      selling,
      buying,
      amount: o.amount,
      price: o.price,
      sponsoredBy: (o as { sponsor?: string }).sponsor ?? null,
    };
  });

  // ── Data entries ─────────────────────────────────────────────────────────────
  const dataEntries: DataEntry[] = Object.entries(account.data_attr ?? {}).map(
    ([name, value]) => ({
      name,
      value: Buffer.from(value, "base64").toString("utf8"),
      sponsoredBy: null,
    })
  );

  // ── Claimable balances ───────────────────────────────────────────────────────
  const claimableBalances: ClaimableBalance[] = claimablePage.records.map((cb) => ({
    id: cb.id,
    asset: cb.asset,
    amount: cb.amount,
    sponsor: cb.sponsor ?? "",
    claimants: cb.claimants as { destination: string; predicate: unknown }[],
  }));

  // ── Signers ──────────────────────────────────────────────────────────────────
  const signers: AccountSigner[] = account.signers.map((s) => ({
    key: s.key,
    weight: s.weight,
    type: s.type,
    sponsoredBy: (s as { sponsor?: string }).sponsor ?? null,
  }));

  const masterSigner = account.signers.find((s) => s.key === address);
  const thresholds: Thresholds = {
    low: account.thresholds.low_threshold,
    medium: account.thresholds.med_threshold,
    high: account.thresholds.high_threshold,
    masterWeight: masterSigner?.weight ?? 1,
  };

  // ── Sponsorship ──────────────────────────────────────────────────────────────
  const sponsoredBy = (account as unknown as { sponsor?: string }).sponsor ?? null;
  const sponsoring: number =
    (account as unknown as { num_sponsoring?: number }).num_sponsoring ?? 0;

  // ── Blockers ─────────────────────────────────────────────────────────────────
  const blockers: Blocker[] = [];

  if (sponsoredBy) {
    blockers.push({
      type: "sponsored_account",
      severity: "hard",
      description: `This account is sponsored by ${sponsoredBy}. The sponsor must revoke sponsorship before the account can be merged.`,
    });
  }

  if (sponsoring > 0) {
    blockers.push({
      type: "sponsoring_others",
      severity: "hard",
      description: `This account sponsors ${sponsoring} entr${sponsoring === 1 ? "y" : "ies"} on other accounts. Those sponsorships must be revoked first.`,
    });
  }

  const isMultisig = signers.length > 1 || thresholds.high > thresholds.masterWeight;
  if (isMultisig) {
    blockers.push({
      type: "multisig",
      severity: "warn",
      description: `This account uses multisig (high threshold: ${thresholds.high}). All required signers must be present to execute the merge.`,
    });
  }

  const lockedTrustlines = trustlines.filter(
    (t) =>
      parseFloat(t.sellingLiabilities) > 0 || parseFloat(t.buyingLiabilities) > 0
  );
  if (lockedTrustlines.length > 0) {
    blockers.push({
      type: "locked_trustlines",
      severity: "warn",
      description: `${lockedTrustlines.length} trustline(s) have active liabilities from open offers. Cancel offers first.`,
    });
  }

  // ── Cleanup plan ─────────────────────────────────────────────────────────────
  const cleanupSteps: CleanupStep[] = [];

  if (claimableBalances.length > 0) {
    cleanupSteps.push({
      kind: "claim_balances",
      label: "Claim balances",
      description: `Claim ${claimableBalances.length} claimable balance(s) to recover locked XLM.`,
      operationCount: claimableBalances.length,
      reversible: true,
    });
  }

  if (dataEntries.length > 0) {
    cleanupSteps.push({
      kind: "drop_data_entries",
      label: "Remove data entries",
      description: `Delete ${dataEntries.length} data entr${dataEntries.length === 1 ? "y" : "ies"} to free reserved XLM.`,
      operationCount: dataEntries.length,
      reversible: true,
    });
  }

  if (openOffers.length > 0) {
    cleanupSteps.push({
      kind: "cancel_offers",
      label: "Cancel open offers",
      description: `Cancel ${openOffers.length} open DEX offer(s).`,
      operationCount: openOffers.length,
      reversible: true,
    });
  }

  const sellableAssets = trustlines.filter((t) => parseFloat(t.balance) > 0);
  if (sellableAssets.length > 0) {
    cleanupSteps.push({
      kind: "sell_assets",
      label: "Sell token balances",
      description: `Sell ${sellableAssets.length} non-zero token balance(s) to XLM at market price.`,
      operationCount: sellableAssets.length,
      reversible: true,
    });
  }

  if (trustlines.length > 0) {
    cleanupSteps.push({
      kind: "drop_trustlines",
      label: "Remove trustlines",
      description: `Remove ${trustlines.length} trustline(s), returning any remaining dust to issuers.`,
      operationCount: trustlines.length * 2,
      reversible: false,
    });
  }

  cleanupSteps.push({
    kind: "merge_account",
    label: "Close account",
    description: "Merge account into mediator and forward all XLM to destination. Irreversible.",
    operationCount: 2,
    reversible: false,
  });

  // ── Fee + reserve estimates ───────────────────────────────────────────────────
  const totalOps = cleanupSteps.reduce((sum, s) => sum + s.operationCount, 0);
  const estimatedFees = (totalOps * BASE_FEE_XLM).toFixed(7);
  const recoverableReserve = reserved.toFixed(7);

  return {
    address,
    network,
    xlmBalance,
    xlmAvailable,
    xlmReserved,
    trustlines,
    openOffers,
    dataEntries,
    claimableBalances,
    signers,
    thresholds,
    sponsoredBy,
    sponsoring,
    blockers,
    cleanupSteps,
    estimatedFees,
    recoverableReserve,
  };
}

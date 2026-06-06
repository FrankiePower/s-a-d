import * as StellarSdk from "@stellar/stellar-sdk";

export type DemolisherStep =
  | "idle"
  | "fetching"
  | "dropping_data_entries"
  | "cancelling_offers"
  | "selling_assets"
  | "dropping_trustlines"
  | "merging"
  | "done"
  | "error";

export class SigningAbortedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SigningAbortedError";
  }
}

export interface DemolisherOptions {
  source: string;
  destination: string;
  memo?: string;
  networkPassphrase: string;
  horizonUrl: string;
  mediatorEndpoint: string;
  mediatorAccount: string;
  baseFee?: number;
  sign: (xdr: string) => Promise<string>;
  onStep: (step: DemolisherStep, detail: string) => void;
}

const NETWORK_PASSPHRASES: Record<string, string> = {
  PUBLIC: StellarSdk.Networks.PUBLIC,
  TESTNET: StellarSdk.Networks.TESTNET,
  FUTURENET: StellarSdk.Networks.FUTURENET,
};

export function passphraseForNetwork(network: string): string {
  const passphrase =
    NETWORK_PASSPHRASES[network.toUpperCase()] ??
    NETWORK_PASSPHRASES.TESTNET;
  return passphrase;
}

function toStellarAmount(value: string | number): string {
  return parseFloat(String(value)).toFixed(7);
}

function assetFromBalance(b: {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}): StellarSdk.Asset {
  if (b.asset_type === "native") return StellarSdk.Asset.native();
  return new StellarSdk.Asset(b.asset_code!, b.asset_issuer!);
}

export class DemolisherEngine {
  private source: string;
  private destination: string;
  private memo: string | undefined;
  private networkPassphrase: string;
  private mediatorEndpoint: string;
  private mediatorAccount: string;
  private horizonUrl: string;
  private baseFee: number;
  private sign: (xdr: string) => Promise<string>;
  private onStep: (step: DemolisherStep, detail: string) => void;
  private server: StellarSdk.Horizon.Server;
  private sourceAccount: StellarSdk.Horizon.AccountResponse | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private operations: any[] = [];
  private ignoredIssuers: string[] = [];
  private eligibleAssetsSold = false;
  private errorCount = 0;

  constructor(opts: DemolisherOptions) {
    this.source = opts.source;
    this.destination = opts.destination;
    this.memo = opts.memo;
    this.networkPassphrase = opts.networkPassphrase;
    this.mediatorEndpoint = opts.mediatorEndpoint;
    this.mediatorAccount = opts.mediatorAccount;
    this.horizonUrl = opts.horizonUrl;
    this.baseFee = opts.baseFee ?? 200;
    this.sign = opts.sign;
    this.onStep = opts.onStep;
    this.server = new StellarSdk.Horizon.Server(opts.horizonUrl);
  }

  private get xlmBalance(): string {
    if (!this.sourceAccount) return "0";
    const native = this.sourceAccount.balances.find(
      (b): b is StellarSdk.Horizon.HorizonApi.BalanceLineNative =>
        b.asset_type === "native"
    );
    return native?.balance ?? "0";
  }

  private async fetchSourceAccount(): Promise<void> {
    this.onStep("fetching", "Fetching account state from Horizon…");
    this.sourceAccount = await this.server.loadAccount(this.source);
  }

  private async dropDataEntries(): Promise<boolean> {
    const data = this.sourceAccount!.data_attr ?? {};
    for (const name of Object.keys(data)) {
      this.operations.push(
        StellarSdk.Operation.manageData({ name, value: null })
      );
    }
    return this.exec("dropping_data_entries", "Removing data entries…");
  }

  private async cancelOffers(): Promise<boolean> {
    const { records } = await this.server
      .offers()
      .forAccount(this.source)
      .limit(100)
      .call();

    for (const o of records) {
      this.operations.push(
        StellarSdk.Operation.manageSellOffer({
          buying: assetFromBalance(o.buying as StellarSdk.Horizon.HorizonApi.BalanceLine),
          selling: assetFromBalance(o.selling as StellarSdk.Horizon.HorizonApi.BalanceLine),
          amount: "0",
          price: o.price,
          offerId: String(o.id),
        })
      );
    }
    return this.exec("cancelling_offers", "Cancelling open DEX offers…");
  }

  private async sellAssets(): Promise<boolean> {
    if (this.eligibleAssetsSold) return false;
    for (const b of this.sourceAccount!.balances) {
      if (
        (b.asset_type === "credit_alphanum4" ||
          b.asset_type === "credit_alphanum12") &&
        parseFloat(b.balance) > 0 &&
        !this.ignoredIssuers.includes(
          (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_issuer
        )
      ) {
        const asset = assetFromBalance(b);
        this.operations.push(
          StellarSdk.Operation.manageSellOffer({
            selling: asset,
            buying: StellarSdk.Asset.native(),
            price: "0.0000001",
            amount: toStellarAmount(b.balance),
          })
        );
      }
    }
    const result = await this.exec("selling_assets", "Selling token balances to XLM…");
    this.eligibleAssetsSold = true;
    return result;
  }

  private async dropTrustlines(): Promise<boolean> {
    for (const b of this.sourceAccount!.balances) {
      if (
        b.asset_type === "credit_alphanum4" ||
        b.asset_type === "credit_alphanum12"
      ) {
        const typed = b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset;
        const asset = new StellarSdk.Asset(typed.asset_code, typed.asset_issuer);
        if (parseFloat(b.balance) > 0) {
          this.operations.push(
            StellarSdk.Operation.payment({
              asset,
              destination: typed.asset_issuer,
              amount: toStellarAmount(b.balance),
            })
          );
        }
        this.operations.push(
          StellarSdk.Operation.changeTrust({ asset, limit: "0" })
        );
      }
    }
    return this.exec("dropping_trustlines", "Removing trustlines…");
  }

  private async mergeAccount(): Promise<boolean> {
    const xlm = parseFloat(this.xlmBalance);
    const amount = toStellarAmount(xlm - (2 * this.baseFee) / 10_000_000);

    this.operations.push(
      StellarSdk.Operation.accountMerge({ destination: this.mediatorAccount })
    );
    this.operations.push(
      StellarSdk.Operation.payment({
        destination: this.destination,
        asset: StellarSdk.Asset.native(),
        amount,
        source: this.mediatorAccount,
      })
    );
    return this.exec("merging", "Merging account…", true);
  }

  private async buildTransaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ops: any[],
    memo?: string
  ): Promise<StellarSdk.Transaction> {
    const account = new StellarSdk.Account(
      this.source,
      this.sourceAccount!.sequence
    );
    const builder = new StellarSdk.TransactionBuilder(account, {
      fee: String(this.baseFee),
      networkPassphrase: this.networkPassphrase,
      memo: memo ? StellarSdk.Memo.text(memo) : undefined,
    });
    for (const op of ops) builder.addOperation(op);
    return builder.setTimeout(300).build() as StellarSdk.Transaction;
  }

  // Returns raw co-signed XDR string — no SDK round-trip
  private async requestMediatorCoSign(freighterSignedXdr: string): Promise<string> {
    const network = Object.entries({
      PUBLIC: StellarSdk.Networks.PUBLIC,
      TESTNET: StellarSdk.Networks.TESTNET,
      FUTURENET: StellarSdk.Networks.FUTURENET,
    }).find(([, v]) => v === this.networkPassphrase)?.[0] ?? "TESTNET";

    const response = await fetch(this.mediatorEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: freighterSignedXdr, network }),
    });
    if (!response.ok)
      throw new Error("Mediator server refused to co-sign the merge transaction.");
    const { transaction } = await response.json();
    return transaction as string;
  }

  // Submit raw base64 XDR directly to Horizon — no SDK serialization
  private async submitXdr(xdr: string): Promise<void> {
    const response = await fetch(`${this.horizonUrl}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `tx=${encodeURIComponent(xdr)}`,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const codes = data?.extras?.result_codes;
      const title = data?.title;
      throw new Error(
        `Horizon rejected the transaction: ${title ?? ""} ${JSON.stringify(codes ?? data)}`.trim()
      );
    }
  }

  private async exec(
    step: DemolisherStep,
    detail: string,
    requiresMediatorSignature = false
  ): Promise<boolean> {
    if (this.operations.length === 0) return false;

    this.onStep(step, detail);

    const batch = this.operations.splice(0, 100);
    const tx = await this.buildTransaction(batch, requiresMediatorSignature ? this.memo : undefined);

    // Step 1: Freighter signs the unsigned transaction
    const freighterSignedXdr = await this.sign(tx.toEnvelope().toXDR("base64"));
    if (!freighterSignedXdr) {
      throw new SigningAbortedError("Signing was cancelled or timed out.");
    }

    // Step 2: For the merge step, mediator co-signs the Freighter-signed XDR.
    // We pass the raw base64 strings directly — no fromXDR/toXDR round-trips.
    const submitXdr = requiresMediatorSignature
      ? await this.requestMediatorCoSign(freighterSignedXdr)
      : freighterSignedXdr;

    // Step 3: Submit the raw XDR string directly to Horizon via fetch.
    // This avoids any SDK serialization that could corrupt the signatures.
    await this.submitXdr(submitXdr);

    return true;
  }

  private trackDeletedIssuers(
    err: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ops: any[]
  ): void {
    const errObj = err as {
      response?: { data?: { extras?: { result_codes?: { operations?: string[] } } } };
    };
    const resultCodes =
      errObj?.response?.data?.extras?.result_codes?.operations;
    if (!resultCodes) return;
    for (let i = 0; i < resultCodes.length; i++) {
      if (resultCodes[i] === "op_sell_no_issuer") {
        this.ignoredIssuers.push(String(ops[i]));
      }
    }
  }

  async run(): Promise<void> {
    if (!this.destination) throw new Error("Destination address is required.");

    let retries = 0;
    const MAX_RETRIES = 3;

    while (true) {
      try {
        await this.fetchSourceAccount();
        if (await this.dropDataEntries()) continue;
        if (await this.cancelOffers()) continue;
        if (await this.sellAssets()) continue;
        if (await this.dropTrustlines()) continue;
        if (await this.mergeAccount()) {
          this.onStep("done", `Account ${this.source} merged successfully.`);
          break;
        }
      } catch (err: unknown) {
        this.operations = [];

        // Signing was cancelled — abort immediately, no retry
        if (err instanceof SigningAbortedError) {
          this.onStep("error", err.message);
          throw err;
        }

        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("channel closed") || msg.toLowerCase().includes("user declined")) {
          this.onStep("error", "Signing was cancelled.");
          throw new SigningAbortedError("Signing was cancelled.");
        }

        // Transient network/Horizon error — retry up to MAX_RETRIES
        retries++;
        if (retries > MAX_RETRIES) {
          this.onStep("error", msg);
          throw err;
        }

        this.onStep("fetching", `Error — retrying (${retries}/${MAX_RETRIES})…`);
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  }
}

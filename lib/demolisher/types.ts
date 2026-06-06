export interface Trustline {
  asset: string        // e.g. "USDC:GA5ZSE..."
  assetCode: string
  assetIssuer: string
  balance: string
  limit: string
  buyingLiabilities: string
  sellingLiabilities: string
  isAuthorized: boolean
  sponsoredBy: string | null
}

export interface OpenOffer {
  id: string
  selling: string      // e.g. "XLM" or "USDC:GA5ZSE..."
  buying: string
  amount: string
  price: string
  sponsoredBy: string | null
}

export interface DataEntry {
  name: string
  value: string
  sponsoredBy: string | null
}

export interface ClaimableBalance {
  id: string
  asset: string
  amount: string
  sponsor: string
  claimants: { destination: string; predicate: unknown }[]
}

export interface AccountSigner {
  key: string
  weight: number
  type: string
  sponsoredBy: string | null
}

export interface Thresholds {
  low: number
  medium: number
  high: number
  masterWeight: number
}

export type BlockerSeverity = "hard" | "warn"

export interface Blocker {
  type: string
  severity: BlockerSeverity
  description: string
}

export type CleanupStepKind =
  | "drop_data_entries"
  | "cancel_offers"
  | "sell_assets"
  | "drop_trustlines"
  | "claim_balances"
  | "merge_account"

export interface CleanupStep {
  kind: CleanupStepKind
  label: string
  description: string
  operationCount: number
  reversible: boolean
}

export interface AccountInspection {
  address: string
  network: string
  // Balances
  xlmBalance: string
  xlmAvailable: string
  xlmReserved: string
  trustlines: Trustline[]
  // Activity
  openOffers: OpenOffer[]
  dataEntries: DataEntry[]
  claimableBalances: ClaimableBalance[]
  // Signing
  signers: AccountSigner[]
  thresholds: Thresholds
  // Sponsorship
  sponsoredBy: string | null
  sponsoring: number
  // Analysis
  blockers: Blocker[]
  cleanupSteps: CleanupStep[]
  estimatedFees: string
  recoverableReserve: string
}

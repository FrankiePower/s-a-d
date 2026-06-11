# S.A.D - Stellar Account Demolisher

S.A.D is a demo project for **Stellar account migration, cleanup, and optional closure**.

The goal is to validate a proposal for a safer Account Demolisher tool: one that helps users inspect everything attached to a Stellar account, understand what can be recovered or migrated, remove blockers, and only then decide whether to close the account.

## Why This Exists

Closing a Stellar account is not always simple. An account may have trustlines, open offers, claimable balances, data entries, multisig rules, sponsored reserves, Soroban token state, or DeFi positions. For most users, cleaning all of that up manually is confusing and risky.

S.A.D reframes account closure as a safety-first flow:

- inspect the account before signing anything
- show balances, blockers, and risks clearly
- preview cleanup and migration steps
- keep signing non-custodial and client-side
- separate reversible cleanup from irreversible account merge
- support both classic Stellar and future Soroban-aware flows

## System Layer Diagram

This shows the main product layers and which parts are user-facing, reusable, or backend-assisted.

<img width="7326" height="7692" alt="system-layer" src="https://github.com/user-attachments/assets/58e5a61b-43bd-413d-9a72-ccb2445599b8" />

## What We Are Building First

This repo starts as a focused submission demo, not the full production system.

The demo should make the product direction obvious:

- a polished web interface for scanning a Stellar account
- a rich account-state preview
- visible blockers such as sponsorships, multisig, trustlines, offers, and DeFi positions
- a staged cleanup plan with risk labels
- a clear final-closure step that feels intentionally protected

The point is to show that we understand the hard parts of the RFP and can turn them into a credible user experience.

## Our Unique Position

We are the team behind **[Latch](https://github.com/FrankiePower/latch)** — open-source infrastructure that bridges legacy Stellar G-addresses to Soroban Smart Accounts (C-addresses).

That makes S.A.D. the natural completion step of the Latch migration pipeline:

<img width="10127" height="6010" alt="sadxlatch" src="https://github.com/user-attachments/assets/b2499739-966e-463e-ae83-2b8d048e7d19" /> </br>


Every Latch user who onboards to a Smart Account is a natural S.A.D. user. The account demolisher is not a standalone utility in our roadmap — it is the **last step of the Latch onboarding flow**.

This also means the recovered reserves (1 XLM base + 0.5 XLM per trustline, signer, data entry) flow directly into funding the user's new Smart Account — exactly where they are needed.

No other demolisher submission controls the full migration pipeline. We build both ends.

## Long-Term Direction

The eventual product is an open-source stack for account recovery, cleanup, migration, and closure across Stellar:

- a reusable TypeScript planning SDK
- a backend/indexing service for heavy discovery and protocol adapters
- a production web app with Stellar Wallets Kit support
- documentation, tests, and security review materials
- native integration with the Latch Bridge for one-click G-address → Smart Account migration

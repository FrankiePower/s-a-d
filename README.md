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

## What We Are Building First

This repo starts as a focused submission demo, not the full production system.

The demo should make the product direction obvious:

- a polished web interface for scanning a Stellar account
- a rich account-state preview
- visible blockers such as sponsorships, multisig, trustlines, offers, and DeFi positions
- a staged cleanup plan with risk labels
- a clear final-closure step that feels intentionally protected

The point is to show that we understand the hard parts of the RFP and can turn them into a credible user experience.

## Long-Term Direction

The eventual product is an open-source stack for account recovery, cleanup, migration, and closure across Stellar:

- a reusable TypeScript planning SDK
- a backend/indexing service for heavy discovery and protocol adapters
- a production web app with Stellar Wallets Kit support
- documentation, tests, and security review materials

S.A.D can also support softer migration use cases, including moving from a traditional Stellar account into a smart account without forcing immediate account closure.

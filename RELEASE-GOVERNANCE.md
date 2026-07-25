# Release governance

1. Product source and this distribution repository remain separate from every private vault.
2. The product build produces a closed-inventory package, privacy-gate result, SBOM/provenance where available, signed canonical channel envelope, and exact asset/runtime-manifest hashes and lengths.
3. Cerberus security approval and Nemesis release approval are required in the protected `production-release` environment.
4. Tags and published releases are immutable. Stable releases are non-prerelease; beta releases are prerelease.
5. The metadata signing private key is never stored in this repository. Production signing occurs in protected infrastructure; this repository verifies only.
6. Key rotation requires old-key authorization of the new trust material during an overlap window. Revocation uses a higher signed sequence.
7. A release operator cannot bypass missing signatures, failed privacy checks, stale metadata, an incomplete runtime manifest, or mismatched assets.
8. Emergency rollback points a new higher-sequence feed at a previously verified, non-revoked version. It never lowers the accepted metadata sequence.

## One-time bridge contract

The bridge is exceptional bootstrap material, not a recurring update channel. A bridge release contains exactly:

- `Olympus-Setup-<version>.exe`, built from the reviewed fixed-bootstrap source;
- `Olympus-Setup-<version>.exe.minisig`, created offline with the dedicated bootstrap key;
- the normal signed Olympus feed, package, and closed publication manifest for the first installed version.

The Minisign private key never enters source control, GitHub secrets, Actions, logs, or the release candidate directory. `OlympusBridgeVerify.exe` independently verifies the final installer and its detached signature; `scripts/verify-bridge-candidate.ps1` pins that verifier by SHA-256, requires exactly the installer and `.minisig`, and binds the embedded Olympus Ed25519 root to the reviewed production root. The candidate is staged only after that gate passes and the operator records the public-key fingerprint in the release approval.

After installation, the bridge writes only the fixed bootstrap, updater worker, selected immutable version slot, signed manifests/key store, and their exact hash/trust bindings. It is transition-only: both native and Pantheon schema-4 state must already exist, pass integrity validation, and agree on the install ID and vault root. The install ID, vault root, adapter snapshot, and unrelated Pantheon fields survive; the Pantheon launcher/worker hashes are updated atomically with the native selection state. The verified running tray is stopped before mutation; a partial commit restores every replaced path, including both state authorities. Every later System/tray update arrives through the signed Olympus feed and costs no recurring certificate fee. Reissuing a bridge is required only for a bootstrap-breaking migration or bootstrap-key rotation; it is never silently substituted for an ordinary update.

Release order is: audit source and public inventory; build deterministic native payloads; pin the production Ed25519 public root; build and sign the canonical feed/package offline; independently verify the candidate; build the bridge; sign the bridge offline with Minisign; record Cerberus and Nemesis approval; publish immutable assets; test on a clean Windows profile; then advance the stable pointer with a higher sequence.

Branch protection should require reviews and status checks. The `production-release` environment should require named approvers and restrict deployment branches/tags. Repository Actions permissions should default to read-only; the publish job alone receives `contents: write`.

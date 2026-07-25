# Public trust material

Production release public keys are committed here only after an audited key ceremony. Private keys never enter this repository, GitHub artifacts, logs, or ordinary workstation environment variables. The launcher pins the initial root; repository copies are for CI verification and transparency, not trust-on-first-use.

Use two dedicated authorities:

- `release-root.pem`: Ed25519 public key for feeds, publication manifests, runtime manifests, and key rotation.
- `bootstrap-minisign.pub`: Minisign public key for the one-time bridge installer and its detached `.minisig`.

Do not reuse the Olympus Hub signing key. The corresponding private keys remain offline and outside the product source repository. `native/resources/production-release-keys.json` must pin the same Ed25519 root before a production bridge is built; an empty file is a deliberate fail-closed development state.

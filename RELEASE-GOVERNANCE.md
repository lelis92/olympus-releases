# Release governance

1. Product source and this distribution repository remain separate from every private vault.
2. The product build produces a closed-inventory package, privacy-gate result, SBOM/provenance where available, signed canonical channel envelope, exact asset hash/length, and an Authenticode report.
3. Cerberus security approval and Nemesis release approval are required in the protected `production-release` environment.
4. Tags and published releases are immutable. Stable releases are non-prerelease; beta releases are prerelease.
5. The metadata signing private key is never stored in this repository. Production signing occurs in protected infrastructure; this repository verifies only.
6. Key rotation requires old-key authorization of the new trust material during an overlap window. Revocation uses a higher signed sequence.
7. A release operator cannot bypass missing signatures, failed privacy checks, an untrusted Windows publisher, stale metadata, or mismatched assets.
8. Emergency rollback points a new higher-sequence feed at a previously verified, non-revoked version. It never lowers the accepted metadata sequence.

Branch protection should require reviews and status checks. The `production-release` environment should require named approvers and restrict deployment branches/tags. Repository Actions permissions should default to read-only; the publish job alone receives `contents: write`.

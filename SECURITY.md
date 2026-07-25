# Security policy

Do not open a public issue for a suspected signing-key compromise, updater bypass, archive traversal, rollback/replay flaw, or accidental personal-data publication. Contact the private security address configured by the repository owner. Include the affected release sequence, version, channel, hashes, and reproduction steps; never include a user's vault or credentials.

Supported channels are the latest stable release and the latest beta release. A signed revocation or emergency rollback uses a new, higher feed sequence. Existing metadata is never silently rewritten to lower the replay floor.

Release metadata and installed runtime manifests use a product-specific offline Ed25519 authority. The one-time bridge installer is separately signed with a dedicated Minisign key. Olympus-owned Windows executables are authenticated by that signed-manifest closure, not paid Authenticode. Third-party vendor helpers retain their own Authenticode checks. GitHub authentication and HTTPS are transport defenses, not the Olympus trust root.

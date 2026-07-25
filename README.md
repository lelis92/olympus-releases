# Olympus releases

This repository is the public, read-only distribution edge for signed Olympus software releases. It contains no personal knowledge vault, user settings, Git credentials, signing private keys, or source checkout. Stable and beta feeds are separate. The fixed Olympus bootstrap treats GitHub as transport only: it verifies the pinned Olympus Ed25519 release signature, expiry, monotonic sequence, exact asset length and SHA-256, signed runtime manifest, and target channel before activation.

## Channels

- `channels/stable.json` points to the current production release.
- `channels/beta.json` points to the current opt-in prerelease.
- Immutable versioned assets are attached to GitHub Releases, not committed to the branch.

Release publication is intentionally fail-closed. The workflow accepts only a pre-signed candidate from the protected product build, independently verifies its Ed25519 authority and closed package, requires the protected production-release environment, and then publishes immutable assets. Missing trust material or an unverifiable artifact stops publication. GitHub Releases and Actions are the public shelf; neither private source nor a personal Vault belongs here.

Olympus-owned executables intentionally do not require a paid Windows code-signing certificate. Windows may therefore show an Unknown publisher or SmartScreen warning for the one-time bridge installer. After that bridge, the fixed bootstrap verifies every selected version before starting it. Authenticode remains required only for third-party vendor helpers such as Git and Node.

The exact one-time bridge contents, offline Minisign boundary, approvals, and publication order are defined in `RELEASE-GOVERNANCE.md`. A bridge is never produced by the ordinary channel builder and never replaces a normal signed update.

This software distribution is separate from private vault synchronization. Updating Olympus never reads or publishes a person's knowledge; syncing a vault never installs software.

## License and attribution

The distributed scaffold is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/): attribution is required, commercial use is not permitted under that license, and adaptations must use the same license. Required attribution:

> Built on the myPKA™ Scaffold by Paperless Movement® / ICOR®.
> Source: https://github.com/TomSolid/mypka
> Licensed under CC BY-NC-SA 4.0.

Paperless Movement®, ICOR®, myICOR™, and myPKA™ are not licensed as product branding. Consult the `LICENSE` and `NOTICE.md` shipped inside each release for the complete terms; this summary is not a replacement for them. Olympus names and artwork may have separate rights and are not granted beyond the notices shipped with a release.

Security reports should follow [SECURITY.md](SECURITY.md). Release authority and emergency procedures are in [RELEASE-GOVERNANCE.md](RELEASE-GOVERNANCE.md).

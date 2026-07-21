# Olympus releases

This repository is the public, read-only distribution edge for signed Olympus software releases. It contains no personal knowledge vault, user settings, Git credentials, signing private keys, or source checkout. Stable and beta feeds are separate. The Olympus launcher treats GitHub as transport only: it verifies the pinned Olympus release signature, expiry, monotonic sequence, exact asset length and SHA-256, package manifest, target channel, and Windows publisher before activation.

## Channels

- `channels/stable.json` points to the current production release.
- `channels/beta.json` points to the current opt-in prerelease.
- Immutable versioned assets are attached to GitHub Releases, not committed to the branch.

Release publication is intentionally fail-closed. The workflow accepts only a pre-signed candidate from the protected product build, independently verifies it, checks Authenticode on Windows, requires the protected production-release environment, and then publishes immutable assets. Missing trust material or an unverifiable artifact stops publication.

This software distribution is separate from private vault synchronization. Updating Olympus never reads or publishes a person's knowledge; syncing a vault never installs software.

## License and attribution

The distributed scaffold is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/): attribution is required, commercial use is not permitted under that license, and adaptations must use the same license. Required attribution:

> Built on the myPKA™ Scaffold by Paperless Movement® / ICOR®.
> Source: https://github.com/TomSolid/mypka
> Licensed under CC BY-NC-SA 4.0.

Paperless Movement®, ICOR®, myICOR™, and myPKA™ are not licensed as product branding. Consult the `LICENSE` and `NOTICE.md` shipped inside each release for the complete terms; this summary is not a replacement for them. Olympus names and artwork may have separate rights and are not granted beyond the notices shipped with a release.

Security reports should follow [SECURITY.md](SECURITY.md). Release authority and emergency procedures are in [RELEASE-GOVERNANCE.md](RELEASE-GOVERNANCE.md).

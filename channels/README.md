# Signed channels

`stable.json` and `beta.json` are canonical JSON envelopes. Each contains a `signed` release record and one or more keyed Ed25519 signatures over the canonical `signed` object. Feed files are updated only by the protected release workflow. Placeholder or unsigned feeds are not committed.

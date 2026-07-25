#!/usr/bin/env node
import { createHash, createPublicKey, verify } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  throw new Error("Non-canonical JSON value");
}

function safeWindowsPath(value) {
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
  return typeof value === "string" && value.length > 0 && value.length <= 240 && !value.includes("\\")
    && value.split("/").every((part) => part && part !== "." && part !== ".." && part.length <= 100
      && !/[<>:"|?*\u0000-\u001f]/.test(part) && !/[. ]$/.test(part) && !reserved.test(part) && /^[A-Za-z0-9._ -]+$/.test(part));
}

function verifySignature(envelope, releaseKey, keyId, label) {
  const signature = envelope.signatures?.find((item) => item.key_id === keyId && item.algorithm === "ed25519");
  const signatureBytes = signature && Buffer.from(signature.signature, "base64");
  if (!signature || releaseKey.asymmetricKeyType !== "ed25519" || signatureBytes.length !== 64 || signatureBytes.toString("base64") !== signature.signature
      || !verify(null, Buffer.from(canonical(envelope.signed)), releaseKey, signatureBytes)) throw new Error(`${label} signature failed`);
}

function compilePattern(source) { return source.startsWith("(?i)") ? new RegExp(source.slice(4), "iu") : new RegExp(source, "u"); }

const [feedPath, assetPath, publicationPath, publicKeyPath, denylistPath, outputPath] = process.argv.slice(2).map((item) => item && resolve(item));
if (!feedPath || !assetPath || !publicationPath || !publicKeyPath || !denylistPath || !outputPath) {
  throw new Error("usage: verify-candidate.mjs <feed> <asset> <publication-manifest> <public-key.pem> <privacy-denylist> <verified-executables>");
}
for (const path of [feedPath, assetPath, publicationPath, publicKeyPath, denylistPath]) if (!statSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error("Candidate input is indirect or not a file");
const candidateRoot = dirname(feedPath);
if ([assetPath, publicationPath].some((path) => dirname(path) !== candidateRoot)) throw new Error("Candidate publication files are not co-located");
const candidateNames = readdirSync(candidateRoot, { withFileTypes: true });
if (candidateNames.some((item) => !item.isFile() || item.isSymbolicLink()) || candidateNames.length !== 3) throw new Error("Candidate contains arbitrary extras or indirect entries");
const feedBytes = readFileSync(feedPath);
const text = feedBytes.toString("utf8");
const envelope = JSON.parse(text);
if (`${canonical(envelope)}\n` !== text || !Array.isArray(envelope.signatures) || envelope.signatures.length === 0) throw new Error("Feed is not a canonical signed envelope");
const signed = envelope.signed;
const publishedAt = Date.parse(signed?.published_at); const expiresAt = Date.parse(signed?.expires_at);
const verificationNow = process.env.OLYMPUS_VERIFICATION_TIME ? Date.parse(process.env.OLYMPUS_VERIFICATION_TIME) : Date.now();
if (!Number.isFinite(verificationNow)) throw new Error("Verification time is invalid");
if (signed?.schema_version !== 1 || signed.product !== "olympus-pantheon" || signed.channel !== process.env.OLYMPUS_EXPECTED_CHANNEL
    || !Number.isSafeInteger(signed.sequence) || signed.sequence < 1 || !Number.isFinite(publishedAt) || !Number.isFinite(expiresAt)
    || publishedAt > verificationNow + 5 * 60_000 || expiresAt <= verificationNow || expiresAt <= publishedAt || expiresAt - publishedAt > 31 * 24 * 60 * 60_000
    || signed.target?.os !== "windows" || !["x64", "arm64"].includes(signed.target?.arch)
    || signed.asset?.trust?.model !== "olympus-ed25519-sha256-v1"
    || !/^[0-9a-f]{64}$/.test(signed.asset.trust.runtime_manifest_sha256 || "")
    || signed.asset.trust.runtime_manifest_sha256 !== signed.package_manifest_sha256) throw new Error("Signed production release policy is incomplete or expired");
const assetUrl = new URL(signed.asset.url);
if (assetUrl.protocol !== "https:" || assetUrl.username || assetUrl.password || assetUrl.hash || decodeURIComponent(assetUrl.pathname.split("/").pop()) !== signed.asset.name) throw new Error("Signed asset URL policy failed");
const keyId = process.env.OLYMPUS_RELEASE_KEY_ID;
const releaseKey = createPublicKey(readFileSync(publicKeyPath));
verifySignature(envelope, releaseKey, keyId, "Olympus release");
const asset = readFileSync(assetPath);
if (basename(assetPath) !== envelope.signed.asset.name || asset.length !== envelope.signed.asset.length
    || createHash("sha256").update(asset).digest("hex") !== envelope.signed.asset.sha256) throw new Error("Signed asset identity failed");
const publicationBytes = readFileSync(publicationPath);
const publicationText = publicationBytes.toString("utf8");
const publication = JSON.parse(publicationText);
if (`${canonical(publication)}\n` !== publicationText || publication.signed?.schema_version !== 1 || publication.signed.product !== "olympus-pantheon"
    || publication.signed.channel !== signed.channel || publication.signed.sequence !== signed.sequence || publication.signed.version !== signed.version
    || !Array.isArray(publication.signed.files) || publication.signed.files.length !== 2) throw new Error("Closed publication manifest is invalid");
verifySignature(publication, releaseKey, keyId, "Publication manifest");
const denylistBytes = readFileSync(denylistPath);
if (createHash("sha256").update(denylistBytes).digest("hex") !== publication.signed.privacy_denylist_sha256) throw new Error("Publication privacy policy binding failed");
const declaredPublication = new Map(publication.signed.files.map((item) => [item.name, item]));
for (const [path, role] of [[feedPath, "signed-feed"], [assetPath, "package"]]) {
  const bytes = readFileSync(path); const declared = declaredPublication.get(basename(path));
  if (!declared || declared.role !== role || declared.length !== bytes.length || declared.sha256 !== createHash("sha256").update(bytes).digest("hex")) throw new Error("Publication inventory identity failed");
}
if (declaredPublication.size !== 2 || basename(publicationPath) !== "publication-manifest.json") throw new Error("Publication inventory is not closed");
const denylist = JSON.parse(denylistBytes);
if (denylist.schema_version !== 1 || !Array.isArray(denylist.path_patterns) || !Array.isArray(denylist.content_patterns)) throw new Error("Privacy denylist is invalid");
const pathPatterns = denylist.path_patterns.map(compilePattern); const contentPatterns = denylist.content_patterns.map(compilePattern);
for (const path of [feedPath, assetPath, publicationPath]) if (pathPatterns.some((pattern) => pattern.test(basename(path)))) throw new Error("Publication filename failed the privacy denylist");
const archiveText = asset.toString("utf8");
const archive = JSON.parse(archiveText);
if (`${canonical(archive)}\n` !== archiveText || Object.keys(archive).sort().join(",") !== "files,manifest,schema_version"
    || archive.schema_version !== 1 || archive.manifest?.schema_version !== 1 || archive.manifest.product !== "olympus-pantheon"
    || Object.keys(archive.manifest).sort().join(",") !== "files,product,schema_version,version"
    || archive.manifest.version !== envelope.signed.version || !Array.isArray(archive.manifest.files) || !Array.isArray(archive.files)) throw new Error("Package is invalid or version-mismatched");
if (createHash("sha256").update(Buffer.from(canonical(archive.manifest))).digest("hex") !== envelope.signed.package_manifest_sha256) throw new Error("Package manifest identity failed");
rmSync(outputPath, { recursive: true, force: true });
mkdirSync(outputPath, { recursive: false });
let executableCount = 0;
const expectedFiles = new Map();
for (const item of archive.manifest.files) {
  if (Object.keys(item || {}).sort().join(",") !== "length,path,sha256" || !safeWindowsPath(item.path)
      || !Number.isSafeInteger(item.length) || item.length < 0 || !/^[0-9a-f]{64}$/.test(item.sha256) || expectedFiles.has(item.path.toLowerCase())) throw new Error("Package manifest path or identity failed");
  expectedFiles.set(item.path.toLowerCase(), item);
}
const actualFiles = new Set();
for (const item of archive.files) {
  if (Object.keys(item || {}).sort().join(",") !== "content_base64,length,path,sha256") throw new Error("Package file has unknown fields");
  const expected = expectedFiles.get(String(item.path).toLowerCase());
  if (!expected || actualFiles.has(String(item.path).toLowerCase()) || expected.length !== item.length || expected.sha256 !== item.sha256) throw new Error("Package is not closed or has colliding files");
  actualFiles.add(String(item.path).toLowerCase());
  const bytes = Buffer.from(item.content_base64, "base64");
  if (bytes.toString("base64") !== item.content_base64 || bytes.length !== item.length || createHash("sha256").update(bytes).digest("hex") !== item.sha256) throw new Error(`Package content failed: ${item.path}`);
  if (pathPatterns.some((pattern) => pattern.test(item.path)) || (!bytes.includes(0) && contentPatterns.some((pattern) => pattern.test(bytes.toString("utf8"))))) throw new Error(`Package privacy denylist failed: ${item.path}`);
  if (/\.exe$/i.test(item.path)) { writeFileSync(join(outputPath, `${executableCount}-${basename(item.path)}`), bytes, { flag: "wx" }); executableCount += 1; }
}
if (actualFiles.size !== expectedFiles.size || executableCount === 0) throw new Error("Candidate package is incomplete or contains no Windows executable");
process.stdout.write(`${JSON.stringify({ channel: envelope.signed.channel, version: envelope.signed.version,
  sequence: envelope.signed.sequence, trust_model: envelope.signed.asset.trust.model, executable_count: executableCount })}\n`);

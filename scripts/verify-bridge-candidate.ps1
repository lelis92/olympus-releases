[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$CandidateDirectory,
    [Parameter(Mandatory=$true)][string]$VerifierPath,
    [Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$VerifierSha256,
    [Parameter(Mandatory=$true)][string]$BootstrapPublicKey,
    [Parameter(Mandatory=$true)][string]$ReleaseRootPublicKey,
    [Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-f]{64}$')][string]$ReleaseRootKeyId,
    [Parameter(Mandatory=$true)][ValidateSet('stable','beta')][string]$Channel,
    [Parameter(Mandatory=$true)][string]$VerificationTime,
    [Parameter(Mandatory=$true)][string]$Version
)
$ErrorActionPreference = "Stop"
$root = [IO.Path]::GetFullPath($CandidateDirectory)
$verifier = [IO.Path]::GetFullPath($VerifierPath)
if (-not (Test-Path -LiteralPath $root -PathType Container) -or
    -not (Test-Path -LiteralPath $verifier -PathType Leaf) -or
    (Get-FileHash -LiteralPath $verifier -Algorithm SHA256).Hash.ToLowerInvariant() -ne $VerifierSha256.ToLowerInvariant()) {
    throw "Bridge verifier authority is unavailable or changed."
}
$expectedExe = "Olympus-Setup-$Version.exe"
$expectedSignature = "$expectedExe.minisig"
$files = @(Get-ChildItem -LiteralPath $root -Force)
if ($files.Count -ne 2 -or @($files | Where-Object { -not $_.PSIsContainer -and $_.Name -in @($expectedExe, $expectedSignature) }).Count -ne 2) {
    throw "Bridge candidate must contain exactly the installer and detached Minisign signature."
}
& $verifier (Join-Path $root $expectedExe) (Join-Path $root $expectedSignature) $BootstrapPublicKey `
    $ReleaseRootPublicKey $ReleaseRootKeyId $Channel $VerificationTime $Version
if ($LASTEXITCODE -ne 0) { throw "Bridge candidate verification failed." }
Write-Output "Bridge publication candidate verified."

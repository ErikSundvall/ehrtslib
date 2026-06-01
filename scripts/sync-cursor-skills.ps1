# Sync Cursor skills from local plugin/user dirs into .cursor/skills/ (for cloud agent parity).
# Run from repo root: .\scripts\sync-cursor-skills.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $repoRoot "deno.json"))) {
  throw "Run from ehrtslib repo (deno.json not found in $repoRoot)"
}
$skillsDir = Join-Path $repoRoot ".cursor\skills"
New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null

$openEhrPlugin = Join-Path $env:USERPROFILE ".cursor\plugins\local\openehr-assistant\skills"
if (Test-Path $openEhrPlugin) {
  Copy-Item -Recurse -Force (Join-Path $openEhrPlugin "*") $skillsDir
  Write-Host "Synced openehr-assistant plugin skills"
} else {
  Write-Warning "openEHR Assistant plugin not found at $openEhrPlugin"
}

$context7Glob = Join-Path $env:USERPROFILE ".cursor\plugins\cache\cursor-public\context7-plugin\*\skills\context7-mcp"
$context7 = Get-Item $context7Glob -ErrorAction SilentlyContinue | Select-Object -First 1
if ($context7) {
  Copy-Item -Recurse -Force $context7.FullName (Join-Path $skillsDir "context7-mcp")
  Write-Host "Synced context7-mcp skill"
} else {
  Write-Warning "Context7 plugin skill not found"
}

$userSkills = Join-Path $env:USERPROFILE ".agents\skills"
if (Test-Path $userSkills) {
  Get-ChildItem $userSkills -Directory | ForEach-Object {
    $dest = Join-Path $skillsDir $_.Name
    Copy-Item -Recurse -Force $_.FullName $dest
  }
  Write-Host "Synced user skills from $userSkills"
}

Write-Host "Done. Skills in $skillsDir :"
Get-ChildItem $skillsDir -Directory | ForEach-Object { "  - $($_.Name)" }

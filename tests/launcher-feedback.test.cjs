const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const launcherPath = path.join(__dirname, '..', 'Andrew_next_task.bat');
const launcher = fs.readFileSync(launcherPath, 'utf8');
const psMarker = '###SITEWORKS_POWERSHELL_DATA_START_V1###';
const zipMarker = '###SITEWORKS_EMBEDDED_ZIP_DATA_START_V1###';

function extractBase64Between(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Missing marker: ${startMarker}`);
  assert.ok(end > start, `Missing or misplaced marker: ${endMarker}`);
  return text.slice(start + startMarker.length, end).replace(/\s/g, '');
}

test('launcher exposes one consistent FIX29 identity', () => {
  assert.match(launcher, /LAUNCHER BUILD: R2-HF20-FIX29/);
  const payload64 = extractBase64Between(launcher, psMarker, zipMarker);
  const payload = Buffer.from(payload64, 'base64').toString('utf16le');
  assert.match(payload, /\$launcherBuild\s*=\s*'R2-HF20-FIX29'/);
});

test('launcher performs parser preflight before executing extracted payload', () => {
  const match = launcher.match(/-EncodedCommand\s+([A-Za-z0-9+/=]+)/);
  assert.ok(match, 'Encoded bootstrap command is present');
  const bootstrap = Buffer.from(match[1], 'base64').toString('utf16le');
  assert.ok(bootstrap.includes('[System.Management.Automation.Language.Parser]::ParseFile'));
  assert.ok(bootstrap.includes('[Text.Encoding]::Unicode.GetString($scriptBytes)'));
  assert.ok(bootstrap.includes('[Text.Encoding]::Unicode)'));
  assert.ok(bootstrap.indexOf('ParseFile') < bootstrap.indexOf('& $tmp'));
  assert.match(bootstrap, /PARSE_FAILED/);
  assert.ok(bootstrap.includes('System.Windows.Forms.Clipboard]::SetText'));
  assert.ok(bootstrap.includes('System.Windows.Forms.Clipboard]::GetText'));
});

test('normal feedback hand-off is plain-text-only with exact clipboard read-back', () => {
  const payload = Buffer.from(extractBase64Between(launcher, psMarker, zipMarker), 'base64').toString('utf16le');
  assert.match(payload, /Set-FeedbackTextClipboard/);
  assert.match(payload, /Clipboard\]::SetText\(\$ExpectedText/);
  assert.match(payload, /Clipboard\]::GetText/);
  assert.ok(payload.includes('$actual -cne $ExpectedText'));
  assert.doesNotMatch(payload, /Copy-FeedbackBoardToClipboard|New-EvidenceBoard|Clipboard\]::SetImage/);
  assert.match(payload, /feedback-report\.txt/);
  assert.match(payload, /run\.json/);
  assert.match(payload, /feedbackZip/);
});

test('release file manifest excludes the self-extracting launcher to avoid recursive checksums', () => {
  const manifest = fs.readFileSync(path.join(__dirname, '..', 'docs', 'RELEASE_FILE_MANIFEST.sha256'), 'utf8');
  assert.doesNotMatch(manifest, /^\S+  Andrew_next_task\.bat$/m);
});

test('diagnostic report redaction label is a correctly terminated PowerShell string', () => {
  const payload = Buffer.from(extractBase64Between(launcher, psMarker, zipMarker), 'base64').toString('utf16le');
  assert.match(payload, /\('USER PROFILE: \[REDACTED\]'\),/);
  assert.doesNotMatch(payload, /\('USER PROFILE: \[REDACTED\]\),/);
});

test('launcher writes transcript and event log to separate files', () => {
  const payload = Buffer.from(extractBase64Between(launcher, psMarker, zipMarker), 'base64').toString('utf16le');
  assert.match(payload, /\$transcriptLog\s*=\s*Join-Path \$logDir/);
  assert.match(payload, /Start-Transcript -Path \$transcriptLog -Force/);
  assert.match(payload, /Add-Content -LiteralPath \$log -Value/);
  assert.match(payload, /Copy-Item -LiteralPath \$transcriptLog -Destination \$transcriptCopy/);
  assert.match(payload, /launcher-events\.txt/);
  assert.doesNotMatch(payload, /Start-Transcript -Path \$log -Force/);
});


test('deployment runs project verification against the deployed target and records its exit code', () => {
  const payload = Buffer.from(extractBase64Between(launcher, psMarker, zipMarker), 'base64').toString('utf16le');
  assert.match(payload, /Running npm run verify against the deployed target/);
  assert.match(payload, /\$script:verifyCode\s*=\s*\$LASTEXITCODE/);
  assert.match(payload, /DEPLOYED PROJECT VERIFICATION: PASS/);
  assert.match(payload, /DEPLOYED PROJECT VERIFICATION: FAIL/);
  assert.match(payload, /NOT RUN — /);
  assert.match(payload, /Node\.js or npm\.cmd unavailable after PATH refresh/);
});

test('feedback outcome distinguishes deployment from verified project checks', () => {
  const payload = Buffer.from(extractBase64Between(launcher, psMarker, zipMarker), 'base64').toString('utf16le');
  assert.match(payload, /DEPLOYMENT_AND_PROJECT_VERIFY_PASSED_LIVE_ACCEPTANCE_PENDING/);
  assert.match(payload, /DEPLOYMENT_ONLY_REVIEW_REQUIRED/);
  assert.match(payload, /CANCELLED_NO_CHANGES/);
  assert.match(payload, /PROJECT VERIFY EXIT CODE/);
  assert.match(payload, /BACKUP ROBOCOPY EXIT CODE/);
  assert.match(payload, /DEPLOY ROBOCOPY EXIT CODE/);
});


test('post-deployment verification offers explicit opt-in Node.js LTS installation', () => {
  const payload = Buffer.from(extractBase64Between(launcher, psMarker, zipMarker), 'base64').toString('utf16le');
  assert.match(payload, /Install Node\.js LTS using winget now\?/);
  assert.match(payload, /INSTALL DECLINED — no software installed/);
  assert.match(payload, /BLOCKED — Node\.js\/npm missing and winget unavailable/);
  assert.match(payload, /TOOLCHAIN STATUS:/);
  assert.match(payload, /NODE VERSION:/);
  assert.match(payload, /NPM VERSION:/);
  assert.match(payload, /Refresh-ProcessPath/);
});


test('diagnostic excerpt excludes successful test names and informational npm notices', () => {
  const payload = Buffer.from(extractBase64Between(launcher, psMarker, zipMarker), 'base64').toString('utf16le');
  assert.match(payload, /No actionable error detected/);
  assert.match(payload, /DEPLOYED PROJECT VERIFICATION: FAIL/);
  assert.doesNotMatch(payload, /Where-Object \{ \$_ -match '\(\?i\)\(error\|exception\|failed/);
});

test('successful deployed verification is distinct from outstanding live acceptance', () => {
  const payload = Buffer.from(extractBase64Between(launcher, psMarker, zipMarker), 'base64').toString('utf16le');
  assert.match(payload, /DEPLOYMENT_AND_PROJECT_VERIFY_PASSED_LIVE_ACCEPTANCE_PENDING/);
  assert.match(payload, /LIVE ACCEPTANCE: PENDING/);
});

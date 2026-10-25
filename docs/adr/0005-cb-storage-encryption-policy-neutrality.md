# Contribution Builder: pluggable storage, encrypted drafts, policy neutrality

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

Drafts and operation logs contain clinical data. Where they may be stored,
who may read them and how long they are kept are decisions for the
deploying organisation, not for a library. Browsers can lose unsaved work,
but storing unfinished clinical content on a device has risks; the openEHR
RM Common specification, section 6 (version control), has a sentence
advising against saving unfinished content locally on the client.

## Decision

- ehrtslib is policy-neutral. It does not decide storage location, access
  rights or retention of drafts or logs.
- Storage is a pluggable adapter. The CB exposes the log as bytes,
  computes its `sha256` hash and hands both to the adapter. Linking the log
  from the commit is covered by [ADR 0010](0010-cb-commit-envelope-and-provenance.md).
- Local draft persistence is off by default. When a caller turns it on,
  drafts are encrypted at rest by default: Web Crypto AES-GCM in the
  browser, the equivalent Web Crypto API in Deno and Node.
- The caller provides the key or a key-wrapping function. The default key
  is a non-extractable key kept in IndexedDB. That protects against copying
  the disk or browser profile, not against code running in the same origin.
  Deployments may plug in session-derived or server-derived keys instead.

## Consequences

- Hospitals and vendors can meet local rules without forking the library.
- Default behaviour matches the cautious reading of RM Common section 6;
  turning persistence on is an explicit, documented choice.
- Encryption adds a key-management step for callers who want drafts to
  survive across devices or sessions.

## Alternatives considered

- **Built-in server storage or retention rules.** Rejected: policy belongs
  to the deployment.
- **Unencrypted local persistence on by default.** Rejected: clinical data
  on disk without protection.
- **No local persistence at all.** Rejected: offline and multi-device use
  need it as an option.

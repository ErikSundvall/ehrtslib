# Contribution Builder: stable instance ids in LOCATABLE.uid

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

Operations, validation results, attribution and conflict replay all need to
point at a specific runtime node. Archetype paths do not identify instances:
two occurrences of the same `CLUSTER` share a path, and ADL2 id-codes remove
ADL 1.4 sibling name-predicate disambiguation but not runtime instance
disambiguation. Devices that edit offline must mint ids without talking to
each other.

openEHR `LOCATABLE.uid` is an optional `UID_BASED_ID`. Its root must be a
UUID, ISO OID or internet id; the extension may be any string.

## Decision

- Every `LOCATABLE` node the Contribution Builder creates gets `uid` =
  `<versioned-object-uuid>::<short key>`, for example `…::a3.17`.
- The root is the uuid of the versioned object (for a composition, the
  object id part of its `OBJECT_VERSION_ID`). The root is the same in every
  version, so a node keeps its id across versions.
- The short key is a replica (author/device) prefix plus a counter. Each
  replica gets a prefix when it joins the build; it then mints ids locally.
- Nodes loaded without a uid get one through an explicit `assign-uid`
  operation, so assignment is replayable.
- The Contribution Builder preserves existing inner uids it did not mint.

Verified on the development CDRs: EHRbase 2.36.0 and FerroEHR 5.4.1 both
store and return inner uids unchanged, and AQL can filter on them.

## Implementation (phase 1, #164)

- Short keys are `<replica>.<counter>` (`a.7`, `b2.3`), replica prefixes
  `[a-z][a-z0-9]*`, so a key never contains `::`. The single-caller default
  replica is `a`; a build imported from a log continues that replica's
  counter.
- The draft root (the `COMPOSITION`) gets no short-key uid. Its uid is the
  version's `OBJECT_VERSION_ID`, set at commit.
- For a new build the versioned-object uuid is fixed only at commit, and
  ITS-REST does not promise to keep a client-supplied one. Inner uids use a
  provisional uuid recorded in `create-draft`; operations store only short
  keys, so the commit step (#166) can swap the root without changing the log.

## Consequences

- Operations and results can target nodes reliably, including repeated
  instances and nodes created offline.
- Short keys keep the JSON small compared with a full UUID per node.
- Other clients and CDRs are not required to keep inner uids, so conflict
  handling needs a path-matching fallback ([ADR 0009](0009-cb-conflicts-and-rebase.md)).
- Prefix allocation must be part of the session state; two replicas must
  never get the same prefix.

## Alternatives considered

- **Archetype paths with indexes.** Rejected: indexes shift when siblings
  are added or removed, especially under concurrent edits.
- **A full random UUID per node.** Workable but larger, and gives no link
  to the versioned object.
- **Ids only in builder working state.** Rejected: ids would be lost on
  commit, so a later `update-version` could not match nodes.

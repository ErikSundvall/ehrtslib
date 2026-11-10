/** Automerge stable cursors for remote narrative carets (demo). */
import type { Cursor } from "@automerge/automerge";
import {
  type AutomergeOperationLogAdapter,
  textFieldKey,
} from "../../../addons/cb_automerge/mod.ts";
import type { DemoSession, LongTextField } from "./contribution-demo.ts";

export function narrativeTextKey(
  session: Pick<DemoSession, "draftId" | "fields">,
  field: LongTextField,
): string {
  const binding = session.fields[field];
  return textFieldKey(session.draftId, binding.target, binding.path);
}

export function encodeNarrativeCaret(
  adapter: AutomergeOperationLogAdapter,
  session: Pick<DemoSession, "draftId" | "fields">,
  field: LongTextField,
  utf16Offset: number,
): Cursor | null {
  const key = narrativeTextKey(session, field);
  return adapter.encodeTextCursorAt(key, utf16Offset);
}

export function resolveNarrativeCaret(
  adapter: AutomergeOperationLogAdapter,
  session: Pick<DemoSession, "draftId" | "fields">,
  field: LongTextField,
  cursor: Cursor,
): number | null {
  const key = narrativeTextKey(session, field);
  return adapter.resolveTextCursorAt(key, cursor);
}

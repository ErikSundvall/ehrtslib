/// <reference lib="dom" />
import type { Field } from "./contribution-demo.ts";
import {
  type FieldBadgeView,
  type PresenceBadge,
  presenceStateLabel,
  type PresenceView,
} from "./cb-presence.ts";

const HEADING_SELECTORS: Partial<Record<Field, string>> = {
  diagnosisName: ".field-heading--diagnosisName",
  clinicalDescription: ".field-heading--clinicalDescription",
  comment: ".field-heading--comment",
  temperatureComment: ".field-heading--temperatureComment",
  systolic: ".field-heading--systolic",
  diastolic: ".field-heading--diastolic",
  pulse: ".field-heading--pulse",
  respirationRate: ".field-heading--respirationRate",
  temperature: ".field-heading--temperature",
  spo2: ".field-heading--spo2",
};

export function ensurePresenceHosts(
  panel: HTMLElement,
  fields: readonly Field[],
): Map<Field, HTMLElement> {
  const hosts = new Map<Field, HTMLElement>();
  for (const field of fields) {
    const input = panel.querySelector<HTMLElement>(`[data-field="${field}"]`);
    if (!input) continue;
    const label = input.closest("label");
    if (!label) continue;
    label.classList.add("field-shell");
    const headingSel = HEADING_SELECTORS[field];
    const heading = headingSel
      ? label.querySelector<HTMLElement>(headingSel)
      : label.querySelector<HTMLElement>(".field-heading");
    let host = label.querySelector<HTMLElement>(
      `.presence-badges[data-for="${field}"]`,
    );
    if (!host) {
      host = document.createElement("span");
      host.className = "presence-badges";
      host.dataset.for = field;
    }
    if (heading && host.parentElement !== heading) {
      heading.append(host);
    } else if (!heading) {
      label.prepend(host);
    }
    hosts.set(field, host);
  }
  return hosts;
}

export function paintPresenceBadges(
  hosts: Map<Field, HTMLElement>,
  view: PresenceView,
  atMs: number,
): void {
  for (const [field, host] of hosts) {
    const { badges, overflow } = view.badgesForField(field, atMs);
    host.replaceChildren(
      ...badges.map((b) => badgeEl(b)),
      ...(overflow > 0 ? [overflowEl(overflow)] : []),
    );
  }
}

function badgeEl(badge: PresenceBadge): HTMLElement {
  const btn = document.createElement("button");
  btn.type = "button";
  const extra = badge.heavilyFaded ? " presence-badge--heavily-faded" : "";
  btn.className = `presence-badge presence-badge--${badge.kind}${extra}`;
  btn.style.setProperty("--presence-accent", badge.accent);
  btn.style.opacity = String(badge.opacity);
  btn.textContent = badge.initials;
  btn.setAttribute("aria-label", tooltipText(badge));
  btn.setAttribute(
    "aria-description",
    `${presenceStateLabel(badge.kind)} · ${badge.relative}`,
  );
  const tip = document.createElement("span");
  tip.className = "presence-tooltip";
  tip.setAttribute("role", "tooltip");
  tip.id = `presence-tip-${badge.userId}-${badge.kind}`;
  btn.setAttribute("aria-describedby", tip.id);
  tip.textContent = tooltipText(badge);
  btn.append(tip);
  return btn;
}

function overflowEl(count: number): HTMLElement {
  const span = document.createElement("span");
  span.className = "presence-badge presence-badge--overflow";
  span.textContent = `+${count}`;
  span.title = `${count} more collaborator${count === 1 ? "" : "s"}`;
  return span;
}

function tooltipText(badge: PresenceBadge): string {
  const lines = [
    badge.displayName,
    presenceStateLabel(badge.kind),
    badge.changeSummary ? badge.changeSummary : undefined,
    badge.relative,
    badge.absolute,
  ].filter(Boolean);
  return lines.join(" · ");
}

export function badgeViewSummary(view: FieldBadgeView): string {
  return view.badges.map((b) => `${b.initials}:${b.kind}`).join(",") +
    (view.overflow ? `+${view.overflow}` : "");
}

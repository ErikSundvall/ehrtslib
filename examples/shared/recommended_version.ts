/// <reference lib="dom" />
/**
 * Recommended-release notice for the format-converter demo and TAAAT.
 *
 * GitHub Pages serves bleeding-edge builds at `/demo/` and `/taaat/`, and
 * freezes each release at `/demo-vX.Y/` or `/taaat-vX.Y/`. `versions.json`
 * (see `scripts/pages_site.ts`) names one frozen tag per app as `recommended`.
 * On `*.github.io`, a page that is not that tag shows a dialog linking to it,
 * plus the bleeding-edge build, the tutorial, and the README.
 *
 * Pure helpers are separate from the DOM orchestrator so they can be tested
 * without a browser.
 */

export const VERSIONS_MANIFEST_FILENAME = "versions.json";
export const PAGES_VERSIONS_URL =
  "https://eriksundvall.github.io/ehrtslib/versions.json";
export const RECOMMENDED_POPUP_DISMISS_PREFIX = "ehrtslib-dismiss-recommended-";

export type WebappId = "demo" | "taaat";

export interface AppDeployment {
  app: WebappId;
  /** Frozen tag such as `demo-v0.2`, or null on `/demo/` or `/taaat/`. */
  tag: string | null;
  /** Index of the app directory among non-empty path segments. */
  segmentIndex: number;
}

export interface BuildStamp {
  version: string;
  buildId: string;
  timestamp: string;
}

const APP_DIR_RE = /^(demo|taaat)(?:-v\d+(?:\.\d+){0,2})?$/;

const APP_LABEL: Record<WebappId, string> = {
  demo: "format converter",
  taaat: "TAAAT",
};

export function dismissStorageKey(app: WebappId): string {
  return `${RECOMMENDED_POPUP_DISMISS_PREFIX}${app}`;
}

/** GitHub Pages sites are served from a `*.github.io` host. */
export function isGithubPagesHost(hostname: string): boolean {
  return /\.github\.io$/i.test(hostname);
}

/**
 * Detect `/demo/`, `/taaat/`, or a frozen `demo-v*` / `taaat-v*` directory.
 * `index.html` is ignored so file URLs still match the directory that holds them.
 */
export function detectAppDeployment(pathname: string): AppDeployment | null {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return null;
  let index = segments.length - 1;
  if (segments[index] === "index.html") {
    if (segments.length < 2) return null;
    index -= 1;
  }
  const dir = segments[index];
  const match = APP_DIR_RE.exec(dir);
  if (!match) return null;
  const app = match[1] as WebappId;
  return {
    app,
    tag: dir === app ? null : dir,
    segmentIndex: index,
  };
}

/** `versions.json` lives next to the app directories, one level above them. */
export function resolveVersionsManifestUrl(
  href: string,
  deployment: AppDeployment,
): string {
  const url = new URL(href);
  const segments = url.pathname.split("/").filter(Boolean);
  const parent = segments.slice(0, deployment.segmentIndex);
  url.pathname = `/${[...parent, VERSIONS_MANIFEST_FILENAME].join("/")}`;
  url.search = "";
  url.hash = "";
  return url.href;
}

export function bleedingEdgeUrlFromManifestUrl(
  manifestUrl: string,
  app: WebappId,
): string {
  return new URL(`${app}/`, manifestUrl).href;
}

export function recommendedUrlFromManifestUrl(
  manifestUrl: string,
  recommendedTag: string,
): string {
  return new URL(`${recommendedTag}/`, manifestUrl).href;
}

/**
 * `?version-warning=preview` renders the dialog on any host (local review).
 * Optional `recommended` and `current` query values override the sample tag.
 */
export function versionWarningPreview(
  search: string,
  app: WebappId,
): { recommended: string; currentTag: string | null } | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  if (params.get("version-warning") !== "preview") return null;
  const fallback = app === "demo" ? "demo-v0.1" : "taaat-v0.1";
  const recommended = params.get("recommended")?.trim() || fallback;
  const currentRaw = params.get("current");
  const currentTag = currentRaw === null || currentRaw === ""
    ? null
    : currentRaw;
  return { recommended, currentTag };
}

export function shouldShowRecommendedPopup(input: {
  isGithubPages: boolean;
  app: WebappId | null;
  currentTag: string | null;
  recommended?: string;
  dismissedFor?: string | null;
  forcePreview?: boolean;
}): boolean {
  if (!input.recommended) return false;
  if (input.forcePreview) return true;
  if (!input.isGithubPages || !input.app) return false;
  if (input.currentTag === input.recommended) return false;
  if (input.dismissedFor && input.dismissedFor === input.recommended) {
    return false;
  }
  return true;
}

export function recommendedPopupMessage(
  app: WebappId,
  currentTag: string | null,
  recommendedTag: string,
): string {
  const label = APP_LABEL[app];
  return currentTag
    ? `You are using the ${label} ${currentTag}, which is not the recommended version (${recommendedTag}).`
    : `You are using the bleeding-edge ${label} (updated on every change to main), not the recommended stable version (${recommendedTag}).`;
}

/** Lower-left footer line: package version, deployment, and build stamp. */
export function formatBuildLabel(
  appLabel: string,
  info: BuildStamp,
  deployment: AppDeployment | null,
): string {
  const date = new Date(info.timestamp);
  const when = Number.isNaN(date.getTime())
    ? info.timestamp
    : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  const where = deployment?.tag ??
    (deployment ? "bleeding edge" : `v${info.version}`);
  const versionBit = deployment ? `v${info.version} · ${where}` : where;
  return `${appLabel} ${versionBit} · Build ${info.buildId} (${when})`;
}

export interface RecommendedVersionUi {
  dialog: HTMLDialogElement;
  message: HTMLElement;
  recommendedLink: HTMLAnchorElement;
  bleedingEdgeLink: HTMLAnchorElement;
  tutorialLink: HTMLAnchorElement;
  readmeLink: HTMLAnchorElement;
  dismissButton: HTMLButtonElement;
  dontShowAgainCheckbox?: HTMLInputElement | null;
  footerLink?: HTMLAnchorElement | null;
}

export interface RecommendedVersionOptions {
  app: WebappId;
  tutorialUrl: string;
  readmeUrl: string;
  storage?: Storage;
  location?: Pick<Location, "hostname" | "pathname" | "href" | "search">;
  fetchImpl?: typeof fetch;
}

interface VersionsManifestLike {
  demo?: { recommended?: string };
  taaat?: { recommended?: string };
}

function fillNotice(
  els: RecommendedVersionUi,
  opts: RecommendedVersionOptions,
  notice: {
    currentTag: string | null;
    recommended: string;
    manifestUrl: string;
    preview: boolean;
  },
  storage: Storage | undefined,
): void {
  const recommendedHref = recommendedUrlFromManifestUrl(
    notice.manifestUrl,
    notice.recommended,
  );
  const bleedingHref = bleedingEdgeUrlFromManifestUrl(
    notice.manifestUrl,
    opts.app,
  );
  const onRecommended = notice.currentTag === notice.recommended;

  if (els.footerLink) {
    if (onRecommended) {
      els.footerLink.hidden = true;
    } else {
      els.footerLink.hidden = false;
      els.footerLink.href = recommendedHref;
      els.footerLink.textContent =
        `Switch to recommended ${notice.recommended}`;
    }
  }

  const dismissedFor = storage?.getItem(dismissStorageKey(opts.app)) ?? null;
  if (
    !shouldShowRecommendedPopup({
      isGithubPages: true,
      app: opts.app,
      currentTag: notice.currentTag,
      recommended: notice.recommended,
      dismissedFor,
      forcePreview: notice.preview,
    })
  ) {
    return;
  }

  els.message.textContent = recommendedPopupMessage(
    opts.app,
    notice.currentTag,
    notice.recommended,
  );
  els.recommendedLink.href = recommendedHref;
  els.recommendedLink.textContent = `Open recommended ${notice.recommended}`;
  els.bleedingEdgeLink.href = bleedingHref;
  els.tutorialLink.href = opts.tutorialUrl;
  els.readmeLink.href = opts.readmeUrl;

  const recommendedTag = notice.recommended;
  els.dismissButton.addEventListener("click", () => {
    if (storage && els.dontShowAgainCheckbox?.checked && !notice.preview) {
      storage.setItem(dismissStorageKey(opts.app), recommendedTag);
    }
  }, { once: true });

  if (!els.dialog.open) els.dialog.showModal();
}

/** Fetch `versions.json` and show the dialog when this page is not recommended. */
export async function installRecommendedVersionNotice(
  els: RecommendedVersionUi,
  opts: RecommendedVersionOptions,
): Promise<void> {
  const loc = opts.location ?? globalThis.location;
  if (!loc) return;

  const preview = versionWarningPreview(loc.search ?? "", opts.app);
  const onPages = isGithubPagesHost(loc.hostname);
  if (!preview && !onPages) return;

  const deployment = detectAppDeployment(loc.pathname);
  if (!preview && (!deployment || deployment.app !== opts.app)) return;

  const storage = opts.storage ??
    (typeof localStorage === "undefined" ? undefined : localStorage);

  if (preview) {
    fillNotice(els, opts, {
      currentTag: preview.currentTag,
      recommended: preview.recommended,
      manifestUrl: PAGES_VERSIONS_URL,
      preview: true,
    }, storage);
    return;
  }

  const manifestUrl = resolveVersionsManifestUrl(loc.href, deployment!);
  let manifest: VersionsManifestLike;
  try {
    const res = await (opts.fetchImpl ?? fetch)(manifestUrl, {
      cache: "no-store",
    });
    if (!res.ok) return;
    manifest = await res.json();
  } catch {
    return;
  }

  const recommended = manifest[opts.app]?.recommended;
  if (!recommended) return;

  fillNotice(els, opts, {
    currentTag: deployment!.tag,
    recommended,
    manifestUrl,
    preview: false,
  }, storage);
}

function required<T extends HTMLElement>(
  doc: Document,
  id: string,
  ctor: new () => T,
): T | undefined {
  const el = doc.getElementById(id);
  return el instanceof ctor ? el : undefined;
}

/** Wire the dialog and footer link that both webapps include in their HTML. */
export function bindRecommendedVersionNotice(
  doc: Document,
  opts: RecommendedVersionOptions,
): Promise<void> {
  const dialog = required(doc, "dialog-recommended-version", HTMLDialogElement);
  const message = required(doc, "recommended-version-message", HTMLElement);
  const recommendedLink = required(
    doc,
    "recommended-version-link",
    HTMLAnchorElement,
  );
  const bleedingEdgeLink = required(
    doc,
    "recommended-version-bleeding-edge-link",
    HTMLAnchorElement,
  );
  const tutorialLink = required(
    doc,
    "recommended-version-tutorial-link",
    HTMLAnchorElement,
  );
  const readmeLink = required(
    doc,
    "recommended-version-readme-link",
    HTMLAnchorElement,
  );
  const dismissButton = required(
    doc,
    "recommended-version-dismiss",
    HTMLButtonElement,
  );
  if (
    !dialog || !message || !recommendedLink || !bleedingEdgeLink ||
    !tutorialLink || !readmeLink || !dismissButton
  ) {
    return Promise.resolve();
  }
  const dontShow = doc.getElementById("recommended-version-dont-show-again");
  const footer = doc.getElementById("recommended-version-footer-link");
  return installRecommendedVersionNotice({
    dialog,
    message,
    recommendedLink,
    bleedingEdgeLink,
    tutorialLink,
    readmeLink,
    dismissButton,
    dontShowAgainCheckbox: dontShow instanceof HTMLInputElement
      ? dontShow
      : null,
    footerLink: footer instanceof HTMLAnchorElement ? footer : null,
  }, opts);
}

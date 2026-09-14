export interface VariantDef {
  key: string;
  name: string;
}

export function currentVariantKey(keys: string[], fallback: string): string {
  const params = new URLSearchParams(location.search);
  const raw = params.get("variant")?.toUpperCase();
  return raw && keys.includes(raw) ? raw : fallback;
}

export function setVariantInUrl(key: string): void {
  const url = new URL(location.href);
  url.searchParams.set("variant", key);
  history.replaceState({}, "", url);
}

/**
 * Floating prototype switcher. Not part of the designs under review.
 */
export function mountPrototypeSwitcher(
  host: HTMLElement,
  variants: VariantDef[],
  current: string,
  onChange: (key: string) => void,
): void {
  host.innerHTML = "";
  host.className = "proto-switcher";
  host.setAttribute("aria-label", "Prototype variant switcher");

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "proto-switcher-btn";
  prev.textContent = "←";
  prev.title = "Previous variant";

  const label = document.createElement("span");
  label.className = "proto-switcher-label";

  const next = document.createElement("button");
  next.type = "button";
  next.className = "proto-switcher-btn";
  next.textContent = "→";
  next.title = "Next variant";

  const paint = (key: string) => {
    const def = variants.find((v) => v.key === key) ?? variants[0];
    label.textContent = `${def.key} — ${def.name}`;
  };
  paint(current);

  const cycle = (delta: number) => {
    const i = variants.findIndex((v) => v.key === currentVariantKey(
      variants.map((v) => v.key),
      variants[0].key,
    ));
    const nextKey = variants[(i + delta + variants.length) % variants.length].key;
    setVariantInUrl(nextKey);
    onChange(nextKey);
  };

  prev.addEventListener("click", () => cycle(-1));
  next.addEventListener("click", () => cycle(1));

  host.append(prev, label, next);

  document.addEventListener("keydown", (event) => {
    const t = event.target as HTMLElement | null;
    if (
      t &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" ||
        t.isContentEditable)
    ) {
      return;
    }
    if (event.key === "ArrowLeft") cycle(-1);
    if (event.key === "ArrowRight") cycle(1);
  });
}

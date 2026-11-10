export const USERNAMES = [
  "nurse.andersson",
  "dr.berg",
  "midwife.chen",
  "gp.dalton",
  "physio.ek",
  "student.falk",
  "consultant.green",
  "paramedic.holm",
  "dietitian.ivarsson",
  "oncology.johansson",
  "cardio.khan",
  "ward.clerk.lind",
  "anesthetist.mori",
  "radiologist.nguyen",
  "psych.olsson",
] as const;

const USERNAME_SET = new Set<string>(USERNAMES);

/** Split a demo roster name into roster base and generation (1 = no suffix). */
export function parseDemoUsername(
  username: string,
): { base: string; generation: number } | undefined {
  if (USERNAME_SET.has(username)) {
    return { base: username, generation: 1 };
  }
  const match = /^(.+) (\d+)$/.exec(username);
  if (!match) return undefined;
  const base = match[1]!;
  const generation = Number(match[2]);
  if (!USERNAME_SET.has(base) || !Number.isInteger(generation) || generation < 2) {
    return undefined;
  }
  return { base, generation };
}

/**
 * Pick the next automatic demo username. Uses every roster entry once (in list
 * order) before any `base N` suffix; freed names can be taken again.
 */
export function allocateDemoUsername(inUse: ReadonlySet<string>): string {
  for (const base of USERNAMES) {
    if (!inUse.has(base)) return base;
  }
  for (let generation = 2;; generation++) {
    for (const base of USERNAMES) {
      const candidate = `${base} ${generation}`;
      if (!inUse.has(candidate)) return candidate;
    }
  }
}

/** Names currently held by active clones (any label the user may have typed). */
export function occupiedUsernames(names: Iterable<string>): Set<string> {
  return new Set(names);
}

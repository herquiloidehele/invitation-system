import type { ChildProcess } from "node:child_process";

/**
 * In-process registry of running build workers, keyed by invitation slug.
 *
 * The build route spawns a detached worker child; this lets a separate request
 * (the cancel/status endpoints) find it. Module state is shared across route
 * handlers in the same Node process — correct for the current single-instance
 * deployment. A multi-instance deployment would need a shared store (the same
 * assumption the rest of the worker pipeline already makes).
 */
type Entry = { child: ChildProcess; startedAt: number; cancelled: boolean };

const registry = new Map<string, Entry>();

export function registerBuild(slug: string, child: ChildProcess): void {
  registry.set(slug, { child, startedAt: Date.now(), cancelled: false });
}

/**
 * Clear a build. Pass the `child` so a stale `close` from a superseded build
 * does not clear a newer one that already re-registered under the same slug.
 */
export function unregisterBuild(slug: string, child?: ChildProcess): void {
  const entry = registry.get(slug);
  if (entry && (!child || entry.child === child)) registry.delete(slug);
}

export function getBuildStatus(slug: string): {
  running: boolean;
  startedAt: number | null;
} {
  const entry = registry.get(slug);
  return entry
    ? { running: true, startedAt: entry.startedAt }
    : { running: false, startedAt: null };
}

/**
 * Whether the running build was explicitly cancelled. Deterministic — a
 * SIGTERM can surface as either signal="SIGTERM" or exit code 143 depending on
 * the child, so the route must not infer cancellation from the exit code.
 */
export function wasCancelled(slug: string): boolean {
  return registry.get(slug)?.cancelled ?? false;
}

/** Kill the running build's whole process group (worker + the Agent SDK CLI). */
export function cancelBuild(slug: string): boolean {
  const entry = registry.get(slug);
  if (!entry) return false;
  entry.cancelled = true;
  const { child } = entry;
  try {
    // The child is spawned `detached`, so it leads its own group; the negative
    // pid signals the group, reaching the SDK subprocess that spends the money.
    if (child.pid) process.kill(-child.pid, "SIGTERM");
    else child.kill("SIGTERM");
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      // already exited
    }
  }
  return true;
}

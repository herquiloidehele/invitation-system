/** A generated invitation component. Props are supplied by the host. */
export type BundleComponent = (props: never) => unknown;

export interface BundleRegistry {
  register(id: string, component: BundleComponent): void;
  get(id: string): BundleComponent | undefined;
  whenRegistered(id: string): Promise<BundleComponent>;
}

/**
 * Registry that generated bundles register themselves into. A bundle is loaded
 * via a `<script>` tag, so registration can land before or after the loader
 * starts waiting — both orders must resolve.
 *
 * First registration for an id wins: re-injecting the same script (React strict
 * mode double-effects, a remount) must not swap the component identity out from
 * under a mounted tree.
 */
export function createBundleRegistry(): BundleRegistry {
  const components = new Map<string, BundleComponent>();
  const waiters = new Map<string, ((c: BundleComponent) => void)[]>();

  return {
    register(id, component) {
      if (components.has(id)) return;
      components.set(id, component);
      const pending = waiters.get(id);
      if (pending) {
        waiters.delete(id);
        pending.forEach((resolve) => resolve(component));
      }
    },

    get(id) {
      return components.get(id);
    },

    whenRegistered(id) {
      const existing = components.get(id);
      if (existing) return Promise.resolve(existing);
      return new Promise<BundleComponent>((resolve) => {
        const pending = waiters.get(id) ?? [];
        pending.push(resolve);
        waiters.set(id, pending);
      });
    },
  };
}

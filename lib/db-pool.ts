const DEFAULT_DATABASE_POOL_MAX = 3;

export function readDatabasePoolMax(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_DATABASE_POOL_MAX;
  }
  return parsed;
}

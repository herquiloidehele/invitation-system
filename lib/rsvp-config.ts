export interface RsvpConfigWithEmail {
  enabled?: boolean;
  deadline?: string;
  showEmail?: boolean;
}

export function shouldShowRsvpEmail(
  config: RsvpConfigWithEmail | null | undefined,
): boolean {
  return config?.showEmail === true;
}

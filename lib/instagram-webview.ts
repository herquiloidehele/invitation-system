export type MobilePlatform = "ios" | "android" | "other";

export function isInstagramWebView(userAgent: string): boolean {
  return /Instagram/i.test(userAgent);
}

export function getMobilePlatform(userAgent: string): MobilePlatform {
  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return "ios";
  }

  if (/Android/i.test(userAgent)) {
    return "android";
  }

  return "other";
}

export function buildAndroidBrowserIntent(url: string): string {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("Only HTTP(S) URLs can be opened");
  }

  const scheme = parsedUrl.protocol.slice(0, -1);
  const intentTarget = `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;

  return [
    `intent://${intentTarget}#Intent`,
    `scheme=${scheme}`,
    "action=android.intent.action.VIEW",
    "category=android.intent.category.BROWSABLE",
    `S.browser_fallback_url=${encodeURIComponent(parsedUrl.href)}`,
    "end",
  ].join(";");
}

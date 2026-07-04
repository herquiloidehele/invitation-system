import { describe, expect, it } from "vitest";

import {
  buildAndroidBrowserIntent,
  buildInstagramIOSBrowserUrl,
  getMobilePlatform,
  isInstagramWebView,
} from "@/lib/instagram-webview";

const IOS_INSTAGRAM_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 382.0.0.0.77";
const ANDROID_INSTAGRAM_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36 Instagram 382.0.0.49.84 Android";

describe("isInstagramWebView", () => {
  it("detects Instagram on iOS", () => {
    expect(isInstagramWebView(IOS_INSTAGRAM_USER_AGENT)).toBe(true);
  });

  it("detects Instagram on Android case-insensitively", () => {
    expect(isInstagramWebView(ANDROID_INSTAGRAM_USER_AGENT.toLowerCase())).toBe(
      true,
    );
  });

  it("does not classify ordinary mobile Safari as Instagram", () => {
    expect(
      isInstagramWebView(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
  });
});

describe("getMobilePlatform", () => {
  it("classifies Instagram on iOS", () => {
    expect(getMobilePlatform(IOS_INSTAGRAM_USER_AGENT)).toBe("ios");
  });

  it("classifies Instagram on Android", () => {
    expect(getMobilePlatform(ANDROID_INSTAGRAM_USER_AGENT)).toBe("android");
  });

  it("classifies desktop browsers as other", () => {
    expect(
      getMobilePlatform(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15",
      ),
    ).toBe("other");
  });
});

describe("buildAndroidBrowserIntent", () => {
  it("builds a browsable HTTPS intent with a full fallback URL", () => {
    const url =
      "https://convites.brindealstudio.com/pt?utm_source=instagram#precos";

    expect(buildAndroidBrowserIntent(url)).toBe(
      "intent://convites.brindealstudio.com/pt?utm_source=instagram#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=https%3A%2F%2Fconvites.brindealstudio.com%2Fpt%3Futm_source%3Dinstagram%23precos;end",
    );
  });

  it("supports HTTP development URLs", () => {
    expect(buildAndroidBrowserIntent("http://localhost:3000/pt")).toContain(
      "#Intent;scheme=http;",
    );
  });

  it("rejects URLs that cannot be opened safely in a browser", () => {
    expect(() => buildAndroidBrowserIntent("javascript:alert(1)")).toThrow(
      "Only HTTP(S) URLs can be opened",
    );
  });
});

describe("buildInstagramIOSBrowserUrl", () => {
  it("builds Instagram's external-browser handoff with the complete URL", () => {
    const url =
      "https://convites.brindealstudio.com/pt?utm_source=instagram#precos";

    expect(buildInstagramIOSBrowserUrl(url)).toBe(
      "instagram://extbrowser/?url=https%3A%2F%2Fconvites.brindealstudio.com%2Fpt%3Futm_source%3Dinstagram%23precos",
    );
  });

  it("rejects non-HTTP URLs", () => {
    expect(() => buildInstagramIOSBrowserUrl("javascript:alert(1)")).toThrow(
      "Only HTTP(S) URLs can be opened",
    );
  });
});

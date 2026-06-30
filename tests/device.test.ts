import { describe, expect, it } from "vitest";
import {
  isInAppBrowser,
  isMobileUserAgent,
  prefersLightweightEmbeds,
} from "@/lib/device";

const INSTAGRAM_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 250.0.0.0 (iPhone12,1; iOS 15_0; en_US)";
const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 11; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0 Mobile Safari/537.36 [FBAN/FB4A;FBAV/350.0.0.0;]";
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

describe("device user-agent classification", () => {
  it("flags Instagram in-app browser as in-app + mobile + lightweight", () => {
    expect(isInAppBrowser(INSTAGRAM_IOS)).toBe(true);
    expect(isMobileUserAgent(INSTAGRAM_IOS)).toBe(true);
    expect(prefersLightweightEmbeds(INSTAGRAM_IOS)).toBe(true);
  });

  it("flags Facebook in-app browser", () => {
    expect(isInAppBrowser(FACEBOOK_ANDROID)).toBe(true);
    expect(prefersLightweightEmbeds(FACEBOOK_ANDROID)).toBe(true);
  });

  it("treats a plain phone browser as mobile (lightweight) but not in-app", () => {
    expect(isInAppBrowser(IPHONE_SAFARI)).toBe(false);
    expect(isMobileUserAgent(IPHONE_SAFARI)).toBe(true);
    expect(prefersLightweightEmbeds(IPHONE_SAFARI)).toBe(true);
    expect(prefersLightweightEmbeds(ANDROID_CHROME)).toBe(true);
  });

  it("keeps live embeds on desktop browsers", () => {
    expect(isMobileUserAgent(DESKTOP_CHROME)).toBe(false);
    expect(isInAppBrowser(DESKTOP_CHROME)).toBe(false);
    expect(prefersLightweightEmbeds(DESKTOP_CHROME)).toBe(false);
  });

  it("is safe for missing user-agent", () => {
    expect(prefersLightweightEmbeds(null)).toBe(false);
    expect(prefersLightweightEmbeds(undefined)).toBe(false);
    expect(prefersLightweightEmbeds("")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  giftsPagePath,
  hasBankTransfer,
  hasGiftItems,
  isExclusiveGiftSelectionEnabled,
  shouldRenderGiftRegistryOnExternal,
  shouldShowBankTransferOption,
  shouldShowGiftListOption,
} from "@/lib/gift-registry";
import type { GiftItem } from "@/lib/types";

const item = (over: Partial<GiftItem> = {}): GiftItem => ({
  id: "gift-1",
  name: "Jogo de panelas",
  ...over,
});

describe("hasGiftItems", () => {
  it("is false when the registry is null/undefined", () => {
    expect(hasGiftItems(null)).toBe(false);
    expect(hasGiftItems(undefined)).toBe(false);
  });

  it("is false when items is missing or empty", () => {
    expect(hasGiftItems({})).toBe(false);
    expect(hasGiftItems({ items: [] })).toBe(false);
  });

  it("is true when at least one item exists", () => {
    expect(hasGiftItems({ items: [item()] })).toBe(true);
  });
});

describe("hasBankTransfer", () => {
  it("is false when the registry is null/undefined", () => {
    expect(hasBankTransfer(null)).toBe(false);
    expect(hasBankTransfer(undefined)).toBe(false);
  });

  it("is false when bankTransfer is missing or empty", () => {
    expect(hasBankTransfer({})).toBe(false);
    expect(hasBankTransfer({ bankTransfer: [] })).toBe(false);
  });

  it("is false when every row is blank/whitespace-only", () => {
    expect(
      hasBankTransfer({
        bankTransfer: [{ id: "bank-1", label: "  ", value: "" }],
      }),
    ).toBe(false);
  });

  it("is true when a row has a non-empty label or value", () => {
    expect(
      hasBankTransfer({
        bankTransfer: [{ id: "bank-1", label: "IBAN", value: "" }],
      }),
    ).toBe(true);
    expect(
      hasBankTransfer({
        bankTransfer: [{ id: "bank-2", label: "", value: "GB82 WEST" }],
      }),
    ).toBe(true);
  });
});

describe("giftsPagePath", () => {
  it("builds the path without a guest token", () => {
    expect(giftsPagePath("joao-maria")).toBe("/joao-maria/gifts");
  });

  it("appends and URL-encodes the guest token", () => {
    expect(giftsPagePath("joao-maria", "abc 123")).toBe(
      "/joao-maria/gifts?g=abc%20123",
    );
  });

  it("ignores a null/empty token", () => {
    expect(giftsPagePath("joao-maria", null)).toBe("/joao-maria/gifts");
    expect(giftsPagePath("joao-maria", "")).toBe("/joao-maria/gifts");
  });
});

describe("isExclusiveGiftSelectionEnabled", () => {
  it("defaults missing configuration to false", () => {
    expect(isExclusiveGiftSelectionEnabled(null)).toBe(false);
    expect(isExclusiveGiftSelectionEnabled({})).toBe(false);
  });

  it("is true only for an explicit true value", () => {
    expect(
      isExclusiveGiftSelectionEnabled({ exclusiveSelectionEnabled: false }),
    ).toBe(false);
    expect(
      isExclusiveGiftSelectionEnabled({ exclusiveSelectionEnabled: true }),
    ).toBe(true);
  });
});

describe("shouldRenderGiftRegistryOnExternal", () => {
  it("is false when the registry is null/undefined or disabled", () => {
    expect(shouldRenderGiftRegistryOnExternal(null)).toBe(false);
    expect(shouldRenderGiftRegistryOnExternal(undefined)).toBe(false);
    expect(shouldRenderGiftRegistryOnExternal({ enabled: false })).toBe(false);
  });

  it("is true when enabled and not hidden from the invitation", () => {
    expect(shouldRenderGiftRegistryOnExternal({ enabled: true })).toBe(true);
    expect(
      shouldRenderGiftRegistryOnExternal({
        enabled: true,
        hideFromInvitation: false,
      }),
    ).toBe(true);
  });

  it("is false when enabled but hidden from the invitation", () => {
    expect(
      shouldRenderGiftRegistryOnExternal({
        enabled: true,
        hideFromInvitation: true,
      }),
    ).toBe(false);
  });
});

describe("shouldShowGiftListOption", () => {
  it("is false when the registry is null/undefined", () => {
    expect(shouldShowGiftListOption(null)).toBe(false);
    expect(shouldShowGiftListOption(undefined)).toBe(false);
  });

  it("is false when there are no items and no link", () => {
    expect(shouldShowGiftListOption({})).toBe(false);
    expect(shouldShowGiftListOption({ items: [], link: "" })).toBe(false);
  });

  it("is true when there are items or a link and it is not hidden", () => {
    expect(shouldShowGiftListOption({ items: [item()] })).toBe(true);
    expect(
      shouldShowGiftListOption({ link: "https://example.com/lista" }),
    ).toBe(true);
    expect(
      shouldShowGiftListOption({ items: [item()], hideGiftList: false }),
    ).toBe(true);
  });

  it("is false when hidden even though it has content", () => {
    expect(
      shouldShowGiftListOption({
        items: [item()],
        link: "https://example.com/lista",
        hideGiftList: true,
      }),
    ).toBe(false);
  });
});

describe("shouldShowBankTransferOption", () => {
  const bankTransfer = [{ id: "bank-1", label: "IBAN", value: "PT50 0000" }];

  it("is false when the registry is null/undefined", () => {
    expect(shouldShowBankTransferOption(null)).toBe(false);
    expect(shouldShowBankTransferOption(undefined)).toBe(false);
  });

  it("is false when there are no filled bank rows", () => {
    expect(shouldShowBankTransferOption({})).toBe(false);
    expect(
      shouldShowBankTransferOption({
        bankTransfer: [{ id: "bank-1", label: " ", value: "" }],
      }),
    ).toBe(false);
  });

  it("is true when a bank row is filled and it is not hidden", () => {
    expect(shouldShowBankTransferOption({ bankTransfer })).toBe(true);
    expect(
      shouldShowBankTransferOption({ bankTransfer, hideBankTransfer: false }),
    ).toBe(true);
  });

  it("is false when hidden even though it has content", () => {
    expect(
      shouldShowBankTransferOption({ bankTransfer, hideBankTransfer: true }),
    ).toBe(false);
  });
});

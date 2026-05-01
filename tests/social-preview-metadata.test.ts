import { describe, expect, it } from "vitest";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveInvitationSocialPreview,
  resolveSaveTheDateSocialPreview,
} from "../lib/social-preview";
import type { InvitationData } from "../lib/types";
import type { SaveTheDateData } from "../lib/save-the-date";

const SITE_ORIGIN = "https://example.com";

function buildOpenGraphFromInvitation(invitation: InvitationData, slug: string) {
  const r = resolveInvitationSocialPreview(invitation, SITE_ORIGIN);
  return {
    title: r.title,
    description: r.description,
    openGraph: {
      title: r.title,
      description: r.description,
      images: [{ url: r.image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website" as const,
      url: `${SITE_ORIGIN}/${slug}`,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: r.title,
      description: r.description,
      images: [r.image],
    },
  };
}

function buildOpenGraphFromSaveTheDate(std: SaveTheDateData, slug: string) {
  const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
  return {
    title: r.title,
    description: r.description,
    openGraph: {
      title: r.title,
      description: r.description,
      images: [{ url: r.image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website" as const,
      url: `${SITE_ORIGIN}/s/${slug}`,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: r.title,
      description: r.description,
      images: [r.image],
    },
  };
}

const invitationFixture: InvitationData = {
  slug: "ana-bruno",
  themeId: "theme_pink",
  template: "pink-floral",
  couple: { bride: "Ana", groom: "Bruno", monogram: "A&B" },
  date: {
    iso: "2027-09-14T16:00:00Z",
    display: "14 de Setembro de 2027",
    dayOfWeek: "Sábado",
    time: "16:00",
    day: "14",
    month: "09",
    year: "2027",
  },
  quote: "Para sempre.",
  location: { name: "Q", address: "A", googleMapsUrl: "u" },
  rsvp: { enabled: true } as InvitationData["rsvp"],
  schedule: [],
  dressCode: { enabled: false, text: "" },
  giftRegistry: { enabled: false, text: "" },
  audio: { enabled: false, src: "", artist: "", title: "" },
  heroImage: "https://cdn.example.com/hero.jpg",
  eventType: "wedding",
  invitationType: "standard",
} as InvitationData;

const stdFixture: SaveTheDateData = {
  id: "1",
  slug: "ana-bruno",
  couple: { bride: "Ana", groom: "Bruno" },
  date: {
    iso: "2027-09-14",
    display: "14 de Setembro de 2027",
    day: "14",
    month: "09",
    year: "2027",
  },
  customMessage: null,
  theme: {
    id: "t",
    name: "n",
    label: "L",
    description: "",
    heartColor: "#000",
    heartGlitterColors: [],
    rsvpButtonBgColor: "#000",
    bgColor: "#fff",
    titleFont: "s",
    coupleFont: "s",
    dateFont: "s",
    textColor: "#000",
    confettiColors: [],
    envelope: null,
  },
  envelope: null,
  textStyles: null,
  rsvp: null,
  audio: { enabled: false, src: "", artist: "", title: "" },
  bottomHero: null,
  socialPreview: null,
};

describe("invitation generateMetadata shape", () => {
  it("emits openGraph.images and twitter card with resolver output", () => {
    const meta = buildOpenGraphFromInvitation(invitationFixture, "ana-bruno");
    expect(meta.openGraph.images).toEqual([
      { url: "https://cdn.example.com/hero.jpg", width: 1200, height: 630 },
    ]);
    expect(meta.openGraph.url).toBe("https://example.com/ana-bruno");
    expect(meta.twitter.card).toBe("summary_large_image");
    expect(meta.twitter.images).toEqual(["https://cdn.example.com/hero.jpg"]);
    expect(meta.title).toBe("Ana & Bruno");
    expect(meta.description).toBe("Convite de Casamento");
  });
});

describe("save the date generateMetadata shape", () => {
  it("emits openGraph.images using default and twitter card", () => {
    const meta = buildOpenGraphFromSaveTheDate(stdFixture, "ana-bruno");
    expect(meta.openGraph.images).toEqual([
      { url: "https://example.com/og-default.jpg", width: 1200, height: 630 },
    ]);
    expect(meta.openGraph.url).toBe("https://example.com/s/ana-bruno");
    expect(meta.twitter.card).toBe("summary_large_image");
    expect(meta.title).toBe("Ana & Bruno — Save the Date");
    expect(meta.description).toBe(
      "Ana & Bruno invite you to save the date: 14 de Setembro de 2027",
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_OG_IMAGE_PATH,
  resolveInvitationSocialPreview,
  resolveSaveTheDateSocialPreview,
} from "../lib/social-preview";
import type { InvitationData } from "../lib/types";
import type { SaveTheDateData } from "../lib/save-the-date";

const SITE_ORIGIN = "https://example.com";
const DEFAULT_IMAGE_ABS = `${SITE_ORIGIN}${DEFAULT_OG_IMAGE_PATH}`;

// --- Fixtures -------------------------------------------------------------

function baseInvitation(overrides: Partial<InvitationData> = {}): InvitationData {
  return {
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
    location: {
      name: "Quinta",
      address: "Rua A",
      googleMapsUrl: "https://maps.example",
    },
    rsvp: { enabled: true } as InvitationData["rsvp"],
    schedule: [],
    dressCode: { enabled: false, text: "" },
    giftRegistry: { enabled: false, text: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "https://cdn.example.com/hero.jpg",
    eventType: "wedding",
    invitationType: "standard",
    ...overrides,
  } as InvitationData;
}

function baseSaveTheDate(overrides: Partial<SaveTheDateData> = {}): SaveTheDateData {
  return {
    id: "std_1",
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
      id: "stdtheme_1",
      name: "golden-heart",
      label: "Golden Heart",
      description: "",
      heartColor: "#D4AF37",
      heartGlitterColors: ["#F5E6A3"],
      rsvpButtonBgColor: "#D4AF37",
      bgColor: "#fff",
      titleFont: "serif",
      coupleFont: "serif",
      dateFont: "serif",
      textColor: "#000",
      confettiColors: ["#D4AF37"],
      envelope: null,
    },
    envelope: null,
    textStyles: null,
    rsvp: null,
    audio: { enabled: false, src: "", artist: "", title: "" },
    bottomHero: null,
    socialPreview: null,
    ...overrides,
  };
}

// --- Invitation resolver -------------------------------------------------

describe("resolveInvitationSocialPreview", () => {
  it("returns explicit values when all are set", () => {
    const inv = baseInvitation({
      socialPreview: {
        image: "https://cdn.example.com/custom-og.jpg",
        title: "Custom Title",
        description: "Custom Description",
      },
    });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r).toEqual({
      image: "https://cdn.example.com/custom-og.jpg",
      title: "Custom Title",
      description: "Custom Description",
      imageSource: "custom",
    });
  });

  it("standard with no socialPreview falls back to heroImage", () => {
    const inv = baseInvitation();
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.image).toBe("https://cdn.example.com/hero.jpg");
    expect(r.imageSource).toBe("hero");
    expect(r.title).toBe("Ana & Bruno");
    expect(r.description).toBe("Convite de Casamento");
  });

  it("external_video with no socialPreview falls back to heroImage", () => {
    const inv = baseInvitation({ invitationType: "external_video" });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.image).toBe("https://cdn.example.com/hero.jpg");
    expect(r.imageSource).toBe("hero");
  });

  it("external_link with no socialPreview falls back to global default", () => {
    const inv = baseInvitation({ invitationType: "external_link" });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.image).toBe(DEFAULT_IMAGE_ABS);
    expect(r.imageSource).toBe("default");
  });

  it("non-wedding eventType uses primary name only as title fallback", () => {
    const inv = baseInvitation({
      eventType: "baptism",
      couple: { bride: "Maria", groom: "", monogram: "M" },
    });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.title).toBe("Maria");
    expect(r.description).toBe("Convite de Batizado");
  });

  it("custom title overrides fallback", () => {
    const inv = baseInvitation({ socialPreview: { title: "Pick" } });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.title).toBe("Pick");
  });

  it("custom description overrides fallback", () => {
    const inv = baseInvitation({ socialPreview: { description: "Vem celebrar" } });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.description).toBe("Vem celebrar");
  });

  it("custom image is used regardless of invitationType", () => {
    const inv = baseInvitation({
      invitationType: "external_link",
      socialPreview: { image: "https://cdn.example.com/c.jpg" },
    });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.image).toBe("https://cdn.example.com/c.jpg");
    expect(r.imageSource).toBe("custom");
  });
});

// --- Save the Date resolver ---------------------------------------------

describe("resolveSaveTheDateSocialPreview", () => {
  it("returns explicit values when all are set", () => {
    const std = baseSaveTheDate({
      socialPreview: {
        image: "https://cdn.example.com/custom.jpg",
        title: "Custom",
        description: "Desc",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r).toEqual({
      image: "https://cdn.example.com/custom.jpg",
      title: "Custom",
      description: "Desc",
      imageSource: "custom",
    });
  });

  it("falls back to bottomHero image when enabled and image-typed", () => {
    const std = baseSaveTheDate({
      bottomHero: {
        enabled: true,
        mediaUrl: "https://cdn.example.com/bh.jpg",
        mediaType: "image",
        title: "",
        description: "",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.image).toBe("https://cdn.example.com/bh.jpg");
    expect(r.imageSource).toBe("bottomHero");
  });

  it("does NOT use bottomHero when disabled", () => {
    const std = baseSaveTheDate({
      bottomHero: {
        enabled: false,
        mediaUrl: "https://cdn.example.com/bh.jpg",
        mediaType: "image",
        title: "",
        description: "",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.image).toBe(DEFAULT_IMAGE_ABS);
    expect(r.imageSource).toBe("default");
  });

  it("does NOT use bottomHero when mediaType is video", () => {
    const std = baseSaveTheDate({
      bottomHero: {
        enabled: true,
        mediaUrl: "https://cdn.example.com/v.mp4",
        mediaType: "video",
        title: "",
        description: "",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.image).toBe(DEFAULT_IMAGE_ABS);
    expect(r.imageSource).toBe("default");
  });

  it("does NOT use bottomHero when mediaUrl is empty", () => {
    const std = baseSaveTheDate({
      bottomHero: {
        enabled: true,
        mediaUrl: "",
        mediaType: "image",
        title: "",
        description: "",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.image).toBe(DEFAULT_IMAGE_ABS);
    expect(r.imageSource).toBe("default");
  });

  it("title fallback is the existing combined string", () => {
    const std = baseSaveTheDate();
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.title).toBe("Ana & Bruno — Save the Date");
  });

  it("description fallback matches existing page-level description", () => {
    const std = baseSaveTheDate();
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.description).toBe(
      "Ana & Bruno invite you to save the date: 14 de Setembro de 2027",
    );
  });
});

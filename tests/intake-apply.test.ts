import { describe, expect, it } from "vitest";

import { Prisma } from "@/lib/generated/prisma/client";
import {
  buildInvitationFromIntake,
  buildSaveTheDateFromIntake,
  intakeSlugBase,
  nextFreeSlug,
} from "@/lib/intake/apply";
import type { IntakeAnswers } from "@/lib/intake/catalog";
import { buildInvitationDateInfo } from "@/lib/invitation-default-date";
import {
  buildDuplicateInvitationInitialData,
  customerInvitationResetData,
} from "@/lib/invitation-duplication";
import { sourceInvitationRow } from "./fixtures/invitation-duplication";

const demo = buildDuplicateInvitationInitialData(sourceInvitationRow);

const fullAnswers: IntakeAnswers = {
  event: {
    type: "wedding",
    primaryName: " Maria ",
    secondaryName: "Pedro",
    date: "2027-05-20",
    time: "16:00",
    quote: "O amor tudo suporta",
  },
  parents: {
    enabled: true,
    bridesFather: "Carlos",
    bridesMother: "Rosa",
    groomsFather: "",
    groomsMother: "Lúcia",
  },
  locations: [
    {
      kind: "religious",
      name: "Sé Catedral",
      address: "Baixa, Maputo",
      mapsUrl: "https://maps.test/se",
    },
    { kind: "reception", name: "Quinta do Sol", address: "Matola" },
    { kind: "other", name: "Terceiro local" },
  ],
  schedule: [
    { time: "16:00", label: "Cerimónia", venue: "Sé Catedral" },
    { time: "19:00", label: "Jantar" },
  ],
  dressCode: { enabled: true, text: "Gala", colors: ["#000000"] },
  gifts: { enabled: true, text: "IBAN MZ00 1234" },
  music: { enabled: true, text: "Perfect — Ed Sheeran" },
  guestGuide: {
    enabled: true,
    presetIds: ["be-punctual", "no-children"],
    customLabels: ["Tragam guarda-chuva"],
  },
  rsvp: { deadline: "2027-05-01", askDietary: false },
  faqs: [{ question: "Como chegar?", answer: "De carro" }],
  colors: { text: "Verde" },
  notes: { text: "Obrigado" },
};

describe("buildInvitationDateInfo", () => {
  it("builds the pre-formatted pt date shape at UTC midnight", () => {
    expect(buildInvitationDateInfo("2027-05-20", "16:00")).toEqual({
      iso: "2027-05-20T00:00:00.000Z",
      time: "16:00",
      day: "20",
      month: "Maio",
      year: "2027",
      dayOfWeek: "Quinta-feira",
      display: "20 de Maio de 2027",
    });
    expect(buildInvitationDateInfo("2027-01-05").time).toBe("");
  });
});

describe("intake slugs", () => {
  it("derives the slug from the names and event type", () => {
    expect(intakeSlugBase(fullAnswers)).toBe("maria-pedro");
    expect(
      intakeSlugBase({
        event: { type: "anniversary", primaryName: "Zé Maria", secondaryName: "X" },
      }),
    ).toBe("ze-maria");
    expect(intakeSlugBase({})).toBe("convite");
  });

  it("suffixes the slug until it is free", () => {
    expect(nextFreeSlug("maria-pedro", new Set())).toBe("maria-pedro");
    expect(
      nextFreeSlug("maria-pedro", new Set(["maria-pedro", "maria-pedro-2"])),
    ).toBe("maria-pedro-3");
  });
});

describe("buildInvitationFromIntake", () => {
  const result = buildInvitationFromIntake(demo, fullAnswers, {
    slug: "maria-pedro",
  });

  it("maps identity, date and quote", () => {
    expect(result.slug).toBe("maria-pedro");
    expect(result.eventType).toBe("wedding");
    expect(result.couple).toEqual({
      bride: "Maria",
      groom: "Pedro",
      monogram: "M&P",
    });
    expect(result.date).toEqual(buildInvitationDateInfo("2027-05-20", "16:00"));
    expect(result.quote).toBe("O amor tudo suporta");
  });

  it("maps parents, keeping the demo's messages", () => {
    expect(result.parents).toEqual({
      enabled: true,
      blessingMessage: "Com a bênção",
      inviteMessage: "Convidam",
      bridesFather: "Carlos",
      bridesMother: "Rosa",
      groomsFather: "",
      groomsMother: "Lúcia",
    });
  });

  it("maps the first two locations and drops demo-only location data", () => {
    expect(result.location).toEqual({
      name: "Sé Catedral",
      address: "Baixa, Maputo",
      googleMapsUrl: "https://maps.test/se",
    });
    expect(result.location2).toEqual({
      name: "Quinta do Sol",
      address: "Matola",
      googleMapsUrl: "",
    });
  });

  it("maps schedule rows with stable ids", () => {
    expect(result.schedule).toHaveLength(2);
    expect(result.schedule[0]).toMatchObject({
      time: "16:00",
      label: "Cerimónia",
      venue: "Sé Catedral",
    });
    expect(result.schedule[1]).toMatchObject({ venue: "" });
    expect(result.schedule[0].id).toBeTruthy();
  });

  it("maps dress code, gifts and music without demo leftovers", () => {
    expect(result.dressCode).toMatchObject({
      enabled: true,
      text: "Gala",
      colors: ["#000000"],
    });
    expect(result.giftRegistry).toEqual({
      enabled: true,
      text: "IBAN MZ00 1234",
    });
    expect(result.audio).toEqual({
      enabled: false,
      src: "",
      artist: "",
      title: "Perfect — Ed Sheeran",
    });
  });

  it("maps guest guide presets and custom rules", () => {
    expect(result.guestGuide?.enabled).toBe(true);
    expect(result.guestGuide?.items.map((item) => item.label)).toEqual([
      "Seja pontual!",
      "Não leve crianças!",
      "Tragam guarda-chuva",
    ]);
    expect(result.guestGuide?.items[2]).toMatchObject({
      iconType: "lucide",
      iconName: "Star",
    });
  });

  it("maps RSVP settings on top of the demo's styling", () => {
    expect(result.rsvp).toMatchObject({
      enabled: true,
      deadline: "2027-05-01",
      showDietaryRestrictions: false,
      acceptingResponses: true,
    });
    expect(result.rsvp.customFields).toEqual(demo.rsvp.customFields);
  });

  it("maps FAQs and clears demo text that would leak", () => {
    expect(result.faqs).toEqual([
      expect.objectContaining({ question: "Como chegar?", answer: "De carro" }),
    ]);
    expect(result.translations).toBeUndefined();
    expect(result.socialPreview).toBeUndefined();
    expect(result.enabledLocales).toEqual(["pt"]);
    expect(result.languageSwitcherEnabled).toBe(false);
    expect(result.isDemo).toBe(false);
    expect(result.priceFromCents).toBeNull();
  });

  it("falls back to empty or demo values when optional answers are missing", () => {
    const minimal = buildInvitationFromIntake(
      demo,
      {
        event: { type: "other", typeLabel: "Graduação", primaryName: "Rui", date: "2027-07-01" },
        locations: [{ name: "Reitoria" }],
      },
      { slug: "rui" },
    );
    expect(minimal.eventType).toBe("other");
    expect(minimal.couple).toEqual({ bride: "Rui", groom: "", monogram: "R" });
    expect(minimal.quote).toBe(demo.quote);
    expect(minimal.location2).toBeUndefined();
    expect(minimal.schedule).toEqual([]);
    expect(minimal.parents?.enabled).toBe(false);
    expect(minimal.dressCode.enabled).toBe(false);
    expect(minimal.giftRegistry.enabled).toBe(false);
    expect(minimal.audio.enabled).toBe(false);
    expect(minimal.guestGuide?.enabled).toBe(false);
    expect(minimal.faqs).toEqual([]);
    expect(minimal.rsvp.deadline).toBeUndefined();
    expect(minimal.rsvp.showDietaryRestrictions).toBe(true);
  });
});

describe("buildSaveTheDateFromIntake", () => {
  const stdDemo = {
    themeId: "std_theme",
    envelope: { base: "#fff" },
    textStyles: { titleFont: "Inter" },
    rsvp: { enabled: false, showEmail: true },
    audio: { enabled: true, src: "https://cdn/x.mp3", artist: "A", title: "T" },
    bottomHero: { enabled: true, mediaUrl: "u", mediaType: "image", title: "t", description: "d" },
    customMessage: "Demo message",
  };

  it("maps names, date, place, message and RSVP; resets demo fields", () => {
    const data = buildSaveTheDateFromIntake(
      stdDemo,
      {
        event: {
          type: "wedding",
          primaryName: "Ana",
          secondaryName: "Rui",
          date: "2027-05-20",
          time: "16:00",
          place: "Maputo",
          quote: "Guardem a data",
        },
        rsvp: { deadline: "2027-04-01" },
        music: { enabled: true, text: "Canção" },
      },
      { slug: "ana-rui" },
    );

    expect(data).toMatchObject({
      slug: "ana-rui",
      theme: { connect: { id: "std_theme" } },
      couple: { bride: "Ana", groom: "Rui" },
      date: {
        iso: "2027-05-20T00:00:00.000Z",
        display: "20 de Maio de 2027",
        day: "20",
        month: "Maio",
        year: "2027",
        time: "16:00",
      },
      location: { name: "Maputo", address: "", googleMapsUrl: "" },
      customMessage: "Guardem a data",
      rsvp: { enabled: true, showEmail: true, deadline: "2027-04-01" },
      audio: { enabled: false, src: "", artist: "", title: "Canção" },
      envelope: { base: "#fff" },
      isDemo: false,
      priceFromCents: null,
      landingModelName: null,
      landingCustomizationLevel: "fully_customizable",
    });
    expect(data.socialPreview).toBe(Prisma.JsonNull);
    expect(data.location2).toBe(Prisma.JsonNull);
  });

  it("keeps the demo message and drops the location when not answered", () => {
    const data = buildSaveTheDateFromIntake(
      stdDemo,
      { event: { type: "wedding", primaryName: "Ana", date: "2027-05-20" } },
      { slug: "ana" },
    );
    expect(data.customMessage).toBe("Demo message");
    expect(data.location).toBe(Prisma.JsonNull);
    expect(data.audio).toEqual({ enabled: false, src: "", artist: "", title: "" });
  });
});

describe("customerInvitationResetData", () => {
  it("clears demo and catalogue fields", () => {
    expect(customerInvitationResetData()).toEqual({
      isDemo: false,
      priceFromCents: null,
      discountPriceFromCents: null,
      currency: "EUR",
      priceOverrides: Prisma.JsonNull,
      landingModelName: null,
      landingImageUrl: null,
      landingDetailImages: Prisma.JsonNull,
      landingDescription: null,
      landingSubtitle: null,
      landingTranslations: Prisma.JsonNull,
      landingCustomizationLevel: "fully_customizable",
    });
  });
});

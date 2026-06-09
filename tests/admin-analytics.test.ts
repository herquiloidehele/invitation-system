import { describe, expect, it } from "vitest";

import {
  composeInvitationAnalytics,
  resolveAnalyticsSlug,
} from "../lib/admin-analytics";

describe("resolveAnalyticsSlug", () => {
  const options = [
    { slug: "ana-bruno", coupleName: "Ana & Bruno" },
    { slug: "carla-david", coupleName: "Carla & David" },
  ];

  it("keeps the slug when it matches an invitation", () => {
    expect(resolveAnalyticsSlug("carla-david", options)).toBe("carla-david");
  });

  it("falls back to the first invitation when no slug is given", () => {
    expect(resolveAnalyticsSlug(undefined, options)).toBe("ana-bruno");
  });

  it("falls back to the first invitation for unknown or legacy 'all' slugs", () => {
    expect(resolveAnalyticsSlug("all", options)).toBe("ana-bruno");
    expect(resolveAnalyticsSlug("missing", options)).toBe("ana-bruno");
  });

  it("returns null when there are no invitations", () => {
    expect(resolveAnalyticsSlug("ana-bruno", [])).toBeNull();
  });
});

describe("composeInvitationAnalytics", () => {
  it("builds invitation analytics from aggregate rows", () => {
    const data = composeInvitationAnalytics({
      invitations: [
        {
          slug: "ana-bruno",
          couple: { bride: "Ana", groom: "Bruno" },
          createdAt: new Date("2026-01-02T10:00:00.000Z"),
          theme: { name: "classic" },
          rsvpResponses: [
            {
              id: "rsvp-1",
              guestName: "Maria",
              attending: true,
              submittedAt: new Date("2026-01-05T09:30:00.000Z"),
            },
          ],
        },
      ],
      pageViewSummaries: [
        {
          invitationSlug: "ana-bruno",
          totalViews: "7",
          uniqueVisitors: "4",
        },
      ],
      eventCounts: [
        { invitationSlug: "ana-bruno", type: "envelope_open", count: 3 },
        { invitationSlug: "ana-bruno", type: "maps_click", count: "2" },
      ],
      deviceCounts: [
        { invitationSlug: "ana-bruno", device: "mobile", count: 5 },
        { invitationSlug: "ana-bruno", device: null, count: 2 },
      ],
      dailyViews: [
        { invitationSlug: "ana-bruno", date: "2026-01-04", count: 2 },
        { invitationSlug: "ana-bruno", date: "2026-01-05", count: 5 },
      ],
      rsvpCounts: [{ invitationSlug: "ana-bruno", count: 12 }],
      dailyRsvps: [
        { invitationSlug: "ana-bruno", date: "2026-01-03", count: 1 },
        { invitationSlug: "ana-bruno", date: "2026-01-05", count: 11 },
      ],
    });

    expect(data).toEqual([
      {
        slug: "ana-bruno",
        coupleName: "Ana & Bruno",
        template: "classic",
        createdAt: "2026-01-02T10:00:00.000Z",
        totalViews: 7,
        uniqueVisitors: 4,
        envelopeOpens: 3,
        openRate: "42.9",
        rsvpCount: 12,
        conversionRate: "171.4",
        eventBreakdown: {
          maps_click: 2,
          waze_click: 0,
          gift_click: 0,
          audio_play: 0,
          calendar_click: 0,
          rsvp_submit: 0,
        },
        deviceBreakdown: {
          mobile: 5,
          tablet: 0,
          desktop: 0,
          unknown: 2,
        },
        viewsOverTime: [
          { date: "2026-01-03", views: 0, rsvps: 1 },
          { date: "2026-01-04", views: 2, rsvps: 0 },
          { date: "2026-01-05", views: 5, rsvps: 11 },
        ],
        recentRsvps: [
          {
            id: "rsvp-1",
            guestName: "Maria",
            attending: true,
            submittedAt: "2026-01-05T09:30:00.000Z",
          },
        ],
      },
    ]);
  });

  it("excludes demo invitations from analytics output", () => {
    const data = composeInvitationAnalytics({
      invitations: [
        {
          slug: "real-invite",
          couple: { bride: "Ana", groom: "Bruno" },
          createdAt: new Date("2026-01-02T10:00:00.000Z"),
          theme: { name: "classic" },
          isDemo: false,
          rsvpResponses: [],
        },
        {
          slug: "demo-invite",
          couple: { bride: "Demo", groom: "Example" },
          createdAt: new Date("2026-01-03T10:00:00.000Z"),
          theme: { name: "demo" },
          isDemo: true,
          rsvpResponses: [],
        },
      ],
      pageViewSummaries: [],
      eventCounts: [],
      deviceCounts: [],
      dailyViews: [],
      rsvpCounts: [],
      dailyRsvps: [],
    });

    expect(data.map((item) => item.slug)).toEqual(["real-invite"]);
  });
});

import { prisma } from "@/lib/db";
import {
  type CheckInPass,
  type ParsedScan,
  clampArrivedCount,
  computeCheckInUpdate,
  guestPartySize,
  rsvpPartySize,
  rsvpStatusFromResponses,
} from "@/lib/checkin";

type SubjectRef = { kind: "guest"; id: string } | { kind: "rsvp"; id: string };

interface ResolvedSubject {
  pass: CheckInPass;
  ref: SubjectRef;
}

/** Resolve a parsed scan into a unified pass, scoped to one invitation. */
export async function resolveSubject(
  slug: string,
  parsed: ParsedScan,
): Promise<ResolvedSubject | null> {
  // Guest lookup (guest or raw)
  if (parsed.type === "guest" || parsed.type === "raw") {
    const guest = await prisma.guest.findUnique({
      where: { token: parsed.token },
      select: {
        id: true,
        token: true,
        name: true,
        invitationSlug: true,
        tableLabel: true,
        totalGuests: true,
        checkedInAt: true,
        arrivedCount: true,
        rsvpResponses: {
          select: { attending: true, submittedAt: true },
        },
      },
    });
    if (guest && guest.invitationSlug === slug) {
      return {
        ref: { kind: "guest", id: guest.id },
        pass: {
          subjectType: "guest",
          subjectId: guest.id,
          token: guest.token,
          name: guest.name,
          partySize: guestPartySize(guest.totalGuests),
          rsvpStatus: rsvpStatusFromResponses(
            guest.rsvpResponses.map((r) => ({
              attending: r.attending,
              submittedAt: r.submittedAt,
            })),
          ),
          tableLabel: guest.tableLabel ?? undefined,
          checkedInAt: guest.checkedInAt?.toISOString() ?? null,
          arrivedCount: guest.arrivedCount,
        },
      };
    }
  }

  // Pass lookup (pass or raw)
  if (parsed.type === "pass" || parsed.type === "raw") {
    const rsvp = await prisma.rsvpResponse.findUnique({
      where: { checkInToken: parsed.token },
      select: {
        id: true,
        checkInToken: true,
        guestName: true,
        invitationSlug: true,
        attending: true,
        numAdults: true,
        numChildren: true,
        checkedInAt: true,
        arrivedCount: true,
      },
    });
    if (rsvp && rsvp.invitationSlug === slug && rsvp.checkInToken) {
      return {
        ref: { kind: "rsvp", id: rsvp.id },
        pass: {
          subjectType: "rsvp",
          subjectId: rsvp.id,
          token: rsvp.checkInToken,
          name: rsvp.guestName,
          partySize: rsvpPartySize(rsvp.numAdults, rsvp.numChildren),
          rsvpStatus: rsvp.attending ? "confirmed" : "declined",
          checkedInAt: rsvp.checkedInAt?.toISOString() ?? null,
          arrivedCount: rsvp.arrivedCount,
        },
      };
    }
  }

  return null;
}

/** Apply a check-in (first check-in sets time; updates arrived count). */
export async function applyCheckIn(
  slug: string,
  parsed: ParsedScan,
  requestedArrivedCount: number | undefined,
): Promise<CheckInPass | null> {
  const resolved = await resolveSubject(slug, parsed);
  if (!resolved) return null;
  const arrived = clampArrivedCount(
    requestedArrivedCount,
    resolved.pass.partySize,
  );
  const now = new Date();
  const update = computeCheckInUpdate(
    {
      checkedInAt: resolved.pass.checkedInAt
        ? new Date(resolved.pass.checkedInAt)
        : null,
    },
    arrived,
    now,
  );
  if (resolved.ref.kind === "guest") {
    await prisma.guest.update({
      where: { id: resolved.ref.id },
      data: {
        checkedInAt: update.checkedInAt,
        arrivedCount: update.arrivedCount,
      },
    });
  } else {
    await prisma.rsvpResponse.update({
      where: { id: resolved.ref.id },
      data: {
        checkedInAt: update.checkedInAt,
        arrivedCount: update.arrivedCount,
      },
    });
  }
  return {
    ...resolved.pass,
    checkedInAt: update.checkedInAt.toISOString(),
    arrivedCount: update.arrivedCount,
  };
}

/** Undo a check-in (clears time + count). */
export async function undoCheckIn(
  slug: string,
  parsed: ParsedScan,
): Promise<CheckInPass | null> {
  const resolved = await resolveSubject(slug, parsed);
  if (!resolved) return null;
  if (resolved.ref.kind === "guest") {
    await prisma.guest.update({
      where: { id: resolved.ref.id },
      data: { checkedInAt: null, arrivedCount: null },
    });
  } else {
    await prisma.rsvpResponse.update({
      where: { id: resolved.ref.id },
      data: { checkedInAt: null, arrivedCount: null },
    });
  }
  return { ...resolved.pass, checkedInAt: null, arrivedCount: null };
}

function mapGuestRow(g: {
  id: string;
  token: string;
  name: string;
  tableLabel: string | null;
  totalGuests: number | null;
  checkedInAt: Date | null;
  arrivedCount: number | null;
  rsvpResponses: { attending: boolean; submittedAt: Date }[];
}): CheckInPass {
  return {
    subjectType: "guest",
    subjectId: g.id,
    token: g.token,
    name: g.name,
    partySize: guestPartySize(g.totalGuests),
    rsvpStatus: rsvpStatusFromResponses(
      g.rsvpResponses.map((r) => ({
        attending: r.attending,
        submittedAt: r.submittedAt,
      })),
    ),
    tableLabel: g.tableLabel ?? undefined,
    checkedInAt: g.checkedInAt?.toISOString() ?? null,
    arrivedCount: g.arrivedCount,
  };
}

function mapRsvpRow(r: {
  id: string;
  checkInToken: string | null;
  guestName: string;
  attending: boolean;
  numAdults: number | null;
  numChildren: number | null;
  checkedInAt: Date | null;
  arrivedCount: number | null;
}): CheckInPass {
  return {
    subjectType: "rsvp",
    subjectId: r.id,
    token: r.checkInToken as string,
    name: r.guestName,
    partySize: rsvpPartySize(r.numAdults, r.numChildren),
    rsvpStatus: r.attending ? "confirmed" : "declined",
    checkedInAt: r.checkedInAt?.toISOString() ?? null,
    arrivedCount: r.arrivedCount,
  };
}

const GUEST_SELECT = {
  id: true,
  token: true,
  name: true,
  tableLabel: true,
  totalGuests: true,
  checkedInAt: true,
  arrivedCount: true,
  rsvpResponses: { select: { attending: true, submittedAt: true } },
} as const;

const RSVP_SELECT = {
  id: true,
  checkInToken: true,
  guestName: true,
  attending: true,
  numAdults: true,
  numChildren: true,
  checkedInAt: true,
  arrivedCount: true,
} as const;

/** Minimal name search for the manual door fallback. */
export async function searchSubjects(
  slug: string,
  query: string,
): Promise<CheckInPass[]> {
  const q = query.trim();
  if (!q) return [];
  const guests = await prisma.guest.findMany({
    where: { invitationSlug: slug, name: { contains: q, mode: "insensitive" } },
    select: GUEST_SELECT,
    take: 20,
    orderBy: { name: "asc" },
  });
  const rsvps = await prisma.rsvpResponse.findMany({
    where: {
      invitationSlug: slug,
      checkInToken: { not: null },
      guestName: { contains: q, mode: "insensitive" },
    },
    select: RSVP_SELECT,
    take: 20,
    orderBy: { guestName: "asc" },
  });
  return [...guests.map(mapGuestRow), ...rsvps.map(mapRsvpRow)];
}

export interface CheckInProgress {
  passes: CheckInPass[];
  totalSubjects: number;
  arrivedSubjects: number;
  arrivedHeadcount: number;
}

/** All check-in subjects for an invitation (guests + attending non-personalized RSVPs). */
async function listAll(slug: string): Promise<CheckInPass[]> {
  const guests = await prisma.guest.findMany({
    where: { invitationSlug: slug },
    select: GUEST_SELECT,
    orderBy: { name: "asc" },
  });
  const rsvps = await prisma.rsvpResponse.findMany({
    where: { invitationSlug: slug, checkInToken: { not: null } },
    select: RSVP_SELECT,
    orderBy: { guestName: "asc" },
  });
  return [...guests.map(mapGuestRow), ...rsvps.map(mapRsvpRow)];
}

/** Aggregate progress for the owner dashboard. */
export async function getCheckInProgress(
  slug: string,
): Promise<CheckInProgress> {
  const passes = await listAll(slug);
  const arrived = passes.filter((p) => p.checkedInAt !== null);
  return {
    passes,
    totalSubjects: passes.length,
    arrivedSubjects: arrived.length,
    arrivedHeadcount: arrived.reduce((sum, p) => sum + (p.arrivedCount ?? 0), 0),
  };
}

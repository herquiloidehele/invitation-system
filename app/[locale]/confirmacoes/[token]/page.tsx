import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import {
  CheckCircle2,
  XCircle,
  Users,
  Heart,
  Calendar,
  MapPin,
} from "lucide-react";
import { ExportButton } from "./ExportButton";
import GuestsTabClient from "./GuestsTabClient";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";
import type { InvitationEventType } from "@/lib/types";
import {
  getDateFormatLocale,
  resolveLocale,
  type AppLocale,
} from "@/i18n/locales";
import { createNoIndexMetadata } from "@/lib/seo";
import { formatRsvpCustomAnswers } from "@/lib/rsvp-custom-fields";
import { countAttendingGuests } from "@/lib/rsvp-config";
import type { RsvpCustomAnswer } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createNoIndexMetadata();

type Props = {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ tab?: string }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date, locale: AppLocale) {
  return new Date(date).toLocaleDateString(getDateFormatLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type OwnerLabels = {
  rsvpsTab: string;
  guestsTab: string;
  responses: string;
  attending: string;
  declined: string;
  listTitle: string;
  updated: string;
  emptyTitle: string;
  emptyInvitation: string;
  emptySaveTheDate: string;
  attendingBadge: string;
  declinedBadge: string;
  dietaryRestrictions: (value: string) => string;
  footer: string;
};

// ---------------------------------------------------------------------------
// Tab navigation (server-rendered, link-based)
// ---------------------------------------------------------------------------

function TabNav({
  active,
  token,
  showGuests,
  labels,
}: {
  active: "rsvps" | "guests";
  token: string;
  showGuests: boolean;
  labels: OwnerLabels;
}) {
  return (
    <div className="border-b mb-6">
      <nav className="flex gap-6">
        <Link
          href={`/confirmacoes/${token}`}
          className={`pb-3 -mb-px text-sm font-medium border-b-2 transition-colors ${
            active === "rsvps"
              ? "border-stone-800 text-stone-800"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          {labels.rsvpsTab}
        </Link>
        {showGuests && (
          <Link
            href={`/confirmacoes/${token}?tab=guests`}
            className={`pb-3 -mb-px text-sm font-medium border-b-2 transition-colors ${
              active === "guests"
                ? "border-stone-800 text-stone-800"
                : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            {labels.guestsTab}
          </Link>
        )}
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invitation RSVP view
// ---------------------------------------------------------------------------

async function InvitationRsvpView({
  token,
  tab,
  locale,
  labels,
}: {
  token: string;
  tab: "rsvps" | "guests";
  locale: AppLocale;
  labels: OwnerLabels;
}) {
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
    include: {
      rsvpResponses: { orderBy: { submittedAt: "desc" } },
    },
  });

  if (!invitation) return null;

  const couple = invitation.couple as { bride: string; groom: string };
  const invitationName = buildInvitationDisplayName({
    eventType: invitation.eventType as InvitationEventType,
    primaryName: couple.bride,
    secondaryName: couple.groom,
  });
  const date = invitation.date as { display: string };
  const location = invitation.location as { name: string; address?: string };

  const responses = invitation.rsvpResponses;
  const totalAttending = countAttendingGuests(
    responses,
    invitation.rsvp as Parameters<typeof countAttendingGuests>[1],
  );
  const totalDeclined = responses.filter((r) => !r.attending).length;
  const showGuests = invitation.guestManagementEnabled === true;
  const activeTab = showGuests && tab === "guests" ? "guests" : "rsvps";

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-rose-500">
              <Heart className="size-5 fill-rose-500" />
              <span className="text-sm font-medium uppercase tracking-widest">
                Brindel Studio
              </span>
            </div>
            {activeTab === "rsvps" && (
              <ExportButton
                token={token}
                filename={`confirmacoes-${invitation.slug}.pdf`}
              />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-stone-800 mt-3">
            {invitationName}
          </h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {date.display}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {location.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <TabNav active={activeTab} token={token} showGuests={showGuests} labels={labels} />

        {activeTab === "rsvps" ? (
          <div className="space-y-6">
            <RsvpSummary
              total={responses.length}
              attending={totalAttending}
              declined={totalDeclined}
              labels={labels}
            />
            <RsvpList
              locale={locale}
              labels={labels}
              responses={responses.map((r) => ({
                id: r.id,
                guestName: r.guestName,
                email: r.email,
                attending: r.attending,
                dietaryRestrictions: r.dietaryRestrictions,
                companion: r.companion,
                message: r.message,
                customAnswers: r.customAnswers as RsvpCustomAnswer[] | null,
                submittedAt: r.submittedAt,
              }))}
              emptyLabel={labels.emptyInvitation}
            />
          </div>
        ) : (
          <GuestsTabClient
            ownerToken={token}
            invitationSlug={invitation.slug}
            messageTemplate={invitation.guestMessageTemplate ?? ""}
            canAddGuests={invitation.ownerCanAddGuests}
          />
        )}
      </main>

      <PageFooter labels={labels} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save the Date RSVP view (unchanged — STD has no guest management)
// ---------------------------------------------------------------------------

async function SaveTheDateRsvpView({
  token,
  locale,
  labels,
}: {
  token: string;
  locale: AppLocale;
  labels: OwnerLabels;
}) {
  const std = await prisma.saveTheDate.findUnique({
    where: { ownerToken: token },
    include: {
      rsvpResponses: { orderBy: { submittedAt: "desc" } },
    },
  });

  if (!std) return null;

  const couple = std.couple as { bride: string; groom: string };
  const date = std.date as { display: string };

  const responses = std.rsvpResponses;
  const totalAttending = countAttendingGuests(
    responses,
    std.rsvp as Parameters<typeof countAttendingGuests>[1],
  );
  const totalDeclined = responses.filter((r) => !r.attending).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-rose-500">
              <Heart className="size-5 fill-rose-500" />
              <span className="text-sm font-medium uppercase tracking-widest">
                Brindel Studio — Save the Date
              </span>
            </div>
            <ExportButton
              token={token}
              filename={`confirmacoes-std-${std.slug}.pdf`}
            />
          </div>
          <h1 className="text-2xl font-semibold text-stone-800 mt-3">
            {couple.bride} &amp; {couple.groom}
          </h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {date.display}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <RsvpSummary
          total={responses.length}
          attending={totalAttending}
          declined={totalDeclined}
          labels={labels}
        />
        <RsvpList
          locale={locale}
          labels={labels}
          responses={responses.map((r) => ({
            id: r.id,
            guestName: r.guestName,
            email: r.email,
            attending: r.attending,
            dietaryRestrictions: r.dietaryRestrictions,
            companion: r.companion,
            message: r.message,
            customAnswers: r.customAnswers as RsvpCustomAnswer[] | null,
            submittedAt: r.submittedAt,
          }))}
          emptyLabel={labels.emptySaveTheDate}
        />
      </main>

      <PageFooter labels={labels} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI pieces (unchanged from the previous version)
// ---------------------------------------------------------------------------

function RsvpSummary({
  total,
  attending,
  declined,
  labels,
}: {
  total: number;
  attending: number;
  declined: number;
  labels: OwnerLabels;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="text-3xl font-bold text-stone-800">{total}</div>
        <div className="text-xs text-stone-500 mt-1">{labels.responses}</div>
      </div>
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="text-3xl font-bold text-emerald-600">{attending}</div>
        <div className="text-xs text-stone-500 mt-1">{labels.attending}</div>
      </div>
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="text-3xl font-bold text-rose-500">{declined}</div>
        <div className="text-xs text-stone-500 mt-1">{labels.declined}</div>
      </div>
    </div>
  );
}

export function RsvpList({
  responses,
  emptyLabel,
  locale,
  labels,
}: {
  responses: Array<{
    id: string;
    guestName: string;
    email: string | null;
    attending: boolean;
    dietaryRestrictions: string | null;
    companion: string | null;
    message: string | null;
    customAnswers: RsvpCustomAnswer[] | null;
    submittedAt: Date;
  }>;
  emptyLabel: string;
  locale: AppLocale;
  labels: OwnerLabels;
}) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold text-stone-800">{labels.listTitle}</h2>
        <p className="text-sm text-stone-500 mt-0.5">
          {labels.updated}
        </p>
      </div>

      {responses.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <Users className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{labels.emptyTitle}</p>
          <p className="text-sm mt-1">{emptyLabel}</p>
        </div>
      ) : (
        <ul className="divide-y">
          {responses.map((r) => (
            <li key={r.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-stone-800">
                      {r.guestName}
                    </span>
                    {r.companion && (
                      <span className="text-sm text-stone-500">
                        &amp; {r.companion}
                      </span>
                    )}
                    {r.attending ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3" />
                        {labels.attendingBadge}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                        <XCircle className="size-3" />
                        {labels.declinedBadge}
                      </span>
                    )}
                  </div>
                  {r.email && (
                    <p className="text-sm text-stone-400 mt-0.5">{r.email}</p>
                  )}
                  {r.dietaryRestrictions && (
                    <p className="text-sm text-amber-700 mt-1 bg-amber-50 px-2 py-1 rounded-md inline-block">
                      {labels.dietaryRestrictions(r.dietaryRestrictions)}
                    </p>
                  )}
                  {r.message && (
                    <blockquote className="mt-2 pl-3 border-l-2 border-stone-200 text-sm italic text-stone-500">
                      &ldquo;{r.message}&rdquo;
                    </blockquote>
                  )}
                  {formatRsvpCustomAnswers(r.customAnswers).length > 0 && (
                    <div className="mt-2 space-y-1 rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">
                      {formatRsvpCustomAnswers(r.customAnswers).map((answer) => (
                        <p key={`${r.id}-${answer.label}`}>
                          <span className="font-medium text-stone-700">
                            {answer.label}:
                          </span>{" "}
                          {answer.value}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <time className="text-xs text-stone-400 whitespace-nowrap shrink-0 mt-0.5">
                  {formatDate(r.submittedAt, locale)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PageFooter({ labels }: { labels: OwnerLabels }) {
  return (
    <footer className="border-t mt-12 py-6 text-center text-xs text-stone-400">
      {labels.footer}
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Page — detects whether token belongs to invitation or save-the-date
// ---------------------------------------------------------------------------

export default async function OwnerRsvpPage({ params, searchParams }: Props) {
  const { locale: rawLocale, token } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "guests" ? "guests" : "rsvps";
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations("OwnerConfirmations");
  const labels: OwnerLabels = {
    rsvpsTab: t("rsvpsTab"),
    guestsTab: t("guestsTab"),
    responses: t("responses"),
    attending: t("attending"),
    declined: t("declined"),
    listTitle: t("listTitle"),
    updated: t("updated"),
    emptyTitle: t("emptyTitle"),
    emptyInvitation: t("emptyInvitation"),
    emptySaveTheDate: t("emptySaveTheDate"),
    attendingBadge: t("attendingBadge"),
    declinedBadge: t("declinedBadge"),
    dietaryRestrictions: (value) => t("dietaryRestrictions", { value }),
    footer: t("footer"),
  };

  // Try invitation first (most common case)
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
  });

  if (invitation) {
    return (
      <InvitationRsvpView
        token={token}
        tab={activeTab}
        locale={locale}
        labels={labels}
      />
    );
  }

  // Try save-the-date
  const std = await prisma.saveTheDate.findUnique({
    where: { ownerToken: token },
  });

  if (std) {
    return <SaveTheDateRsvpView token={token} locale={locale} labels={labels} />;
  }

  notFound();
}

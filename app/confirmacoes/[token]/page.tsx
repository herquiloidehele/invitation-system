import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  CheckCircle2,
  XCircle,
  Users,
  Heart,
  Calendar,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Invitation RSVP view
// ---------------------------------------------------------------------------

async function InvitationRsvpView({ token }: { token: string }) {
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
    include: {
      rsvpResponses: { orderBy: { submittedAt: "desc" } },
    },
  });

  if (!invitation) return null;

  const couple = invitation.couple as { bride: string; groom: string };
  const date = invitation.date as { display: string };
  const location = invitation.location as { name: string; address?: string };

  const responses = invitation.rsvpResponses;
  const totalAttending = responses.filter((r) => r.attending).length;
  const totalDeclined = responses.filter((r) => !r.attending).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-rose-500 mb-3">
            <Heart className="size-5 fill-rose-500" />
            <span className="text-sm font-medium uppercase tracking-widest">
              Brindel Studio
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-stone-800">
            {couple.bride} &amp; {couple.groom}
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <RsvpSummary
          total={responses.length}
          attending={totalAttending}
          declined={totalDeclined}
        />
        <RsvpList
          responses={responses.map((r) => ({
            id: r.id,
            guestName: r.guestName,
            email: r.email,
            attending: r.attending,
            dietaryRestrictions: r.dietaryRestrictions,
            message: r.message,
            submittedAt: r.submittedAt,
          }))}
          emptyLabel="Os convidados ainda não responderam ao convite."
        />
      </main>

      <PageFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save the Date RSVP view
// ---------------------------------------------------------------------------

async function SaveTheDateRsvpView({ token }: { token: string }) {
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
  const totalAttending = responses.filter((r) => r.attending).length;
  const totalDeclined = responses.filter((r) => !r.attending).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-rose-500 mb-3">
            <Heart className="size-5 fill-rose-500" />
            <span className="text-sm font-medium uppercase tracking-widest">
              Brindel Studio — Save the Date
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-stone-800">
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
        />
        <RsvpList
          responses={responses.map((r) => ({
            id: r.id,
            guestName: r.guestName,
            email: r.email,
            attending: r.attending,
            dietaryRestrictions: r.dietaryRestrictions,
            message: r.message,
            submittedAt: r.submittedAt,
          }))}
          emptyLabel="Os convidados ainda não responderam ao Save the Date."
        />
      </main>

      <PageFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI pieces
// ---------------------------------------------------------------------------

function RsvpSummary({
  total,
  attending,
  declined,
}: {
  total: number;
  attending: number;
  declined: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="text-3xl font-bold text-stone-800">{total}</div>
        <div className="text-xs text-stone-500 mt-1">Respostas</div>
      </div>
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="text-3xl font-bold text-emerald-600">{attending}</div>
        <div className="text-xs text-stone-500 mt-1">Confirmados</div>
      </div>
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="text-3xl font-bold text-rose-500">{declined}</div>
        <div className="text-xs text-stone-500 mt-1">Não vão</div>
      </div>
    </div>
  );
}

function RsvpList({
  responses,
  emptyLabel,
}: {
  responses: Array<{
    id: string;
    guestName: string;
    email: string | null;
    attending: boolean;
    dietaryRestrictions: string | null;
    message: string | null;
    submittedAt: Date;
  }>;
  emptyLabel: string;
}) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold text-stone-800">Lista de Confirmações</h2>
        <p className="text-sm text-stone-500 mt-0.5">Actualizada em tempo real</p>
      </div>

      {responses.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <Users className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sem respostas ainda</p>
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
                    {r.attending ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3" />
                        Confirma presença
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                        <XCircle className="size-3" />
                        Não vai comparecer
                      </span>
                    )}
                  </div>
                  {r.email && (
                    <p className="text-sm text-stone-400 mt-0.5">{r.email}</p>
                  )}
                  {r.dietaryRestrictions && (
                    <p className="text-sm text-amber-700 mt-1 bg-amber-50 px-2 py-1 rounded-md inline-block">
                      Restrições: {r.dietaryRestrictions}
                    </p>
                  )}
                  {r.message && (
                    <blockquote className="mt-2 pl-3 border-l-2 border-stone-200 text-sm italic text-stone-500">
                      &ldquo;{r.message}&rdquo;
                    </blockquote>
                  )}
                </div>
                <time className="text-xs text-stone-400 whitespace-nowrap shrink-0 mt-0.5">
                  {formatDate(r.submittedAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="border-t mt-12 py-6 text-center text-xs text-stone-400">
      Brindel Studio &mdash; Convites Digitais para Casamentos
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Page — detects whether token belongs to invitation or save-the-date
// ---------------------------------------------------------------------------

export default async function OwnerRsvpPage({ params }: Props) {
  const { token } = await params;

  // Try invitation first (most common case)
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
  });

  if (invitation) {
    return <InvitationRsvpView token={token} />;
  }

  // Try save-the-date
  const std = await prisma.saveTheDate.findUnique({
    where: { ownerToken: token },
  });

  if (std) {
    return <SaveTheDateRsvpView token={token} />;
  }

  notFound();
}

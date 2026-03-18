import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CheckCircle2, XCircle, Users, Heart, Calendar, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function OwnerRsvpPage({ params }: Props) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
    include: {
      rsvpResponses: { orderBy: { submittedAt: "desc" } },
    },
  });

  if (!invitation) notFound();

  const couple = invitation.couple as { bride: string; groom: string };
  const date = invitation.date as { display: string };
  const location = invitation.location as { name: string; address?: string };

  const responses = invitation.rsvpResponses;
  const totalAttending = responses.filter((r) => r.attending).length;
  const totalDeclined = responses.filter((r) => !r.attending).length;
  const totalGuests = responses
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + r.guestsCount, 0);

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
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
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-3xl font-bold text-stone-800">
              {responses.length}
            </div>
            <div className="text-xs text-stone-500 mt-1">Respostas</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600">
              {totalAttending}
            </div>
            <div className="text-xs text-stone-500 mt-1">Confirmados</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-3xl font-bold text-rose-500">
              {totalDeclined}
            </div>
            <div className="text-xs text-stone-500 mt-1">Não vão</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-3xl font-bold text-stone-800">
              {totalGuests}
            </div>
            <div className="text-xs text-stone-500 mt-1 flex items-center justify-center gap-1">
              <Users className="size-3" />
              Convidados
            </div>
          </div>
        </div>

        {/* Response list */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-stone-800">
              Lista de Confirmações
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Actualizada em tempo real
            </p>
          </div>

          {responses.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <Users className="size-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sem respostas ainda</p>
              <p className="text-sm mt-1">
                Os convidados ainda não responderam ao convite.
              </p>
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
                        {r.attending && r.guestsCount > 1 && (
                          <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                            <Users className="size-3" />
                            {r.guestsCount} pessoas
                          </span>
                        )}
                      </div>
                      {r.email && (
                        <p className="text-sm text-stone-400 mt-0.5">
                          {r.email}
                        </p>
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
      </main>

      <footer className="border-t mt-12 py-6 text-center text-xs text-stone-400">
        Brindel Studio &mdash; Convites Digitais para Casamentos
      </footer>
    </div>
  );
}

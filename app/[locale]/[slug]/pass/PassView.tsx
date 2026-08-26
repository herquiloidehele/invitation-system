"use client";

import EntryPassQr from "@/components/shared/EntryPassQr";
import { buildPassUrl } from "@/lib/checkin-links";

export default function PassView({
  slug,
  checkInToken,
  guestName,
}: {
  slug: string;
  checkInToken: string;
  guestName: string;
}) {
  const value =
    typeof window !== "undefined"
      ? buildPassUrl(window.location.origin, slug, checkInToken)
      : "";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold">Passe de entrada</h1>
      {value ? (
        <EntryPassQr
          value={value}
          caption={guestName}
          downloadLabel="Descarregar"
          downloadFileName={`passe-${slug}`}
        />
      ) : null}
      <p className="text-sm text-stone-500">Apresenta este código à entrada.</p>
    </main>
  );
}

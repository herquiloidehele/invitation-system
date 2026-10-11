import type { RawSearchParams } from "@/lib/admin-list/params";
import { loadRsvpPage, parseRsvpListParams } from "@/lib/admin-list/rsvps";
import { RsvpsClient } from "./RsvpsClient";

export const dynamic = "force-dynamic";

export default async function AdminRsvpsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const result = await loadRsvpPage(
    parseRsvpListParams(await searchParams),
  );

  return <RsvpsClient {...result} />;
}

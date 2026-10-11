import {
  loadInvitationListPage,
  parseInvitationListParams,
} from "@/lib/admin-list/invitations";
import type { RawSearchParams } from "@/lib/admin-list/params";
import { InvitationsClient } from "./InvitationsClient";

export const dynamic = "force-dynamic";

export default async function AdminInvitationsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const list = await loadInvitationListPage(
    parseInvitationListParams(await searchParams),
  );

  return <InvitationsClient {...list} />;
}

import {
  loadIntakeListPage,
  parseIntakeListParams,
} from "@/lib/admin-list/intakes";
import type { RawSearchParams } from "@/lib/admin-list/params";
import { listDemos } from "@/lib/intake/service";
import { IntakesClient } from "./IntakesClient";

export const dynamic = "force-dynamic";

export default async function AdminIntakesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const [list, demos] = await Promise.all([
    loadIntakeListPage(parseIntakeListParams(await searchParams)),
    listDemos(),
  ]);

  return (
    <IntakesClient
      {...list}
      demos={demos
        .filter((demo) => !demo.blocked)
        .map((demo) => ({ kind: demo.kind, id: demo.id, name: demo.name }))}
    />
  );
}

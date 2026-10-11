import type { RawSearchParams } from "@/lib/admin-list/params";
import {
  loadSaveTheDateListPage,
  parseSaveTheDateListParams,
} from "@/lib/admin-list/save-the-dates";
import { SaveTheDatesClient } from "./SaveTheDatesClient";

export const dynamic = "force-dynamic";

export default async function AdminSaveTheDatesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const list = await loadSaveTheDateListPage(
    parseSaveTheDateListParams(await searchParams),
  );

  return <SaveTheDatesClient {...list} />;
}

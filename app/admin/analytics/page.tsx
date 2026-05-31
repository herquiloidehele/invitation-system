import { getInvitationAnalytics } from "@/lib/admin-analytics";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ range?: string; slug?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { range = "30d", slug = "all" } = await searchParams;
  const data = await getInvitationAnalytics({ range, slug });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analíticas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe o desempenho dos seus convites em tempo real.
        </p>
      </div>
      <AnalyticsClient data={data} range={range} selectedSlug={slug} />
    </div>
  );
}

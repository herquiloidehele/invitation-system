import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSaveTheDate } from "@/lib/save-the-date";
import SaveTheDateView from "@/components/save-the-date/SaveTheDateView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSaveTheDate(slug);

  if (!data) {
    return { title: "Save the Date — Not Found" };
  }

  const { bride, groom } = data.couple;

  return {
    title: `${bride} & ${groom} — Save the Date`,
    description: `${bride} & ${groom} invite you to save the date: ${data.date.display}`,
    openGraph: {
      title: `${bride} & ${groom} — Save the Date`,
      description: `Save the date: ${data.date.display}`,
    },
  };
}

export default async function SaveTheDatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getSaveTheDate(slug);

  if (!data) {
    notFound();
  }

  return <SaveTheDateView saveTheDate={data} />;
}

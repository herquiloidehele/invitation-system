import { getCustomFontManifest } from "@/lib/custom-fonts/public-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const manifest = await getCustomFontManifest(id);
  if (!manifest) {
    return Response.json({ error: "Font family not found" }, { status: 404 });
  }
  const etag = `"font-family-${manifest.id}-${manifest.revision}"`;
  const headers = {
    "Cache-Control": "public, max-age=0, must-revalidate",
    ETag: etag,
  };
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return Response.json(manifest, { headers });
}

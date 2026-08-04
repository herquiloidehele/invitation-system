import { getCustomFontFile } from "@/lib/custom-fonts/public-service";

type RouteContext = { params: Promise<{ variantId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const file = await getCustomFontFile((await context.params).variantId);
    if (!file) {
      return Response.json({ error: "Font file not found" }, { status: 404 });
    }
    const headers = new Headers({
      "Content-Type": file.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    const contentLength = file.stream.contentLength ?? file.sizeBytes;
    if (contentLength > 0) headers.set("Content-Length", String(contentLength));
    return new Response(file.stream.body, { headers });
  } catch {
    return Response.json({ error: "Font file not found" }, { status: 404 });
  }
}

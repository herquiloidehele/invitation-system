import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { createByteLimitTransform } from "@/lib/s3";

async function readStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return chunks;
}

describe("createByteLimitTransform", () => {
  it("passes chunks through while tracking bytes", async () => {
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3]));
        controller.close();
      },
    });
    const transform = createByteLimitTransform(3);

    const chunks = await readStream(source.pipeThrough(transform.stream));

    expect(chunks).toEqual([new Uint8Array([1, 2]), new Uint8Array([3])]);
    expect(transform.getBytesRead()).toBe(3);
  });

  it("throws when the limit is crossed", async () => {
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
        controller.close();
      },
    });
    const transform = createByteLimitTransform(3);

    await expect(readStream(source.pipeThrough(transform.stream))).rejects.toThrow(
      "S3 object exceeded the download byte limit",
    );
    expect(transform.getBytesRead()).toBe(4);
  });

  it("streams transcoded videos and treats poster extraction as mandatory", () => {
    const route = readFileSync(
      "app/api/admin/media/process-video/route.ts",
      "utf8",
    );

    expect(route).toContain(
      'putObjectFile(mp4Key, outputPath, "video/mp4")',
    );
    expect(route).not.toContain("readFile(outputPath)");
    expect(route).not.toContain("Non-fatal: keep the original upload");
    expect(route).not.toContain("poster extraction failed");
    expect(route).toContain("await deleteObject(key)");
  });
});

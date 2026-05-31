import { describe, expect, it } from "vitest";
import { GET, HEAD } from "../app/_online/route";

describe("/_online stub route", () => {
  it("GET returns 204 with an empty body", async () => {
    const res = await GET();
    expect(res.status).toBe(204);
    const text = await res.text();
    expect(text).toBe("");
  });

  it("HEAD returns 204 with an empty body", async () => {
    const res = await HEAD();
    expect(res.status).toBe(204);
    const text = await res.text();
    expect(text).toBe("");
  });

  it("sets cache-control to prevent the heartbeat from being cached", async () => {
    const res = await GET();
    expect(res.headers.get("cache-control")).toMatch(/no-store/);
  });
});

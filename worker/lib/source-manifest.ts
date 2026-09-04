/**
 * On resume the agent used to Grep and Read its way back to a file it wrote
 * last turn — 7 Grep + 6 Bash calls on one measured build. Naming the files
 * up front turns that into a single targeted Read.
 */
export function buildSourceManifest(files: Record<string, string>): string {
  const names = Object.keys(files).sort();
  if (names.length === 0) return "";
  const kb = (s: string) =>
    `${(Buffer.byteLength(s, "utf8") / 1024).toFixed(1)} KB`;
  return [
    "Existing source files (you wrote these last time):",
    ...names.map((n) => `- ${n} (${kb(files[n])})`),
    "",
    "Go straight to the file that owns the change. Do NOT Grep or list the",
    "workspace to rediscover them. Read a file only when you need its exact",
    "contents to edit it. Never read shims/, runtime.ts or platform.d.ts — the",
    "contract is already in your instructions. Read each file in refs/ at most",
    "once.",
  ].join("\n");
}

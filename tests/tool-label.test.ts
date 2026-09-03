import { describe, expect, it } from "vitest";

import { toolLabel, toBuildEvent } from "@/worker/lib/build-events";

describe("toolLabel", () => {
  it("names the file being read or edited", () => {
    expect(toolLabel("Read", { file_path: "/ws/index.tsx" })).toBe(
      "A ler index.tsx",
    );
    expect(toolLabel("Edit", { file_path: "/ws/index.tsx" })).toBe(
      "A editar index.tsx",
    );
    expect(toolLabel("Write", { file_path: "/ws/index.tsx" })).toBe(
      "A escrever index.tsx",
    );
  });

  it("recognises the build command", () => {
    expect(toolLabel("Bash", { command: "npm run build" })).toBe(
      "A compilar o bundle",
    );
    expect(toolLabel("Bash", { command: "npx tsc --noEmit" })).toBe(
      "A verificar tipos",
    );
  });

  it("falls back to a generic action for other commands", () => {
    expect(toolLabel("Bash", { command: "ls -la" })).toBe("A executar comando");
  });

  it("labels search tools", () => {
    expect(toolLabel("Grep", {})).toBe("A procurar no código");
    expect(toolLabel("Glob", {})).toBe("A procurar ficheiros");
  });

  it("falls back to the raw tool name when unknown", () => {
    expect(toolLabel("Mystery", {})).toBe("Mystery");
  });

  it("survives a missing input", () => {
    expect(toolLabel("Read", undefined)).toBe("A ler ficheiro");
  });
});

describe("toBuildEvent tool events", () => {
  it("carries a human label alongside the tool name", () => {
    const e = toBuildEvent({
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "Edit", input: { file_path: "/w/index.tsx" } },
        ],
      },
    });
    expect(e).toEqual({
      kind: "tool",
      name: "Edit",
      label: "A editar index.tsx",
    });
  });
});

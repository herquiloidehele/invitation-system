import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  invitationFindUnique: vi.fn(),
  saveTheDateFindUnique: vi.fn(),
  intakeFindUnique: vi.fn(),
  intakeCreate: vi.fn(),
  intakeUpdate: vi.fn(),
  answerUpsert: vi.fn(),
  answerFindMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    invitation: { findUnique: db.invitationFindUnique },
    saveTheDate: { findUnique: db.saveTheDateFindUnique },
    intake: {
      findUnique: db.intakeFindUnique,
      create: db.intakeCreate,
      update: db.intakeUpdate,
    },
    intakeAnswer: { upsert: db.answerUpsert, findMany: db.answerFindMany },
    $transaction: db.transaction,
  },
}));

import { POST as createIntake } from "@/app/api/intakes/route";
import { PATCH as patchIntake } from "@/app/api/intakes/[token]/route";
import { POST as submitIntake } from "@/app/api/intakes/[token]/submit/route";

const TOKEN = "a".repeat(43);
let ipCounter = 0;

function request(body: unknown, init: { raw?: string } = {}) {
  ipCounter += 1;
  return new Request("http://localhost/api/intakes", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.0.0.${ipCounter}`,
      "user-agent": "vitest",
    },
    body: init.raw ?? JSON.stringify(body),
  });
}

const tokenParams = (token = TOKEN) => ({
  params: Promise.resolve({ token }),
});

const demoInvitation = {
  id: "inv_demo",
  slug: "aurora",
  isDemo: true,
  couple: { bride: "Ana", groom: "João" },
  heroImage: "https://cdn/hero.jpg",
  landingModelName: "Aurora",
  landingImageUrl: null,
  landingCustomizationLevel: "fully_customizable",
  blockedAt: null,
  blockedReason: null,
};

const validCreate = {
  productKind: "convite",
  demoSlug: "aurora",
  locale: "pt",
  contactName: "Maria",
  contactWhatsapp: "+258 84 123 4567",
  website: "",
};

function storedIntake(overrides: Record<string, unknown> = {}) {
  return {
    id: "intake_1",
    token: TOKEN,
    productKind: "convite",
    status: "draft",
    contactName: "Maria",
    contactWhatsapp: "258841234567",
    submittedAt: null,
    answers: [],
    invitation: demoInvitation,
    saveTheDate: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.invitationFindUnique.mockResolvedValue(demoInvitation);
  db.saveTheDateFindUnique.mockResolvedValue(null);
  db.intakeCreate.mockImplementation(async ({ data }) => ({
    id: "intake_1",
    ...data,
  }));
  db.answerUpsert.mockImplementation((args) => ({ op: "upsert", args }));
  db.answerFindMany.mockResolvedValue([]);
  db.intakeUpdate.mockImplementation((args) => ({ op: "update", args }));
  db.transaction.mockImplementation(async (ops: unknown[]) =>
    ops.map((op) =>
      (op as { op: string }).op === "update"
        ? { answersUpdatedAt: new Date("2026-09-26T12:00:00Z") }
        : op,
    ),
  );
});

describe("POST /api/intakes (self-start)", () => {
  it("creates a self-started intake with a token and localized path", async () => {
    const response = await createIntake(request(validCreate));

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(json.path).toBe(`/personalizar/${json.token}`);

    const { data } = db.intakeCreate.mock.calls[0][0];
    expect(data).toMatchObject({
      productKind: "convite",
      invitationId: "inv_demo",
      demoSlug: "aurora",
      demoName: "Aurora",
      source: "self",
      locale: "pt",
      status: "draft",
      contactName: "Maria",
      contactWhatsapp: "258841234567",
      lastStep: "event",
      userAgent: "vitest",
    });
    expect(data.ipHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects a filled honeypot without touching the database", async () => {
    const response = await createIntake(
      request({ ...validCreate, website: "spam.example" }),
    );
    expect(response.status).toBe(400);
    expect(db.intakeCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid contact details with field issues", async () => {
    const response = await createIntake(
      request({ ...validCreate, contactName: "", contactWhatsapp: "12" }),
    );
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.issues.map((issue: { field: string }) => issue.field)).toEqual(
      ["name", "whatsapp"],
    );
  });

  it("rejects malformed JSON and unknown kinds", async () => {
    expect((await createIntake(request(null, { raw: "{" }))).status).toBe(400);
    expect(
      (await createIntake(request({ ...validCreate, productKind: "x" })))
        .status,
    ).toBe(400);
  });

  it("answers 404 for a missing or non-demo model", async () => {
    db.invitationFindUnique.mockResolvedValueOnce(null);
    expect((await createIntake(request(validCreate))).status).toBe(404);

    db.invitationFindUnique.mockResolvedValueOnce({
      ...demoInvitation,
      isDemo: false,
    });
    expect((await createIntake(request(validCreate))).status).toBe(404);
    expect(db.intakeCreate).not.toHaveBeenCalled();
  });

  it("answers 403 invitation_blocked for a blocked demo", async () => {
    db.invitationFindUnique.mockResolvedValueOnce({
      ...demoInvitation,
      blockedAt: new Date(),
    });
    const response = await createIntake(request(validCreate));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: "invitation_blocked",
    });
  });

  it("links a Save the Date demo by its own column", async () => {
    db.saveTheDateFindUnique.mockResolvedValueOnce({
      id: "std_demo",
      slug: "vintage",
      isDemo: true,
      couple: { bride: "A", groom: "B" },
      landingModelName: "Vintage",
      landingImageUrl: null,
      landingCustomizationLevel: "pre_designed",
    });
    const response = await createIntake(
      request({
        ...validCreate,
        productKind: "save-the-date",
        demoSlug: "vintage",
        locale: "en",
      }),
    );
    expect(response.status).toBe(201);
    expect(db.intakeCreate.mock.calls[0][0].data).toMatchObject({
      productKind: "save-the-date",
      saveTheDateId: "std_demo",
      demoName: "Vintage",
      locale: "en",
    });
    expect((await response.json()).path).toMatch(/^\/en\/personalizar\//);
  });
});

describe("PATCH /api/intakes/[token] (autosave)", () => {
  it("upserts each answer key and bumps the intake in one transaction", async () => {
    db.intakeFindUnique.mockResolvedValue(storedIntake());

    const response = await patchIntake(
      request({
        answers: {
          event: { type: "wedding", primaryName: "Maria", date: "" },
          schedule: [],
        },
        lastStep: "locations",
      }),
      tokenParams(),
    );

    expect(response.status).toBe(200);
    expect(db.answerUpsert).toHaveBeenCalledTimes(2);
    expect(db.answerUpsert.mock.calls[0][0]).toMatchObject({
      where: { intakeId_key: { intakeId: "intake_1", key: "event" } },
      create: { intakeId: "intake_1", key: "event" },
    });
    const update = db.intakeUpdate.mock.calls[0][0];
    expect(update.where).toEqual({ id: "intake_1" });
    expect(update.data.lastStep).toBe("locations");
    expect(update.data.answersUpdatedAt).toBeInstanceOf(Date);
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it("skips unchanged answers so the admin's change markers stay precise", async () => {
    db.intakeFindUnique.mockResolvedValue(storedIntake());
    db.answerFindMany.mockResolvedValue([
      { key: "notes", value: { text: "Olá" } },
      { key: "gifts", value: { text: "IBAN", enabled: true } },
    ]);

    const response = await patchIntake(
      request({
        answers: {
          notes: { text: "Olá" },
          gifts: { enabled: true, text: "IBAN 2" },
        },
      }),
      tokenParams(),
    );

    expect(response.status).toBe(200);
    expect(db.answerUpsert).toHaveBeenCalledTimes(1);
    expect(db.answerUpsert.mock.calls[0][0].where.intakeId_key.key).toBe(
      "gifts",
    );
    expect(db.intakeUpdate.mock.calls[0][0].data.answersUpdatedAt).toBeInstanceOf(
      Date,
    );
  });

  it("does not bump answersUpdatedAt when nothing changed", async () => {
    db.intakeFindUnique.mockResolvedValue(storedIntake());
    db.answerFindMany.mockResolvedValue([
      { key: "notes", value: { text: "Olá" } },
    ]);

    await patchIntake(
      request({ answers: { notes: { text: "Olá" } }, lastStep: "extras" }),
      tokenParams(),
    );

    expect(db.answerUpsert).not.toHaveBeenCalled();
    const { data } = db.intakeUpdate.mock.calls[0][0];
    expect(data.answersUpdatedAt).toBeUndefined();
    expect(data.lastStep).toBe("extras");
  });

  it("updates contact columns but never blanks them", async () => {
    db.intakeFindUnique.mockResolvedValue(storedIntake());
    await patchIntake(
      request({ contact: { name: "", whatsapp: "+351 910 000 000" } }),
      tokenParams(),
    );
    const { data } = db.intakeUpdate.mock.calls[0][0];
    expect(data.contactWhatsapp).toBe("351910000000");
    expect("contactName" in data).toBe(false);
  });

  it("answers 404 for unknown or malformed tokens", async () => {
    db.intakeFindUnique.mockResolvedValue(null);
    expect(
      (await patchIntake(request({ answers: {} }), tokenParams())).status,
    ).toBe(404);
    expect(
      (await patchIntake(request({ answers: {} }), tokenParams("bad"))).status,
    ).toBe(404);
  });

  it("answers 409 once the intake is in production or archived", async () => {
    db.intakeFindUnique.mockResolvedValue(
      storedIntake({ status: "in_production" }),
    );
    const response = await patchIntake(
      request({ answers: { notes: { text: "x" } } }),
      tokenParams(),
    );
    expect(response.status).toBe(409);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects unknown keys, bad formats and unknown steps", async () => {
    db.intakeFindUnique.mockResolvedValue(storedIntake());
    expect(
      (await patchIntake(request({ answers: { hack: 1 } }), tokenParams()))
        .status,
    ).toBe(400);
    expect(
      (
        await patchIntake(
          request({ answers: { event: { date: "20/05/2027" } } }),
          tokenParams(),
        )
      ).status,
    ).toBe(400);
    expect(
      (await patchIntake(request({ lastStep: "nope" }), tokenParams())).status,
    ).toBe(400);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});

describe("POST /api/intakes/[token]/submit", () => {
  const completeAnswers = [
    {
      key: "event",
      value: { type: "wedding", primaryName: "Maria", date: "2027-05-20" },
      updatedAt: new Date(),
    },
    {
      key: "locations",
      value: [{ name: "Igreja" }],
      updatedAt: new Date(),
    },
  ];

  it("answers 422 with the first invalid step", async () => {
    db.intakeFindUnique.mockResolvedValue(
      storedIntake({ answers: [completeAnswers[0]] }),
    );
    const response = await submitIntake(request({}), tokenParams());
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: "invalid_answers",
      step: "locations",
    });
    expect(db.intakeUpdate).not.toHaveBeenCalled();
  });

  it("marks a complete draft as submitted", async () => {
    db.intakeFindUnique.mockResolvedValue(
      storedIntake({ answers: completeAnswers }),
    );
    db.intakeUpdate.mockResolvedValue({
      submittedAt: new Date("2026-09-26T12:00:00Z"),
    });

    const response = await submitIntake(request({}), tokenParams());

    expect(response.status).toBe(200);
    const { data } = db.intakeUpdate.mock.calls[0][0];
    expect(data.status).toBe("submitted");
    expect(data.submittedAt).toBeInstanceOf(Date);
    expect(data.answersUpdatedAt).toBeInstanceOf(Date);
  });

  it("keeps the first submission date on re-submit", async () => {
    const first = new Date("2026-09-20T10:00:00Z");
    db.intakeFindUnique.mockResolvedValue(
      storedIntake({
        status: "submitted",
        submittedAt: first,
        answers: completeAnswers,
      }),
    );
    db.intakeUpdate.mockResolvedValue({ submittedAt: first });

    await submitIntake(request({}), tokenParams());

    expect(db.intakeUpdate.mock.calls[0][0].data.submittedAt).toBe(first);
  });

  it("answers 409 when read-only", async () => {
    db.intakeFindUnique.mockResolvedValue(
      storedIntake({ status: "archived", answers: completeAnswers }),
    );
    expect((await submitIntake(request({}), tokenParams())).status).toBe(409);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { sourceInvitationRow, sourceTheme } from "./fixtures/invitation-duplication";

const db = vi.hoisted(() => {
  const tx = {
    theme: { findUnique: vi.fn(), create: vi.fn() },
    invitation: { create: vi.fn() },
    saveTheDate: { create: vi.fn() },
    intake: { update: vi.fn() },
  };
  return {
    tx,
    invitationFindUnique: vi.fn(),
    invitationFindMany: vi.fn(),
    saveTheDateFindUnique: vi.fn(),
    saveTheDateFindMany: vi.fn(),
    intakeFindUnique: vi.fn(),
    intakeCreate: vi.fn(),
    intakeUpdate: vi.fn(),
    intakeDelete: vi.fn(),
    transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    invitation: {
      findUnique: db.invitationFindUnique,
      findMany: db.invitationFindMany,
    },
    saveTheDate: {
      findUnique: db.saveTheDateFindUnique,
      findMany: db.saveTheDateFindMany,
    },
    intake: {
      findUnique: db.intakeFindUnique,
      create: db.intakeCreate,
      update: db.intakeUpdate,
      delete: db.intakeDelete,
    },
    $transaction: db.transaction,
  },
}));

import { POST as createIntake } from "@/app/api/admin/intakes/route";
import {
  DELETE as deleteIntake,
  PATCH as patchIntake,
} from "@/app/api/admin/intakes/[id]/route";
import { POST as markViewed } from "@/app/api/admin/intakes/[id]/viewed/route";
import { POST as applyIntake } from "@/app/api/admin/intakes/[id]/apply/route";

function request(body?: unknown) {
  return new Request("http://localhost/api/admin/intakes", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "convites.test",
      "x-forwarded-proto": "https",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const idParams = (id = "intake_1") => ({ params: Promise.resolve({ id }) });

const demoSummaryRow = {
  id: "inv_demo",
  slug: "aurora",
  isDemo: true,
  couple: { bride: "Ana", groom: "João" },
  heroImage: "",
  landingModelName: "Aurora",
  landingImageUrl: null,
  landingCustomizationLevel: "fully_customizable",
  blockedAt: null,
  blockedReason: null,
};

const answers = [
  {
    key: "event",
    value: {
      type: "wedding",
      primaryName: "Maria",
      secondaryName: "Pedro",
      date: "2027-05-20",
    },
    updatedAt: new Date(),
  },
  { key: "locations", value: [{ name: "Igreja" }], updatedAt: new Date() },
];

function loadedIntake(overrides: Record<string, unknown> = {}) {
  return {
    id: "intake_1",
    token: "t".repeat(43),
    productKind: "convite",
    invitationId: "inv_demo",
    saveTheDateId: null,
    status: "submitted",
    contactName: "Maria",
    contactWhatsapp: "258841234567",
    submittedAt: new Date(),
    answers,
    invitation: demoSummaryRow,
    saveTheDate: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.intakeCreate.mockImplementation(async ({ data }) => ({
    id: "intake_new",
    ...data,
  }));
  db.intakeUpdate.mockImplementation(async ({ data }) => ({
    id: "intake_1",
    ...data,
  }));
  db.tx.theme.findUnique.mockResolvedValue(null);
  db.tx.theme.create.mockResolvedValue({ ...sourceTheme, id: "theme_copy" });
  db.tx.invitation.create.mockResolvedValue({ id: "inv_new" });
  db.tx.saveTheDate.create.mockResolvedValue({ id: "std_new" });
  db.tx.intake.update.mockResolvedValue({});
  db.invitationFindMany.mockResolvedValue([]);
  db.saveTheDateFindMany.mockResolvedValue([]);
});

describe("POST /api/admin/intakes", () => {
  it("creates an admin intake for a demo and returns its public link", async () => {
    db.invitationFindUnique.mockResolvedValue(demoSummaryRow);

    const response = await createIntake(
      request({
        productKind: "convite",
        demoId: "inv_demo",
        contactName: "Maria",
        contactWhatsapp: "+258 84 123 4567",
      }),
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.id).toBe("intake_new");
    expect(json.url).toMatch(
      /^https:\/\/convites\.test\/personalizar\/[A-Za-z0-9_-]{43}$/,
    );
    expect(db.intakeCreate.mock.calls[0][0].data).toMatchObject({
      source: "admin",
      status: "draft",
      invitationId: "inv_demo",
      demoName: "Aurora",
      contactName: "Maria",
      contactWhatsapp: "258841234567",
    });
  });

  it("allows creating a link before knowing the customer", async () => {
    db.invitationFindUnique.mockResolvedValue(demoSummaryRow);
    const response = await createIntake(
      request({ productKind: "convite", demoId: "inv_demo" }),
    );
    expect(response.status).toBe(201);
    expect(db.intakeCreate.mock.calls[0][0].data).toMatchObject({
      contactName: null,
      contactWhatsapp: null,
    });
  });

  it("refuses records that are not demos", async () => {
    db.invitationFindUnique.mockResolvedValue({
      ...demoSummaryRow,
      isDemo: false,
    });
    const response = await createIntake(
      request({ productKind: "convite", demoId: "inv_demo" }),
    );
    expect(response.status).toBe(404);
  });
});

describe("PATCH/DELETE /api/admin/intakes/[id]", () => {
  it("changes status and contact", async () => {
    db.intakeFindUnique.mockResolvedValue({ id: "intake_1" });
    const response = await patchIntake(
      request({ status: "archived", contactWhatsapp: "+351 910 000 000" }),
      idParams(),
    );
    expect(response.status).toBe(200);
    expect(db.intakeUpdate.mock.calls[0][0].data).toEqual({
      status: "archived",
      contactWhatsapp: "351910000000",
    });
  });

  it("rejects unknown statuses", async () => {
    db.intakeFindUnique.mockResolvedValue({ id: "intake_1" });
    expect(
      (await patchIntake(request({ status: "done" }), idParams())).status,
    ).toBe(400);
  });

  it("deletes an intake", async () => {
    db.intakeFindUnique.mockResolvedValue({ id: "intake_1" });
    db.intakeDelete.mockResolvedValue({});
    const response = await deleteIntake(request(), idParams());
    expect(response.status).toBe(200);
    expect(db.intakeDelete).toHaveBeenCalledWith({ where: { id: "intake_1" } });
  });

  it("records the admin's visit", async () => {
    db.intakeFindUnique.mockResolvedValue({ id: "intake_1" });
    const response = await markViewed(request(), idParams());
    expect(response.status).toBe(200);
    expect(db.intakeUpdate.mock.calls[0][0].data.adminViewedAt).toBeInstanceOf(
      Date,
    );
  });
});

describe("POST /api/admin/intakes/[id]/apply", () => {
  it("creates the customer invitation and moves the intake to production atomically", async () => {
    db.intakeFindUnique.mockResolvedValue(loadedIntake());
    db.invitationFindUnique.mockResolvedValue({
      ...sourceInvitationRow,
      renderMode: "standard",
      theme: sourceTheme,
    });
    db.invitationFindMany.mockResolvedValue([{ slug: "maria-pedro" }]);

    const response = await applyIntake(request(), idParams());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      kind: "convite",
      id: "inv_new",
      editPath: "/admin/invitations/inv_new/edit",
    });

    const created = db.tx.invitation.create.mock.calls[0][0].data;
    expect(created.slug).toBe("maria-pedro-2");
    expect(created.couple).toEqual({
      bride: "Maria",
      groom: "Pedro",
      monogram: "M&P",
    });
    expect(created.isDemo).toBe(false);
    expect(created.theme).toEqual({ connect: { id: "theme_copy" } });
    expect(db.tx.intake.update).toHaveBeenCalledWith({
      where: { id: "intake_1" },
      data: { status: "in_production", createdInvitationId: "inv_new" },
    });
  });

  it("creates a customer Save the Date from an STD intake", async () => {
    db.intakeFindUnique.mockResolvedValue(
      loadedIntake({
        productKind: "save-the-date",
        invitationId: null,
        saveTheDateId: "std_demo",
        invitation: null,
        saveTheDate: {
          id: "std_demo",
          slug: "vintage",
          isDemo: true,
          couple: {},
          landingModelName: "Vintage",
          landingImageUrl: null,
          landingCustomizationLevel: "pre_designed",
        },
        answers: [answers[0]],
      }),
    );
    db.saveTheDateFindUnique.mockResolvedValue({
      themeId: "std_theme",
      envelope: null,
      textStyles: null,
      rsvp: null,
      audio: null,
      bottomHero: null,
      customMessage: null,
    });

    const response = await applyIntake(request(), idParams());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      kind: "save-the-date",
      id: "std_new",
      editPath: "/admin/save-the-dates/std_new/edit",
    });
    expect(db.tx.saveTheDate.create.mock.calls[0][0].data.slug).toBe(
      "maria-pedro",
    );
    expect(db.tx.intake.update).toHaveBeenCalledWith({
      where: { id: "intake_1" },
      data: { status: "in_production", createdSaveTheDateId: "std_new" },
    });
  });

  it("refuses intakes already in production or archived", async () => {
    db.intakeFindUnique.mockResolvedValue(
      loadedIntake({ status: "in_production" }),
    );
    expect((await applyIntake(request(), idParams())).status).toBe(409);
    db.intakeFindUnique.mockResolvedValue(loadedIntake({ status: "archived" }));
    expect((await applyIntake(request(), idParams())).status).toBe(409);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("answers 409 when the demo was deleted", async () => {
    db.intakeFindUnique.mockResolvedValue(
      loadedIntake({ invitationId: null, invitation: null }),
    );
    const response = await applyIntake(request(), idParams());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "demo_missing" });
  });

  it("answers 404 for an unknown intake", async () => {
    db.intakeFindUnique.mockResolvedValue(null);
    expect((await applyIntake(request(), idParams())).status).toBe(404);
  });
});

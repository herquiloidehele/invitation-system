import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { InvitationDuplicateNotice } from "@/components/admin/InvitationDuplicateNotice";

it("explains source isolation and independent theme creation", () => {
  const html = renderToStaticMarkup(
    createElement(InvitationDuplicateNotice, {
      sourceCustomerName: "Ana & João",
    }),
  );

  expect(html).toContain("Ana &amp; João");
  expect(html).toContain("não afetam o convite original");
  expect(html).toContain("cópia independente do tema");
});
